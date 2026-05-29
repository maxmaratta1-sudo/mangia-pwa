import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../lib/supabase/server";
import { loadMaiaContext, buildMaiaSystemPrompt, callMaia } from "../../../lib/maia";

const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN!;
const WA_TOKEN     = process.env.WHATSAPP_TOKEN!;
const PHONE_ID     = process.env.WHATSAPP_PHONE_NUMBER_ID!;

// ── GET — verifica del webhook (Meta) ────────────────────────────────────────
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

// ── POST — recibe mensajes de WhatsApp y responde con Maia ───────────────────
export async function POST(req: NextRequest) {
  const body = await req.json();

  const message = body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
  if (!message) return NextResponse.json({ ok: true });

  const from = message.from;              // número del cliente
  const text = message.text?.body ?? "";

  // Mismo cerebro que la app, en modo "whatsapp" (sin carrito, refleja el idioma)
  const supabase = await createClient();
  const { menuContext, promoContext } = await loadMaiaContext(supabase, "it");

  const system = buildMaiaSystemPrompt({
    channel: "whatsapp",
    menuContext,
    promoContext,
  });

  const reply =
    (await callMaia({
      system,
      messages: [{ role: "user", content: text }],
      maxTokens: 500,
    })) || "Ciao! Come posso aiutarti? 🍕";

  // Envía la respuesta de vuelta por WhatsApp
  await fetch(`https://graph.facebook.com/v21.0/${PHONE_ID}/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${WA_TOKEN}`,
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