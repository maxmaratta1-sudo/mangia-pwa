"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useCartStore } from "../../../store/cartStore";
import { ShoppingBag, Loader2 } from "lucide-react";

export default function CheckoutPage({ params }: { params: { locale: string } }) {
  const router   = useRouter();
  const locale   = params.locale ?? "it";
  const items    = useCartStore((s) => s.items);
  const total    = useCartStore((s) => s.totalPrice());
  const [loading, setLoading] = useState(false);
  const [error,   setError  ] = useState<string | null>(null);

  const labels: Record<string, any> = {
    it: {
      title:    "Riepilogo ordine",
      pay:      "Paga ora",
      empty:    "Il carrello è vuoto",
      error:    "Errore durante il pagamento. Riprova.",
      total:    "Totale",
      subtitle: "Verrai reindirizzato a Stripe per il pagamento sicuro.",
    },
    es: {
      title:    "Resumen del pedido",
      pay:      "Pagar ahora",
      empty:    "El carrito está vacío",
      error:    "Error durante el pago. Inténtalo de nuevo.",
      total:    "Total",
      subtitle: "Serás redirigido a Stripe para el pago seguro.",
    },
    en: {
      title:    "Order summary",
      pay:      "Pay now",
      empty:    "Your cart is empty",
      error:    "Payment error. Please try again.",
      total:    "Total",
      subtitle: "You will be redirected to Stripe for secure payment.",
    },
  };

  const t = labels[locale] ?? labels.it;

  async function handleCheckout() {
    if (items.length === 0) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items, locale }),
      });

      const data = await res.json();

      if (data.error) {
        setError(t.error);
        setLoading(false);
        return;
      }

      // Redirect a Stripe Checkout
      window.location.href = data.url;
    } catch {
      setError(t.error);
      setLoading(false);
    }
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
        <ShoppingBag size={48} className="text-graphite-300 mb-4" />
        <p className="text-graphite-400 text-sm">{t.empty}</p>
      </div>
    );
  }

  return (
    <div className="px-4 pt-6 pb-10 animate-fade-in">
      <h1 className="font-display text-xl font-bold text-graphite-800 mb-6">{t.title}</h1>

      {/* Items */}
      <div className="bg-white rounded-2xl shadow-card p-4 mb-4">
        <div className="flex flex-col gap-3">
          {items.map((item) => (
            <div key={item.id} className="flex items-center justify-between">
              <div>
                <p className="text-graphite-800 text-sm font-medium">{item.name}</p>
                <p className="text-graphite-400 text-xs">x{item.quantity}</p>
              </div>
              <span className="text-graphite-700 text-sm font-semibold">
                €{(item.price * item.quantity).toFixed(2)}
              </span>
            </div>
          ))}
        </div>

        <div className="border-t border-graphite-100 mt-3 pt-3 flex justify-between">
          <span className="font-display font-bold text-graphite-800">{t.total}</span>
          <span className="font-display font-bold text-terracotta-600 text-lg">
            €{total.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Stripe note */}
      <p className="text-graphite-400 text-xs text-center mb-6">{t.subtitle}</p>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
          <p className="text-red-600 text-sm text-center">{error}</p>
        </div>
      )}

      {/* Pay button */}
      <button
        onClick={handleCheckout}
        disabled={loading}
        className="w-full h-12 rounded-xl bg-terracotta-500 text-white font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-60 transition-opacity shadow-warm-md"
      >
        {loading ? (
          <Loader2 size={18} className="animate-spin" />
        ) : (
          <>
            <ShoppingBag size={18} />
            {t.pay} — €{total.toFixed(2)}
          </>
        )}
      </button>
    </div>
  );
}