"use client";

import Link                from "next/link";
import { usePathname }     from "next/navigation";
import { useTranslations } from "next-intl";
import { ShoppingCart, User, Globe } from "lucide-react";
import { cn }              from "../../lib/utils";
import { createClient }    from "../../lib/supabase/client";
import { useEffect, useState } from "react";
import { useCartStore } from "../../store/cartStore";

interface HeaderProps {
  locale:     string;
  cartCount?: number;
}

const LOCALES = [
  { code: "it", label: "IT" },
  { code: "es", label: "ES" },
  { code: "en", label: "EN" },
];

export function Header({ locale, cartCount = 0 }: HeaderProps) {
  const t        = useTranslations();
  const pathname = usePathname();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const totalItems = useCartStore((state) => state.totalItems());

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session);
    });
  }, [pathname]);

  function switchLocaleHref(targetLocale: string): string {
    return pathname.replace(`/${locale}`, `/${targetLocale}`);
  }

  return (
    <header className="sticky top-0 z-40 w-full bg-cream-50/95 backdrop-blur-sm border-b border-cream-200">
      <div className="max-w-lg mx-auto px-4 h-16 flex items-center justify-between">

        {/* Locale switcher — izquierda */}
        <div className="flex items-center gap-0.5 w-24">
          <Globe size={13} className="text-graphite-400 mr-1" aria-hidden="true" />
          {LOCALES.map(({ code, label }) => (
            <Link
              key={code}
              href={switchLocaleHref(code)}
              className={cn(
                "text-xs px-1.5 py-0.5 rounded font-medium transition-colors",
                locale === code
                  ? "text-terracotta-600 bg-terracotta-50"
                  : "text-graphite-500 hover:text-graphite-800"
              )}
            >
              {label}
            </Link>
          ))}
        </div>

        {/* Brand — centro */}
        <Link href={`/${locale}`} className="flex-1 flex justify-center">
          <span className="font-display text-xl font-bold tracking-tight text-terracotta-600">
            MA'N'GIA
          </span>
        </Link>

        {/* Acciones — derecha */}
        <div className="flex items-center gap-1 w-24 justify-end">
          <Link
            href={`/${locale}/cart`}
            className="relative p-2 text-graphite-600 hover:text-terracotta-600 transition-colors"
            aria-label={t("nav.cart")}
          >
            <ShoppingCart size={22} />
            {totalItems > 0 && (
              <span className="absolute -top-0.5 -right-0.5 h-4 w-4 flex items-center justify-center rounded-full bg-terracotta-500 text-white text-[10px] font-bold">
                {totalItems > 9 ? "9+" : totalItems}
              </span>
            )}
          </Link>

          <Link
            href={isLoggedIn ? `/${locale}/profile` : `/${locale}/auth/login`}
            className="p-2 text-graphite-600 hover:text-terracotta-600 transition-colors"
            aria-label={t("nav.profile")}
          >
            <User size={22} className={isLoggedIn ? "text-terracotta-500" : ""} />
          </Link>
        </div>

      </div>
    </header>
  );
}