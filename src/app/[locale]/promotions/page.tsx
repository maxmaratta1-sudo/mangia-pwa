"use client";

import { useEffect, useState } from "react";
import { createClient }        from "../../../lib/supabase/client";
import { Tag, Lock }           from "lucide-react";

export default function PromotionsPage({ params }: { params: { locale: string } }) {
  const loc = params.locale ?? "it";
  const [promotions, setPromotions] = useState<any[]>([]);
  const [loading,    setLoading   ] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userPoints, setUserPoints] = useState(0);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (session) {
        setIsLoggedIn(true);
        const { data: loyalty } = await supabase
          .from("loyalty_accounts")
          .select("total_points")
          .eq("user_id", session.user.id)
          .single();
        setUserPoints(loyalty?.total_points ?? 0);
      }

      const now = new Date().toISOString();
      const { data } = await supabase
        .from("promotions")
        .select("*")
        .eq("is_active", true)
        .or(`ends_at.is.null,ends_at.gt.${now}`)
        .order("created_at", { ascending: false });

      setPromotions(data ?? []);
      setLoading(false);
    }
    load();
  }, []);

  function formatDate(date: string) {
    return new Date(date).toLocaleDateString("it-IT", { day: "numeric", month: "long" });
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><p className="text-graphite-400 text-sm">Caricamento…</p></div>;
  }

  return (
    <div className="px-4 pt-6 pb-10 animate-fade-in">
      <h1 className="font-display text-2xl font-bold text-graphite-800 mb-2">
        Promozioni
      </h1>
      <p className="text-graphite-400 text-sm mb-6">
        Offerte esclusive per i clienti MA'N'GIA
      </p>

      {promotions.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] text-center">
          <Tag size={48} className="text-graphite-200 mb-4" />
          <h2 className="font-display text-lg font-bold text-graphite-600 mb-2">
            Nessuna promozione attiva
          </h2>
          <p className="text-graphite-400 text-sm">
            Torna presto per scoprire le nostre offerte!
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {promotions.map((promo) => {
            const isMembersOnly = promo.is_members_only;
            const hasMinPoints  = promo.min_points_required > 0;
            const isLocked      = (isMembersOnly && !isLoggedIn) ||
                                  (hasMinPoints && userPoints < promo.min_points_required);

            return (
              <div
                key={promo.id}
                className={`bg-white rounded-2xl shadow-card overflow-hidden ${isLocked ? "opacity-70" : ""}`}
              >
                {/* Banner colorato */}
                <div className="bg-gradient-to-r from-terracotta-500 to-terracotta-600 px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Tag size={16} className="text-white/80" />
                    <span className="text-white text-xs font-medium uppercase tracking-wide">
                      {promo.promo_type === "discount_pct"      ? "Sconto"          :
                       promo.promo_type === "free_item"         ? "Prodotto gratis" :
                       promo.promo_type === "points_multiplier" ? "Punti doppi"     : "Offerta"}
                    </span>
                  </div>
                  {isLocked && <Lock size={14} className="text-white/70" />}
                  {promo.ends_at && (
                    <span className="text-white/70 text-xs">
                      Fino al {formatDate(promo.ends_at)}
                    </span>
                  )}
                </div>

                <div className="p-4">
                  <h3 className="font-display font-bold text-graphite-800 text-base mb-1">
                    {promo.title_i18n?.it ?? "Promozione"}
                  </h3>
                  <p className="text-graphite-500 text-sm mb-3">
                    {promo.description_i18n?.it ?? ""}
                  </p>

                  {/* Badges */}
                  <div className="flex flex-wrap gap-2">
                    {isMembersOnly && (
                      <span className="text-xs bg-terracotta-100 text-terracotta-700 px-2 py-0.5 rounded-full font-medium">
                        Solo iscritti
                      </span>
                    )}
                    {hasMinPoints && (
                      <span className="text-xs bg-olive-100 text-olive-700 px-2 py-0.5 rounded-full font-medium">
                        {promo.min_points_required} punti richiesti
                      </span>
                    )}
                  </div>

                  {/* Locked message */}
                  {isLocked && (
                    <div className="mt-3 bg-graphite-50 rounded-xl px-3 py-2">
                      <p className="text-graphite-500 text-xs text-center">
                        {!isLoggedIn
                          ? "Accedi per sbloccare questa promozione"
                          : `Ti mancano ${promo.min_points_required - userPoints} punti per sbloccarla`
                        }
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}