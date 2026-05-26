"use client";

import { useEffect, useState } from "react";
import { createClient }        from "../../../../lib/supabase/client";
import { Star }                from "lucide-react";

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading,   setLoading  ] = useState(true);
  const [adding,    setAdding   ] = useState<string | null>(null);
  const [pointsToAdd, setPointsToAdd] = useState<Record<string, number>>({});

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data } = await supabase
        .from("profiles")
        .select("*, loyalty_accounts(total_points, lifetime_points)")
        .eq("role", "customer")
        .order("created_at", { ascending: false });
      setCustomers(data ?? []);
      setLoading(false);
    }
    load();
  }, []);

  async function addPoints(userId: string, points: number) {
    if (!points || points <= 0) return;
    const supabase = createClient();

    const customer = customers.find((c) => c.id === userId);
    const current  = customer?.loyalty_accounts?.[0]?.total_points ?? 0;
    const lifetime = customer?.loyalty_accounts?.[0]?.lifetime_points ?? 0;

    await supabase.from("loyalty_transactions").insert({
      user_id:      userId,
      points_delta: points,
      reason:       "manual",
      note:         "Assegnazione manuale admin",
    });

    await supabase.from("loyalty_accounts").update({
      total_points:    current  + points,
      lifetime_points: lifetime + points,
    }).eq("user_id", userId);

    setCustomers((prev) => prev.map((c) =>
      c.id === userId
        ? { ...c, loyalty_accounts: [{ total_points: current + points, lifetime_points: lifetime + points }] }
        : c
    ));
    setAdding(null);
    setPointsToAdd((prev) => ({ ...prev, [userId]: 0 }));
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-[40vh]"><p className="text-graphite-400 text-sm">Caricamento…</p></div>;
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-graphite-800 mb-4">Clienti</h1>

      <div className="flex flex-col gap-3">
        {customers.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center shadow-card">
            <p className="text-graphite-400 text-sm">Nessun cliente registrato.</p>
          </div>
        ) : (
          customers.map((customer) => {
            const pts = customer.loyalty_accounts?.[0]?.total_points ?? 0;
            return (
              <div key={customer.id} className="bg-white rounded-2xl shadow-card p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-display font-semibold text-graphite-800 text-sm">
                      {customer.full_name ?? "—"}
                    </p>
                    <p className="text-graphite-400 text-xs">{customer.id.slice(0, 8).toUpperCase()}</p>
                  </div>
                  <div className="flex items-center gap-1 bg-terracotta-50 px-2 py-1 rounded-full">
                    <Star size={12} className="text-terracotta-500" />
                    <span className="text-terracotta-700 text-xs font-bold">{pts} pt</span>
                  </div>
                </div>

                {/* Aggiungi punti */}
                {adding === customer.id ? (
                  <div className="flex gap-2 mt-3">
                    <input
                      type="number"
                      min={1}
                      placeholder="Punti da aggiungere"
                      value={pointsToAdd[customer.id] || ""}
                      onChange={(e) => setPointsToAdd((prev) => ({ ...prev, [customer.id]: parseInt(e.target.value) || 0 }))}
                      className="flex-1 h-9 px-3 rounded-xl border border-graphite-200 text-sm focus:outline-none focus:ring-2 focus:ring-terracotta-400"
                    />
                    <button
                      onClick={() => addPoints(customer.id, pointsToAdd[customer.id] ?? 0)}
                      className="px-4 h-9 bg-terracotta-500 text-white rounded-xl text-sm font-medium hover:bg-terracotta-600 transition-all"
                    >
                      OK
                    </button>
                    <button
                      onClick={() => setAdding(null)}
                      className="px-3 h-9 border border-graphite-200 text-graphite-600 rounded-xl text-sm hover:bg-graphite-50 transition-all"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setAdding(customer.id)}
                    className="mt-2 text-xs text-terracotta-600 font-medium hover:text-terracotta-700"
                  >
                    + Aggiungi punti manualmente
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}