"use client";

import { useEffect, useState } from "react";
import { createClient }        from "../../../lib/supabase/client";
import { ShoppingBag, Users, Star, TrendingUp } from "lucide-react";

export default function AdminDashboard() {
  const [stats,   setStats  ] = useState({ orders: 0, customers: 0, points: 0, revenue: 0 });
  const [orders,  setOrders ] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();

      const [{ count: orderCount }, { count: customerCount }, { data: recentOrders }, { data: loyaltyData }] =
        await Promise.all([
          supabase.from("orders").select("*", { count: "exact", head: true }),
          supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "customer"),
          supabase.from("orders").select("*, profiles(full_name)").order("created_at", { ascending: false }).limit(5),
          supabase.from("loyalty_accounts").select("total_points"),
        ]);

      const totalRevenue = recentOrders?.reduce((sum, o) => sum + Number(o.total), 0) ?? 0;
      const totalPoints  = loyaltyData?.reduce((sum, l) => sum + l.total_points, 0) ?? 0;

      setStats({
        orders:    orderCount    ?? 0,
        customers: customerCount ?? 0,
        points:    totalPoints,
        revenue:   totalRevenue,
      });
      setOrders(recentOrders ?? []);
      setLoading(false);
    }
    load();
  }, []);

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

  if (loading) {
    return <div className="flex items-center justify-center min-h-[40vh]"><p className="text-graphite-400 text-sm">Caricamento…</p></div>;
  }

  return (
    <div className="animate-fade-in">
      <h1 className="font-display text-2xl font-bold text-graphite-800 mb-6">Dashboard</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-white rounded-2xl p-4 shadow-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-graphite-500 text-xs font-medium">Ordini totali</span>
            <ShoppingBag size={16} className="text-terracotta-400" />
          </div>
          <p className="font-display text-3xl font-bold text-graphite-800">{stats.orders}</p>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-graphite-500 text-xs font-medium">Clienti</span>
            <Users size={16} className="text-olive-400" />
          </div>
          <p className="font-display text-3xl font-bold text-graphite-800">{stats.customers}</p>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-graphite-500 text-xs font-medium">Punti emessi</span>
            <Star size={16} className="text-terracotta-400" />
          </div>
          <p className="font-display text-3xl font-bold text-graphite-800">{stats.points}</p>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-graphite-500 text-xs font-medium">Incasso totale</span>
            <TrendingUp size={16} className="text-olive-400" />
          </div>
          <p className="font-display text-3xl font-bold text-graphite-800">€ {stats.revenue.toFixed(0)}</p>
        </div>
      </div>

      {/* Ultimi ordini */}
      <div className="bg-white rounded-2xl shadow-card p-4">
        <h2 className="font-display font-semibold text-graphite-700 text-sm mb-4">Ultimi ordini</h2>
        <div className="flex flex-col divide-y divide-graphite-50">
          {orders.length === 0 ? (
            <p className="text-graphite-400 text-sm text-center py-4">Nessun ordine ancora.</p>
          ) : (
            orders.map((order) => (
              <div key={order.id} className="py-3 flex items-center justify-between">
                <div>
                  <p className="text-graphite-700 text-sm font-medium">
                    {order.profiles?.full_name ?? "Cliente"}
                  </p>
                  <p className="text-graphite-400 text-xs">
                    #{order.id.slice(0, 8).toUpperCase()} · € {Number(order.total).toFixed(2)}
                  </p>
                </div>
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${STATUS_COLORS[order.status] ?? "bg-graphite-100 text-graphite-600"}`}>
                  {STATUS_LABELS[order.status] ?? order.status}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}