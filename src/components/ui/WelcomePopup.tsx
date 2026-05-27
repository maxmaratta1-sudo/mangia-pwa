"use client";

import { X, Star, Gift, Shield } from "lucide-react";
import Link from "next/link";

interface WelcomePopupProps {
  locale: string;
  onClose: () => void;
  onContinueAsGuest: () => void;
}

export function WelcomePopup({ locale, onClose, onContinueAsGuest }: WelcomePopupProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="relative w-full max-w-sm bg-cream-100 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden animate-fade-in">

        {/* Header terracotta */}
        <div className="bg-gradient-to-br from-terracotta-500 to-terracotta-700 px-6 pt-8 pb-10 text-center">
          <div className="text-5xl mb-3">🍕</div>
          <h2 className="font-display text-2xl font-bold text-white mb-1">
            Aspetta!
          </h2>
          <p className="text-white/80 text-sm">
            Unisciti alla famiglia MA'N'GIA e mangia meglio
          </p>
        </div>

        {/* Contenuto */}
        <div className="px-6 py-6 -mt-4 bg-cream-100 rounded-t-3xl relative">

          {/* Benefici */}
          <div className="flex flex-col gap-3 mb-6">
            <div className="flex items-center gap-3 bg-white rounded-2xl p-3 shadow-sm">
              <div className="w-10 h-10 rounded-full bg-terracotta-100 flex items-center justify-center shrink-0">
                <Star size={18} className="text-terracotta-600" />
              </div>
              <div>
                <p className="text-graphite-800 text-sm font-semibold">100 punti subito</p>
                <p className="text-graphite-400 text-xs">Solo per esserti registrato</p>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-white rounded-2xl p-3 shadow-sm">
              <div className="w-10 h-10 rounded-full bg-olive-100 flex items-center justify-center shrink-0">
                <Gift size={18} className="text-olive-600" />
              </div>
              <div>
                <p className="text-graphite-800 text-sm font-semibold">Una pinsa gratis al 3° ordine</p>
                <p className="text-graphite-400 text-xs">Premio fedeltà per chi torna</p>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-white rounded-2xl p-3 shadow-sm">
              <div className="w-10 h-10 rounded-full bg-graphite-100 flex items-center justify-center shrink-0">
                <Shield size={18} className="text-graphite-600" />
              </div>
              <div>
                <p className="text-graphite-800 text-sm font-semibold">Carta fedeltà digitale</p>
                <p className="text-graphite-400 text-xs">Accumula punti ad ogni ordine</p>
              </div>
            </div>
          </div>

          {/* CTA principale */}
          <Link
            href={`/${locale}/auth/register`}
            className="w-full flex items-center justify-center h-12 rounded-xl bg-terracotta-500 text-white font-semibold text-sm shadow-warm-md hover:bg-terracotta-600 transition-all mb-3"
          >
            🎉 Registrati e ottieni 100 punti
          </Link>

          {/* Login se già registrato */}
          <Link
            href={`/${locale}/auth/login`}
            className="w-full flex items-center justify-center h-10 rounded-xl border border-graphite-200 text-graphite-600 text-sm font-medium hover:bg-graphite-50 transition-all mb-3"
          >
            Ho già un account — Accedi
          </Link>

          {/* Guest */}
          <button
            onClick={onContinueAsGuest}
            className="w-full text-graphite-400 text-xs text-center hover:text-graphite-600 transition-colors py-2"
          >
            Continua senza registrarti (senza punti)
          </button>
        </div>
      </div>
    </div>
  );
}