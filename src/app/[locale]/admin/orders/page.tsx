"use client";

import { useEffect, useState } from "react";
import { createClient }        from "../../../../lib/supabase/client";

const STATUS_LABELS: Record<string, string> = {
  received:  "Ricevuto",
  preparing: "In preparazione",
  ready:     "Pronto",
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

const NEXT_STATUS: Record<string, string> = {
  received:  "preparing",
  preparing: "ready",
  ready:     "completed",
};

export default function AdminOrdersPage() {
  const [orders,  setOrders ] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter ] = useState("all");

  useEffect(() => { loadOrders(); }, []);

  async function loadOrders() {
    const supabase = createClient();
    const { data } = await supabase
      .from("orders")
      .select("*, profiles(full_name), order_items(quantity, unit_price, products(name_i18n))")
      .order("created_at", { ascending: false });
    setOrders(data ?? []);
    setLoading(false);
  }

  async function updateStatus(orderId: string, newStatus: string) {
    const supabase = createClient();
    await supabase.from("orders").update({ status: newStatus }).eq("id", orderId);
    setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status: newStatus } : o));
  }

  const filtered = filter === "all" ? orders : orders.filter((o) => o.status === filter);

  if (loading) {
    return <div className="flex items-center justify-center min-h-[40vh]"><p className="text-graphite-400 text-sm">Caricamento…</p></div>;
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-graphite-800 mb-4">Ordini</h1>

      {/* Filtros */}
      <div className="flex gap-2 mb-4 overflow-x-auto no-scrollbar pb-1">
        {["all", "received", "preparing", "ready", "completed"].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
              filter === s
                ? "bg-graphite-800 text-white"
                : "bg-white text-graphite-600 border border-graphite-200"
            }`}
          >
            {s === "all" ? "Tutti" : STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      {/* Lista ordini */}
      <div className="flex flex-col gap-3">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center shadow-card">
            <p className="text-graphite-400 text-sm">Nessun ordine trovato.</p>
          </div>
        ) : (
          filtered.map((order) => (
            <div key={order.id} className="bg-white rounded-2xl shadow-card p-4">
              {/* Header ordine */}
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-display font-semibold text-graphite-800 text-sm">
                    {order.profiles?.full_name ?? "Cliente"}
                  </p>
                  <p className="text-graphite-400 text-xs">
                    #{order.id.slice(0, 8).toUpperCase()} · {order.order_type === "dine_in" ? "Al bancone" : "D'asporto"}
                  </p>
                </div>
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${STATUS_COLORS[order.status]}`}>
                  {STATUS_LABELS[order.status]}
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
                <div className="border-t border-graphite-200 mt-2 pt-2 flex justify-between text-sm font-bold">
                  <span className="text-graphite-700">Totale</span>
                  <span className="text-terracotta-600">€ {Number(order.total).toFixed(2)}</span>
                </div>
              </div>

              {/* Note */}
              {order.notes && (
                <p className="text-graphite-500 text-xs italic mb-3">📝 {order.notes}</p>
              )}

              {/* Azioni */}
              {NEXT_STATUS[order.status] && (
                <button
                  onClick={() => updateStatus(order.id, NEXT_STATUS[order.status])}
                  className="w-full py-2 bg-terracotta-500 text-white rounded-xl text-sm font-medium hover:bg-terracotta-600 transition-all"
                >
                  → {STATUS_LABELS[NEXT_STATUS[order.status]]}
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}