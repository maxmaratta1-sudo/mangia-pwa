"use client";

import { useEffect, useState } from "react";
import { useRouter }           from "next/navigation";
import { createClient }        from "../../../lib/supabase/client";
import { ShoppingBag, ArrowRight } from "lucide-react";
import Link from "next/link";

const STATUS_LABELS: Record<string, string> = {
  received:  "Ricevuto",
  preparing: "In preparazione",
  ready:     "Pronto! Vieni a ritirare 🎉",
  completed: "Completato",
  cancelled: "Annullato",
};

const STATUS_COLORS: Record<string, string> = {
  received:  "bg-blue-100 text-blue-700",
  preparing: "bg-yellow-100 text-yellow-700",
  ready:     "bg-olive-100 text-olive-700",
  completed: "bg-graphite-100 text-graphite-600",
  cancelled: "bg-red-100 text-red-600",
};

export default function OrdersPage({ params }: { params: { locale: string } }) {
  const router = useRouter();
  const loc    = params.locale ?? "it";

  const [orders,  setOrders ] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push(`/${loc}/auth/login`); return; }

      const { data } = await supabase
        .from("orders")
        .select("*, order_items(quantity, unit_price, products(name_i18n))")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false });

      setOrders(data ?? []);
      setLoading(false);
    }
    load();
  }, []);

  function formatDate(date: string) {
    return new Date(date).toLocaleDateString("it-IT", {
      day:    "numeric",
      month:  "long",
      hour:   "2-digit",
      minute: "2-digit",
    });
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><p className="text-graphite-400 text-sm">Caricamento…</p></div>;
  }

  return (
    <div className="px-4 pt-6 pb-10 animate-fade-in">
      <h1 className="font-display text-2xl font-bold text-graphite-800 mb-6">
        I miei ordini
      </h1>

      {orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] text-center">
          <ShoppingBag size={48} className="text-graphite-200 mb-4" />
          <h2 className="font-display text-lg font-bold text-graphite-600 mb-2">
            Nessun ordine ancora
          </h2>
          <p className="text-graphite-400 text-sm mb-6">
            Fai il tuo primo ordine dal menù!
          </p>
          <Link
            href={`/${loc}/menu`}
            className="inline-flex items-center gap-2 bg-terracotta-500 text-white px-6 py-3 rounded-xl font-medium text-sm hover:bg-terracotta-600 transition-all"
          >
            Vai al menù <ArrowRight size={16} />
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {orders.map((order) => (
            <div key={order.id} className="bg-white rounded-2xl shadow-card p-4">

              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-graphite-400 text-xs">
                    #{order.id.slice(0, 8).toUpperCase()}
                  </p>
                  <p className="text-graphite-500 text-xs mt-0.5">
                    {formatDate(order.created_at)}
                  </p>
                </div>
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${STATUS_COLORS[order.status] ?? "bg-graphite-100 text-graphite-600"}`}>
                  {STATUS_LABELS[order.status] ?? order.status}
                </span>
              </div>

              {/* Items */}
              <div className="bg-graphite-50 rounded-xl p-3 mb-3">
                {order.order_items?.map((item: any, i: number) => (
                  <div key={i} className="flex justify-between text-xs text-graphite-600 py-0.5">
                    <span>{item.quantity}× {item.products?.name_i18n?.it ?? "Prodotto"}</span>
                    <span>€ {(item.unit_price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
                <div className="border-t border-graphite-200 mt-2 pt-2 flex justify-between">
                  <span className="text-sm font-bold text-graphite-700">Totale</span>
                  <span className="text-sm font-bold text-terracotta-600">€ {Number(order.total).toFixed(2)}</span>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between">
                <span className="text-graphite-400 text-xs">
                  {order.order_type === "dine_in" ? "🏃 Ritiro al banco" : "🛍️ D'asporto"}
                </span>
                {order.points_earned > 0 && (
                  <span className="text-olive-600 text-xs font-medium">
                    +{order.points_earned} pt
                  </span>
                )}
              </div>

              {/* Alert se pronto */}
              {order.status === "ready" && (
                <div className="mt-3 bg-olive-50 border border-olive-300 rounded-xl px-3 py-2">
                  <p className="text-olive-700 text-sm font-medium text-center">
                    🎉 Il tuo ordine è pronto! Vieni a ritirarlo.
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}