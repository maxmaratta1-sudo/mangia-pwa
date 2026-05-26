"use client";

import { useEffect, useState } from "react";
import { useRouter }           from "next/navigation";
import { createClient }        from "../../../lib/supabase/client";
import { LogOut, Star, Calendar, TrendingUp } from "lucide-react";
import Link from "next/link";

export default function ProfilePage({ params }: { params: { locale: string } }) {
  const router = useRouter();
  const locale = params.locale ?? "it";

  const [user,         setUser        ] = useState<any>(null);
  const [profile,      setProfile     ] = useState<any>(null);
  const [points,       setPoints      ] = useState(0);
  const [lifetime,     setLifetime    ] = useState(0);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [rewards,      setRewards     ] = useState<any[]>([]);
  const [loading,      setLoading     ] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) { router.push(`/${locale}/auth/login`); return; }

      const u = session.user;
      setUser(u); // ← guardamos el user en el estado

      const [{ data: profile }, { data: loyalty }, { data: transactions }, { data: rewards }] =
        await Promise.all([
          supabase.from("profiles").select("*").eq("id", u.id).single(),
          supabase.from("loyalty_accounts").select("*").eq("user_id", u.id).single(),
          supabase.from("loyalty_transactions").select("*").eq("user_id", u.id).order("created_at", { ascending: false }).limit(5),
          supabase.from("rewards").select("*").eq("is_active", true).order("sort_order"),
        ]);

      setProfile(profile);
      setPoints(loyalty?.total_points ?? 0);
      setLifetime(loyalty?.lifetime_points ?? 0);
      setTransactions(transactions ?? []);
      setRewards(rewards ?? []);
      setLoading(false);
    }
    load();
  }, []);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push(`/${locale}/auth/login`);
    router.refresh();
  }

  function getInitials(name: string) {
    if (!name) return "?";
    return name.split(" ").slice(0, 2).map((n: string) => n[0]?.toUpperCase()).join("");
  }

  function formatName(name: string) {
    if (!name) return "";
    return name.split(" ").map((n: string) =>
      n.charAt(0).toUpperCase() + n.slice(1).toLowerCase()
    ).join(" ");
  }

  function formatDate(date: string) {
    return new Date(date).toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" });
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><p className="text-graphite-400 text-sm">Caricamento…</p></div>;
  }

  const memberSince      = profile?.created_at ? formatDate(profile.created_at) : "—";
  const availableRewards = rewards.filter((r) => points >= r.points_required);

  return (
    <div className="px-4 pt-6 pb-10 animate-fade-in">

      {/* Avatar + nome */}
      <div className="flex flex-col items-center mb-6">
        <div className="w-20 h-20 rounded-full bg-terracotta-100 flex items-center justify-center mb-3">
          <span className="text-terracotta-600 font-display text-2xl font-bold">
            {getInitials(profile?.full_name ?? "")}
          </span>
        </div>
        <h1 className="font-display text-xl font-bold text-graphite-800">
          {formatName(profile?.full_name ?? "")}
        </h1>
        <p className="text-graphite-400 text-sm">{user?.email}</p>
        <div className="flex items-center gap-1 mt-1 text-graphite-400 text-xs">
          <Calendar size={12} />
          <span>Membro dal {memberSince}</span>
        </div>
      </div>

      {/* Punti */}
      <div className="bg-gradient-to-br from-terracotta-500 to-terracotta-700 rounded-2xl p-5 mb-4 shadow-warm-md">
        <div className="flex items-center justify-between mb-3">
          <p className="text-white/70 text-xs font-medium uppercase tracking-widest">Punti disponibili</p>
          <Star size={20} className="text-white/60" />
        </div>
        <p className="text-white font-display text-4xl font-bold mb-1">{points}</p>
        <div className="flex items-center gap-1 text-white/60 text-xs">
          <TrendingUp size={12} />
          <span>{lifetime} punti totali accumulati</span>
        </div>
      </div>

      {/* Benefici disponibili */}
      {availableRewards.length > 0 && (
        <div className="bg-olive-50 border border-olive-200 rounded-2xl p-4 mb-4">
          <h2 className="font-display font-semibold text-olive-700 text-sm mb-2">
            🎁 Premi disponibili
          </h2>
          <div className="flex flex-col gap-2">
            {availableRewards.map((r) => (
              <div key={r.id} className="flex items-center justify-between">
                <span className="text-graphite-700 text-sm">{r.label_i18n?.it ?? ""}</span>
                <span className="text-olive-600 text-xs font-semibold">{r.points_required} pt</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Scala premi */}
      <div className="bg-white rounded-2xl shadow-card p-4 mb-4">
        <h2 className="font-display font-semibold text-graphite-700 text-sm mb-3">Scala premi</h2>
        <div className="flex flex-col gap-3">
          {rewards.map((r) => {
            const unlocked = points >= r.points_required;
            const pct      = Math.min(100, Math.round((points / r.points_required) * 100));
            return (
              <div key={r.id}>
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-xs font-medium ${unlocked ? "text-olive-600" : "text-graphite-600"}`}>
                    {unlocked ? "✓ " : ""}{r.label_i18n?.it ?? ""}
                  </span>
                  <span className="text-xs text-graphite-400">{r.points_required} pt</span>
                </div>
                <div className="h-1.5 bg-graphite-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${unlocked ? "bg-olive-500" : "bg-terracotta-400"}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Ultimi movimenti */}
      <div className="bg-white rounded-2xl shadow-card p-4 mb-4">
        <h2 className="font-display font-semibold text-graphite-700 text-sm mb-3">Ultimi movimenti</h2>
        {transactions.length === 0 ? (
          <p className="text-graphite-400 text-xs text-center py-3">
            Nessuna transazione ancora. Fai il tuo primo ordine!
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {transactions.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between py-1 border-b border-graphite-50 last:border-0">
                <div>
                  <p className="text-graphite-700 text-xs font-medium capitalize">{tx.reason}</p>
                  <p className="text-graphite-400 text-[10px]">{formatDate(tx.created_at)}</p>
                </div>
                <span className={`text-sm font-bold ${tx.points_delta > 0 ? "text-olive-600" : "text-terracotta-600"}`}>
                  {tx.points_delta > 0 ? "+" : ""}{tx.points_delta} pt
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Il mio account */}
      <div className="bg-white rounded-2xl shadow-card p-4 mb-4">
        <h2 className="font-display font-semibold text-graphite-700 text-sm mb-3">Il mio account</h2>
        <div className="flex flex-col gap-2">
          <div className="flex justify-between text-sm">
            <span className="text-graphite-400">Nome</span>
            <span className="text-graphite-700 font-medium">{formatName(profile?.full_name ?? "—")}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-graphite-400">Email</span>
            <span className="text-graphite-700 font-medium text-xs">{user?.email ?? "—"}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-graphite-400">Lingua</span>
            <span className="text-graphite-700 font-medium uppercase">{profile?.language ?? locale}</span>
          </div>
        </div>
      </div>

     {/* Link ordini */}
     <Link
       href={`/${locale}/orders`}
       className="w-full flex items-center justify-between h-11 px-4 rounded-xl border border-graphite-200 text-graphite-600 text-sm font-medium hover:bg-graphite-50 transition-colors mb-3"
     >
       <span>I miei ordini</span>
       <ArrowRight size={16} />
     </Link>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="w-full flex items-center justify-center gap-2 h-11 rounded-xl border border-graphite-200 text-graphite-600 text-sm font-medium hover:bg-graphite-50 transition-colors"
      >
        <LogOut size={16} />
        Esci dall'account
      </button>

    </div>
  );
}