import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../lib/supabase/server";
import {
  loadMaiaContext,
  buildMaiaSystemPrompt,
  callMaia,
  extractCartActions,
  type MaiaLocale,
} from "../../../lib/maia";

export async function POST(req: NextRequest) {
  const { messages, locale = "it" } = await req.json();

  const supabase = await createClient();
  const { menuContext, promoContext } = await loadMaiaContext(
    supabase,
    locale as MaiaLocale
  );

  const system = buildMaiaSystemPrompt({
    channel: "app",
    locale: locale as MaiaLocale,
    menuContext,
    promoContext,
  });

  const raw = await callMaia({ system, messages, maxTokens: 1000 });
  const { cleanText, cartActions } = extractCartActions(raw);

  return NextResponse.json({ text: cleanText, cartActions });
}