import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../lib/supabase/server";

const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN!;
const WA_TOKEN    = process.env.WHATSAPP_TOKEN!;
const PHONE_ID    = process.env.WHATSAPP_PHONE_NUMBER_ID!;

// ── GET — verifica webhook Meta ──────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode      = searchParams.get("hub.mode");
  const token     = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 });
  }
  return new NextResponse("Forbidden", { status: 403 });
}

// ── POST — riceve messaggi da WhatsApp ───────────────────────────────────────
export async function POST(req: NextRequest) {
  const body = await req.json();

  const entry   = body.entry?.[0];
  const changes = entry?.changes?.[0];
  const value   = changes?.value;
  const message = value?.messages?.[0];

  if (!message) return NextResponse.json({ ok: true });

  const from = message.from; // numero del cliente
  const text = message.text?.body ?? "";

  // Fetch menu da Supabase per il contesto di Maia
  const supabase = await createClient();
  const { data: products } = await supabase
    .from("products")
    .select("id, name_i18n, description_i18n, price")
    .eq("is_available", true);

  const { data: promotions } = await supabase
    .from("promotions")
    .select("title_i18n, description_i18n")
    .eq("is_active", true);

  const menuContext = (products ?? [])
    .map((p: any) => `- ${p.name_i18n?.it ?? ""}: ${p.description_i18n?.it ?? ""} — €${p.price}`)
    .join("\n");

  const promoContext = (promotions ?? [])
    .map((pr: any) => `- ${pr.title_i18n?.it ?? ""}: ${pr.description_i18n?.it ?? ""}`)
    .join("\n") || "Nessuna promozione attiva.";

  // Chiama Claude (Maia) per generare la risposta
  const aiResponse = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY!,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-5",
      max_tokens: 500,
      system: `Sei Maia, l'assistente AI di MA'N'GIA — Al Localino · Street Pinsa.
Rispondi sempre in italiano, in modo cordiale e conciso (max 3 righe).
Sei su WhatsApp quindi usa un tono informale e friendly. Niente markdown.

MENÙ:
${menuContext}

PROMOZIONI:
${promoContext}

INFORMAZIONI:
- Indirizzo: Piazza Unità d'Italia 11, Lanciano (CH)
- Solo d'asporto, parcheggio gratuito davanti
- Orari: Lun-Ven 11:30-14:30 e 17:00-21:00 | Sab 08:00-14:00 | Dom chiuso
- Pagamenti: carta, contanti, Apple Pay, Google Pay
- Catering su richiesta, valutato caso per caso
- Per ordinare: scarica l'app su mangia-pwa.vercel.app`,
      messages: [{ role: "user", content: text }],
    }),
  });

  const aiData = await aiResponse.json();
  const reply  = aiData.content?.[0]?.text ?? "Ciao! Come posso aiutarti? 🍕";

  // Invia risposta su WhatsApp
  await fetch(`https://graph.facebook.com/v18.0/${PHONE_ID}/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${WA_TOKEN}`,
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: from,
      type: "text",
      text: { body: reply },
    }),
  });

  return NextResponse.json({ ok: true });
}