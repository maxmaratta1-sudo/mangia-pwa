"use client";

import { useState }     from "react";
import { useRouter }    from "next/navigation";
import { useCartStore } from "../../../store/cartStore";
import { createClient } from "../../../lib/supabase/client";
import { ArrowLeft, CheckCircle } from "lucide-react";
import Link             from "next/link";

export default function CheckoutPage({ params }: { params: { locale: string } }) {
  const router = useRouter();
  const loc    = params.locale ?? "it";

  const { items, totalPrice, clearCart } = useCartStore();
  const [orderType,    setOrderType   ] = useState<"dine_in" | "takeaway">("dine_in");
  const [notes,        setNotes       ] = useState("");
  const [loading,      setLoading     ] = useState(false);
  const [confirmed,    setConfirmed   ] = useState(false);
  const [orderId,      setOrderId     ] = useState("");
  const [pointsEarned, setPointsEarned] = useState(0);

  async function handleConfirm() {
    if (items.length === 0) return;
    setLoading(true);

    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      router.push(`/${loc}/auth/login`);
      return;
    }

    const subtotal = totalPrice();
    const total    = subtotal;
    const earned   = Math.floor(total); // ← nombre distinto al estado

    // Crear orden
    const { data: order, error } = await supabase
      .from("orders")
      .insert({
        user_id:       session.user.id,
        status:        "received",
        order_type:    orderType,
        subtotal:      subtotal,
        discount:      0,
        total:         total,
        points_earned: earned,
        notes:         notes || null,
      })
      .select()
      .single();

    if (error || !order) {
      setLoading(false);
      return;
    }

    // Insertar items
    await supabase.from("order_items").insert(
      items.map((item) => ({
        order_id:   order.id,
        product_id: item.id,
        quantity:   item.quantity,
        unit_price: item.price,
        subtotal:   item.price * item.quantity,
      }))
    );

    // Insertar transacción de puntos
    await supabase.from("loyalty_transactions").insert({
      user_id:      session.user.id,
      order_id:     order.id,
      points_delta: earned,
      reason:       "purchase",
      note:         `Ordine ${order.id.slice(0, 8)}`,
    });

    // Actualizar puntos del usuario
    const { data: loyalty } = await supabase
      .from("loyalty_accounts")
      .select("total_points, lifetime_points")
      .eq("user_id", session.user.id)
      .single();

    if (loyalty) {
      await supabase
        .from("loyalty_accounts")
        .update({
          total_points:    loyalty.total_points    + earned,
          lifetime_points: loyalty.lifetime_points + earned,
        })
        .eq("user_id", session.user.id);
    }

    // Limpiar carrito y mostrar confirmación
    setOrderId(order.id);
    setPointsEarned(earned);
    setConfirmed(true);
    clearCart();
    setLoading(false);
  }

  // Pantalla de confirmación
  if (confirmed) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center animate-fade-in">
        <div className="w-20 h-20 rounded-full bg-olive-100 flex items-center justify-center mb-4">
          <CheckCircle size={40} className="text-olive-600" />
        </div>
        <h1 className="font-display text-2xl font-bold text-graphite-800 mb-2">
          Ordine confermato!
        </h1>
        <p className="text-graphite-500 text-sm mb-2">
          Il tuo ordine è stato ricevuto.
        </p>
        <p className="text-graphite-400 text-xs mb-1">
          #{orderId.slice(0, 8).toUpperCase()}
        </p>
        <div className="bg-terracotta-50 border border-terracotta-200 rounded-xl px-4 py-3 mb-8 mt-2">
          <p className="text-terracotta-700 text-sm font-medium">
            🌟 Hai guadagnato {pointsEarned} punti!
          </p>
        </div>
        <Link
          href={`/${loc}`}
          className="bg-terracotta-500 text-white px-8 py-3 rounded-xl font-medium text-sm hover:bg-terracotta-600 transition-all"
        >
          Torna alla home
        </Link>
      </div>
    );
  }

  return (
    <div className="px-4 pt-6 pb-10 animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/${loc}/cart`} className="p-2 text-graphite-500 hover:text-graphite-800">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="font-display text-2xl font-bold text-graphite-800">Conferma ordine</h1>
      </div>

      {/* Riepilogo */}
      <div className="bg-white rounded-2xl shadow-card p-4 mb-4">
        <h2 className="font-display font-semibold text-graphite-700 text-sm mb-3">Il tuo ordine</h2>
        <div className="flex flex-col gap-2">
          {items.map((item) => (
            <div key={item.id} className="flex justify-between text-sm">
              <span className="text-graphite-600">{item.quantity}× {item.name}</span>
              <span className="text-graphite-700 font-medium">€ {(item.price * item.quantity).toFixed(2)}</span>
            </div>
          ))}
          <div className="border-t border-graphite-100 pt-2 mt-1 flex justify-between">
            <span className="font-display font-bold text-graphite-800">Totale</span>
            <span className="font-display font-bold text-terracotta-600">€ {totalPrice().toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Modalità */}
      <div className="bg-white rounded-2xl shadow-card p-4 mb-4">
        <h2 className="font-display font-semibold text-graphite-700 text-sm mb-3">Come preferisci?</h2>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setOrderType("dine_in")}
            className={`py-3 px-4 rounded-xl border-2 text-sm font-medium transition-all ${
              orderType === "dine_in"
                ? "border-terracotta-500 bg-terracotta-50 text-terracotta-700"
                : "border-graphite-200 text-graphite-600"
            }`}
          >
            🏃 Ritiro al banco
          </button>
          <button
            onClick={() => setOrderType("takeaway")}
            className={`py-3 px-4 rounded-xl border-2 text-sm font-medium transition-all ${
              orderType === "takeaway"
                ? "border-terracotta-500 bg-terracotta-50 text-terracotta-700"
                : "border-graphite-200 text-graphite-600"
            }`}
          >
            🛍️ D'asporto
          </button>
        </div>
      </div>

      {/* Note */}
      <div className="bg-white rounded-2xl shadow-card p-4 mb-6">
        <h2 className="font-display font-semibold text-graphite-700 text-sm mb-3">Note</h2>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Allergie, preferenze, richieste speciali…"
          rows={3}
          className="w-full px-3 py-2 rounded-xl border border-graphite-200 text-sm text-graphite-700 placeholder:text-graphite-300 focus:outline-none focus:ring-2 focus:ring-terracotta-400 resize-none"
        />
      </div>

      {/* Punti preview */}
      <div className="bg-olive-50 border border-olive-200 rounded-xl px-4 py-3 mb-6">
        <p className="text-olive-700 text-sm">
          🌟 Guadagnerai <span className="font-bold">{Math.floor(totalPrice())} punti</span> con questo ordine
        </p>
      </div>

      {/* Conferma */}
      <button
        onClick={handleConfirm}
        disabled={loading || items.length === 0}
        className="w-full h-14 bg-terracotta-500 text-white rounded-2xl font-medium text-base hover:bg-terracotta-600 active:scale-95 transition-all disabled:opacity-50 shadow-warm-md"
      >
        {loading ? "Invio in corso…" : `Conferma ordine — € ${totalPrice().toFixed(2)}`}
      </button>
    </div>
  );
}