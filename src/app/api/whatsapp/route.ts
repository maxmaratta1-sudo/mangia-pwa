import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../lib/supabase/server";
import { loadMaiaContext, buildMaiaSystemPrompt, callMaia } from "../../../lib/maia";
import {
  isStaffNumber,
  getStaffProfile,
  loadInternalContext,
  buildInternalMaiaSystemPrompt,
  callInternalMaia,
  extractInternalCommand,
  executeInternalCommand,
} from "../../../lib/maia-internal";

const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN!;
const WA_TOKEN     = process.env.WHATSAPP_TOKEN!;
const PHONE_ID     = process.env.WHATSAPP_PHONE_NUMBER_ID!;

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

// ── POST — riceve messaggi e decide: Maia cliente o Maia interna ─────────────
export async function POST(req: NextRequest) {
  const body = await req.json();

  const message = body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
  if (!message) return NextResponse.json({ ok: true });

  const from = message.from as string;
  const text = (message.text?.body ?? "") as string;

  const supabase = await createClient();
  let reply = "";

  if (isStaffNumber(from)) {
    // ── MAIA INTERNA (personale autorizzato) ──────────────────────────────
    const { ordersContext, revenueContext, productsContext } =
      await loadInternalContext(supabase);

    const staffProfile = getStaffProfile(from);
    const system = buildInternalMaiaSystemPrompt(
      { ordersContext, revenueContext, productsContext },
      staffProfile
    );

    const raw = await callInternalMaia(system, [{ role: "user", content: text }]);
    const { cleanText, command } = extractInternalCommand(raw);

    let actionNote = "";
    if (command) {
      actionNote = await executeInternalCommand(supabase, command);
    }
    reply = cleanText + actionNote;
  } else {
    // ── MAIA CLIENTE (flusso esistente) ───────────────────────────────────
    const { menuContext, promoContext } = await loadMaiaContext(supabase, "it");
    const system = buildMaiaSystemPrompt({ channel: "whatsapp", menuContext, promoContext });
    reply =
      (await callMaia({
        system,
        messages: [{ role: "user", content: text }],
        maxTokens: 500,
      })) || "Ciao! Come posso aiutarti? 🍕";
  }

  // ── Invia risposta via WhatsApp ───────────────────────────────────────────
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