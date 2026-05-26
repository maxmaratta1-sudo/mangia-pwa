"use client";

import Link              from "next/link";
import { usePathname }   from "next/navigation";
import { useTranslations } from "next-intl";
import { Home, UtensilsCrossed, Star, Tag, User } from "lucide-react";
import { cn } from "../../lib/utils";

interface NavItem {
  key:    string;
  icon:   React.FC<{ size: number; className?: string }>;
  href:   string;
}

interface BottomNavProps {
  locale: string;
}

export function BottomNav({ locale }: BottomNavProps) {
  const t        = useTranslations("nav");
  const pathname = usePathname();

  const items: NavItem[] = [
    { key: "home",       icon: Home,             href: `/${locale}`            },
    { key: "menu",       icon: UtensilsCrossed,  href: `/${locale}/menu`       },
    { key: "loyalty",    icon: Star,             href: `/${locale}/loyalty`    },
    { key: "promotions", icon: Tag,              href: `/${locale}/promotions` },
    { key: "profile",    icon: User,             href: `/${locale}/profile`    },
  ];

  function isActive(href: string): boolean {
    if (href === `/${locale}`) return pathname === `/${locale}`;
    return pathname.startsWith(href);
  }

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 bg-cream-50/95 backdrop-blur-sm border-t border-cream-200 safe-b"
      aria-label="Main navigation"
    >
      <div className="max-w-lg mx-auto px-2 h-16 flex items-center justify-around">
        {items.map(({ key, icon: Icon, href }) => {
          const active = isActive(href);
          return (
            <Link
              key={key}
              href={href}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 flex-1 h-full py-2 transition-colors",
                active
                  ? "text-terracotta-600"
                  : "text-graphite-400 hover:text-graphite-700"
              )}
              aria-current={active ? "page" : undefined}
            >
              <Icon
                size={22}
                className={cn(
                  "transition-transform duration-150",
                  active && "scale-110"
                )}
              />
              <span
                className={cn(
                  "text-[10px] font-medium tracking-wide",
                  active ? "text-terracotta-600" : "text-graphite-400"
                )}
              >
                {t(key as any)}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
