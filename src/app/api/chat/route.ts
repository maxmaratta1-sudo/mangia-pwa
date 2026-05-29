import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../lib/supabase/server";
import {
  loadMaiaContext,
  buildMaiaSystemPrompt,
  callMaia,
  extractCartActions,
  type MaiaLocale,
  type MaiaCustomer,
} from "../../../lib/maia";

export async function POST(req: NextRequest) {
  const { messages, locale = "it" } = await req.json();
  const loc = locale as MaiaLocale;

  const supabase = await createClient();
  const { menuContext, promoContext } = await loadMaiaContext(supabase, loc);

  // ── Cliente logueado → personalización del Club ──────────────────────────
  let customer: MaiaCustomer | undefined;
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const [{ data: profile }, { data: loyalty }, { data: orders }] = await Promise.all([
        supabase.from("profiles").select("full_name").eq("id", user.id).single(),
        supabase.from("loyalty_accounts").select("total_points").eq("user_id", user.id).single(),
        supabase
          .from("orders")
          .select("order_items(products(name_i18n))")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(3),
      ]);

      // Solo el nombre de pila, para un saludo natural
      const fullName: string | undefined = profile?.full_name ?? undefined;
      const firstName = fullName ? fullName.trim().split(" ")[0] : undefined;

      // Productos de pedidos recientes (sin repetir)
      const recentItems: string[] = [];
      for (const o of orders ?? []) {
        for (const it of (o as any).order_items ?? []) {
          const nm =
            it?.products?.name_i18n?.[loc] ?? it?.products?.name_i18n?.it;
          if (nm && !recentItems.includes(nm)) recentItems.push(nm);
        }
      }

      customer = {
        name: firstName,
        points: loyalty?.total_points,
        recentItems: recentItems.slice(0, 5),
      };
    }
  } catch {
    // Si algo falla en la personalización, Maia sigue funcionando sin ella.
    customer = undefined;
  }

  const system = buildMaiaSystemPrompt({
    channel: "app",
    locale: loc,
    menuContext,
    promoContext,
    customer,
  });

  const raw = await callMaia({ system, messages, maxTokens: 1000 });
  const { cleanText, cartActions } = extractCartActions(raw);

  return NextResponse.json({ text: cleanText, cartActions });
}