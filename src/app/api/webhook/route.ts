import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "../../../lib/supabase/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig  = req.headers.get("stripe-signature")!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.CheckoutSession;
    const userId  = session.metadata?.userId;
    const amount  = (session.amount_total ?? 0) / 100;

    if (userId) {
      const supabase = await createClient();

      // Crear el orden en Supabase
      const { data: order } = await supabase
        .from("orders")
        .insert({
          user_id:       userId,
          total_amount:  amount,
          status:        "confirmed",
          payment_method: "stripe",
          stripe_session_id: session.id,
        })
        .select()
        .single();

      // Agregar puntos fidelità (1 punto por cada euro)
      const pointsToAdd = Math.floor(amount);

      if (order) {
        await supabase.rpc("add_loyalty_points", {
          p_user_id:  userId,
          p_points:   pointsToAdd,
          p_reason:   "purchase",
          p_order_id: order.id,
        });
      }
    }
  }

  return NextResponse.json({ received: true });
}