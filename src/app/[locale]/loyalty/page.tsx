"use client";

import { useEffect, useState } from "react";
import { useRouter }           from "next/navigation";
import { createClient }        from "../../../lib/supabase/client";
import { Star, Gift, TrendingUp, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function LoyaltyPage({ params }: { params: { locale: string } }) {
  const router = useRouter();
  const loc    = params.locale ?? "it";

  const [points,       setPoints      ] = useState(0);
  const [lifetime,     setLifetime    ] = useState(0);
  const [rewards,      setRewards     ] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading,      setLoading     ] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) { router.push(`/${loc}/auth/login`); return; }

      const [{ data: loyalty }, { data: rewards }, { data: transactions }] =
        await Promise.all([
          supabase.from("loyalty_accounts").select("*").eq("user_id", session.user.id).single(),
          supabase.from("rewards").select("*").eq("is_active", true).order("sort_order"),
          supabase.from("loyalty_transactions").select("*").eq("user_id", session.user.id).order("created_at", { ascending: false }).limit(10),
        ]);

      setPoints(loyalty?.total_points ?? 0);
      setLifetime(loyalty?.lifetime_points ?? 0);
      setRewards(rewards ?? []);
      setTransactions(transactions ?? []);
      setLoading(false);
    }
    load();
  }, []);

  function formatDate(date: string) {
    return new Date(date).toLocaleDateString("it-IT", { day: "numeric", month: "short" });
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><p className="text-graphite-400 text-sm">Caricamento…</p></div>;
  }

  const availableRewards = rewards.filter((r) => points >= r.points_required);
  const nextReward       = rewards.find((r) => points < r.points_required);
  const progressPct      = nextReward
    ? Math.min(100, Math.round((points / nextReward.points_required) * 100))
    : 100;

  return (
    <div className="px-4 pt-6 pb-10 animate-fade-in">

      {/* Header */}
      <h1 className="font-display text-2xl font-bold text-graphite-800 mb-6">
        Carta Fedeltà
      </h1>

      {/* Card punti principale */}
      <div className="bg-gradient-to-br from-terracotta-500 via-terracotta-600 to-terracotta-700 rounded-3xl p-6 mb-6 shadow-warm-lg">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-white/70 text-xs font-medium uppercase tracking-widest mb-1">
              I tuoi punti
            </p>
            <p className="text-white font-display text-5xl font-bold leading-none">
              {points}
            </p>
          </div>
          <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
            <Star size={24} className="text-white" />
          </div>
        </div>

        {/* Progress verso prossimo premio */}
        {nextReward && (
          <div>
            <div className="flex justify-between text-white/70 text-xs mb-2">
              <span>Prossimo premio: {nextReward.label_i18n?.it}</span>
              <span>{points}/{nextReward.points_required} pt</span>
            </div>
            <div className="h-2 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <p className="text-white/60 text-xs mt-2">
              Mancano {nextReward.points_required - points} punti
            </p>
          </div>
        )}

        {!nextReward && (
          <p className="text-white/80 text-sm mt-2">
            🎉 Hai sbloccato tutti i premi disponibili!
          </p>
        )}

        <div className="flex items-center gap-1 mt-4 text-white/50 text-xs">
          <TrendingUp size={12} />
          <span>{lifetime} punti totali accumulati</span>
        </div>
      </div>

      {/* Premi disponibili */}
      {availableRewards.length > 0 && (
        <div className="mb-6">
          <h2 className="font-display text-lg font-bold text-graphite-800 mb-3">
            🎁 Premi disponibili
          </h2>
          <div className="flex flex-col gap-3">
            {availableRewards.map((r) => (
              <div key={r.id} className="bg-olive-50 border-2 border-olive-400 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <p className="font-display font-semibold text-graphite-800 text-sm">
                    {r.label_i18n?.it}
                  </p>
                  <p className="text-olive-600 text-xs font-medium mt-0.5">
                    {r.points_required} punti
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-olive-500 text-white px-3 py-1 rounded-full font-medium">
                    Disponibile
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Scala premi completa */}
      <div className="bg-white rounded-2xl shadow-card p-4 mb-6">
        <h2 className="font-display font-semibold text-graphite-700 text-sm mb-4">
          Scala premi
        </h2>
        <div className="flex flex-col gap-4">
          {rewards.map((r, index) => {
            const unlocked = points >= r.points_required;
            const pct      = Math.min(100, Math.round((points / r.points_required) * 100));
            return (
              <div key={r.id}>
                <div className="flex items-center gap-3 mb-2">
                  {/* Indicatore */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    unlocked ? "bg-olive-500" : "bg-graphite-100"
                  }`}>
                    {unlocked
                      ? <span className="text-white text-sm">✓</span>
                      : <Gift size={14} className="text-graphite-400" />
                    }
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-sm font-medium ${unlocked ? "text-graphite-800" : "text-graphite-500"}`}>
                        {r.label_i18n?.it}
                      </span>
                      <span className="text-xs text-graphite-400 font-medium">
                        {r.points_required} pt
                      </span>
                    </div>
                    <div className="h-1.5 bg-graphite-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${unlocked ? "bg-olive-500" : "bg-terracotta-400"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Storico transazioni */}
      <div className="bg-white rounded-2xl shadow-card p-4 mb-4">
        <h2 className="font-display font-semibold text-graphite-700 text-sm mb-3">
          Storico movimenti
        </h2>
        {transactions.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-graphite-400 text-sm">Nessun movimento ancora.</p>
            <Link href={`/${loc}/menu`} className="text-terracotta-600 text-sm font-medium flex items-center justify-center gap-1 mt-2">
              Vai al menù <ArrowRight size={14} />
            </Link>
          </div>
        ) : (
          <div className="flex flex-col divide-y divide-graphite-50">
            {transactions.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-graphite-700 text-sm font-medium capitalize">
                    {tx.reason === "purchase"  ? "Acquisto"           :
                     tx.reason === "redeemed"  ? "Premio riscattato"  :
                     tx.reason === "manual"    ? "Assegnazione"       : tx.reason}
                  </p>
                  {tx.note && (
                    <p className="text-graphite-400 text-xs">{tx.note}</p>
                  )}
                  <p className="text-graphite-400 text-xs">{formatDate(tx.created_at)}</p>
                </div>
                <span className={`text-base font-bold ${tx.points_delta > 0 ? "text-olive-600" : "text-terracotta-600"}`}>
                  {tx.points_delta > 0 ? "+" : ""}{tx.points_delta} pt
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Come funziona */}
      <div className="bg-cream-100 rounded-2xl p-4">
        <h2 className="font-display font-semibold text-graphite-700 text-sm mb-3">
          Come funziona?
        </h2>
        <div className="flex flex-col gap-2">
          <div className="flex items-start gap-2">
            <span className="text-terracotta-500 font-bold text-sm">1.</span>
            <p className="text-graphite-600 text-xs leading-relaxed">Ogni euro speso = 1 punto</p>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-terracotta-500 font-bold text-sm">2.</span>
            <p className="text-graphite-600 text-xs leading-relaxed">Accumula punti con ogni ordine</p>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-terracotta-500 font-bold text-sm">3.</span>
            <p className="text-graphite-600 text-xs leading-relaxed">Sblocca premi e sconti esclusivi</p>
          </div>
        </div>
      </div>

    </div>
  );
}