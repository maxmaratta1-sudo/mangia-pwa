import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "../../../../lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
    const { userId, stripeSessionId } = await req.json();

    if (!userId || !stripeSessionId) {
      return NextResponse.json({ error: "Missing params" }, { status: 400 });
    }

    // Recupera la sessione da Stripe
    const session = await stripe.checkout.sessions.retrieve(stripeSessionId);
    if (session.payment_status !== "paid") {
      return NextResponse.json({ error: "Not paid" }, { status: 400 });
    }

    const amount = (session.amount_total ?? 0) / 100;
    const supabase = await createClient();

    // Controlla se l'ordine esiste già (evita duplicati)
    const { data: existing } = await supabase
      .from("orders")
      .select("id")
      .eq("stripe_session_id", stripeSessionId)
      .single();

    if (existing) {
      return NextResponse.json({ ok: true, already: true });
    }

    // Crea l'ordine
    const { data: order } = await supabase
      .from("orders")
      .insert({
        user_id:           userId,
        total:             amount,
        status:            "received",
        payment_method:    "stripe",
        stripe_session_id: stripeSessionId,
      })
      .select()
      .single();

    // Accredita i punti
    const pointsToAdd = Math.floor(amount);
    if (order && pointsToAdd > 0) {
      await supabase.rpc("add_loyalty_points", {
        p_user_id:  userId,
        p_points:   pointsToAdd,
        p_reason:   "purchase",
        p_order_id: order.id,
      });
    }

    return NextResponse.json({ ok: true, points: pointsToAdd });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}