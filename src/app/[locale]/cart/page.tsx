"use client";

import { useState, useEffect } from "react";
import { useCartStore } from "../../../store/cartStore";
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight } from "lucide-react";
import { WelcomePopup } from "../../../components/ui/WelcomePopup";
import { createClient } from "../../../lib/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function CartPage({ params }: { params: { locale: string } }) {
  const locale     = params.locale ?? "it";
  const router     = useRouter();
  const { items, updateQty, removeItem, totalPrice, clearCart } = useCartStore();
  const [showPopup, setShowPopup] = useState(false);
  const [checking,  setChecking ] = useState(false);

  async function handleCheckout() {
    setChecking(true);
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    setChecking(false);

    if (!session) {
      setShowPopup(true);
      return;
    }

    router.push(`/${locale}/checkout`);
  }

  function handleContinueAsGuest() {
    setShowPopup(false);
    router.push(`/${locale}/checkout`);
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
        <ShoppingBag size={48} className="text-graphite-200 mb-4" />
        <h2 className="font-display text-xl font-bold text-graphite-700 mb-2">
          Il carrello è vuoto
        </h2>
        <p className="text-graphite-400 text-sm mb-6">
          Aggiungi qualcosa di buono dal menù!
        </p>
        <Link
          href={`/${locale}/menu`}
          className="inline-flex items-center gap-2 bg-terracotta-500 text-white px-6 py-3 rounded-xl font-medium text-sm hover:bg-terracotta-600 transition-all"
        >
          Vai al menù
          <ArrowRight size={16} />
        </Link>
      </div>
    );
  }

  return (
    <div className="px-4 pt-6 pb-32 animate-fade-in">

      {showPopup && (
        <WelcomePopup
          locale={locale}
          onClose={() => setShowPopup(false)}
          onContinueAsGuest={handleContinueAsGuest}
        />
      )}

      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-bold text-graphite-800">
          Il carrello
        </h1>
        <button
          onClick={clearCart}
          className="text-graphite-400 text-xs hover:text-terracotta-600 transition-colors"
        >
          Svuota
        </button>
      </div>

      {/* Items */}
      <div className="flex flex-col gap-3 mb-6">
        {items.map((item) => (
          <div key={item.id} className="bg-white rounded-2xl p-4 shadow-card">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <h3 className="font-display font-semibold text-graphite-800 text-sm mb-1">
                  {item.name}
                </h3>
                <p className="text-terracotta-600 font-bold text-sm">
                  € {(item.price * item.quantity).toFixed(2)}
                </p>
                {item.quantity > 1 && (
                  <p className="text-graphite-400 text-xs">
                    € {item.price.toFixed(2)} cad.
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => updateQty(item.id, item.quantity - 1)}
                  className="w-8 h-8 rounded-full border border-graphite-200 flex items-center justify-center text-graphite-600 hover:border-terracotta-400 hover:text-terracotta-600 transition-all"
                >
                  {item.quantity === 1 ? <Trash2 size={14} /> : <Minus size={14} />}
                </button>
                <span className="font-bold text-graphite-800 text-sm w-4 text-center">
                  {item.quantity}
                </span>
                <button
                  onClick={() => updateQty(item.id, item.quantity + 1)}
                  className="w-8 h-8 rounded-full bg-terracotta-500 text-white flex items-center justify-center hover:bg-terracotta-600 transition-all"
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Resumen */}
      <div className="bg-white rounded-2xl shadow-card p-4 mb-4">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-graphite-500">Subtotale</span>
          <span className="text-graphite-700 font-medium">€ {totalPrice().toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm mb-3 pb-3 border-b border-graphite-100">
          <span className="text-graphite-500">Sconto</span>
          <span className="text-olive-600 font-medium">€ 0.00</span>
        </div>
        <div className="flex justify-between">
          <span className="font-display font-bold text-graphite-800">Totale</span>
          <span className="font-display font-bold text-terracotta-600 text-lg">
            € {totalPrice().toFixed(2)}
          </span>
        </div>
      </div>

      {/* Modalità */}
      <div className="bg-white rounded-2xl shadow-card p-4 mb-6">
        <h3 className="font-display font-semibold text-graphite-700 text-sm mb-3">
          Come preferisci?
        </h3>
        <div className="grid grid-cols-2 gap-2">
          <button className="py-3 px-4 rounded-xl border-2 border-terracotta-500 bg-terracotta-50 text-terracotta-700 text-sm font-medium">
            🏃 Ritiro al banco
          </button>
          <button className="py-3 px-4 rounded-xl border border-graphite-200 text-graphite-600 text-sm font-medium hover:border-terracotta-300 transition-all">
            🛍️ D'asporto
          </button>
        </div>
      </div>

      {/* CTA */}
      <div className="fixed bottom-20 left-0 right-0 px-4">
        <button
          onClick={handleCheckout}
          disabled={checking}
          className="flex items-center justify-between w-full max-w-lg mx-auto bg-terracotta-500 text-white px-6 py-4 rounded-2xl shadow-warm-lg hover:bg-terracotta-600 transition-all disabled:opacity-60"
        >
          <span className="font-medium">
            {checking ? "Verifica..." : "Procedi al pagamento"}
          </span>
          <div className="flex items-center gap-2">
            <span className="font-bold">€ {totalPrice().toFixed(2)}</span>
            <ArrowRight size={18} />
          </div>
        </button>
      </div>
    </div>
  );
}