"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { createClient }        from "../../../lib/supabase/client";
import Link                    from "next/link";
import { LayoutDashboard, UtensilsCrossed, ShoppingBag, Users, ChevronRight } from "lucide-react";
import { cn } from "../../../lib/utils";

export default function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const router   = useRouter();
  const pathname = usePathname();
  const loc      = params.locale ?? "it";
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    async function check() {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push(`/${loc}/auth/login`); return; }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", session.user.id)
        .single();

      if (profile?.role !== "admin") {
        router.push(`/${loc}`);
        return;
      }
      setChecking(false);
    }
    check();
  }, []);

  if (checking) {
    return <div className="flex items-center justify-center min-h-screen"><p className="text-graphite-400 text-sm">Verifica accesso…</p></div>;
  }

  const navItems = [
    { href: `/${loc}/admin`,          label: "Dashboard",  icon: LayoutDashboard  },
    { href: `/${loc}/admin/orders`,   label: "Ordini",     icon: ShoppingBag      },
    { href: `/${loc}/admin/products`, label: "Prodotti",   icon: UtensilsCrossed  },
    { href: `/${loc}/admin/customers`,label: "Clienti",    icon: Users            },
  ];

  return (
    <div className="min-h-screen bg-graphite-50">
      {/* Top bar */}
      <div className="bg-graphite-800 text-white px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-display font-bold text-terracotta-400">MA'N'GIA</span>
          <ChevronRight size={14} className="text-graphite-400" />
          <span className="text-graphite-300 text-sm">Admin</span>
        </div>
        <Link href={`/${loc}`} className="text-graphite-400 text-xs hover:text-white transition-colors">
          ← Torna all'app
        </Link>
      </div>

      {/* Nav tabs */}
      <div className="bg-white border-b border-graphite-200 px-4 overflow-x-auto no-scrollbar">
        <div className="flex gap-1 w-max">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-all whitespace-nowrap",
                  active
                    ? "border-terracotta-500 text-terracotta-600"
                    : "border-transparent text-graphite-500 hover:text-graphite-800"
                )}
              >
                <Icon size={15} />
                {label}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {children}
      </div>
    </div>
  );
}