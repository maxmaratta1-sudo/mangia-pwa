import Link                from "next/link";
import Image               from "next/image";
import { getTranslations } from "next-intl/server";
import { ArrowRight, Star } from "lucide-react";
import { createClient }    from "../../lib/supabase/server";
import { HomeWelcomePopup } from "../../components/ui/HomeWelcomePopup";

interface HomePageProps {
  params: Promise<{ locale: string }>;
}

const FEATURED_ITEMS = [
  { id: "1", name: "Pinsa Classica",  price: 9.5,  tag: "popular",   desc: "Pomodoro San Marzano, fior di latte, basilico fresco" },
  { id: "2", name: "Pinsa al Tartufo", price: 14,  tag: "signature", desc: "Crema di tartufo, scamorza affumicata, rucola selvatica" },
  { id: "3", name: "Panino Signature", price: 8,   tag: "novità",    desc: "Porchetta, stracciatella, radicchio croccante" },
];

const TAG_STYLES: Record<string, string> = {
  popular:   "bg-terracotta-100 text-terracotta-700",
  signature: "bg-olive-100 text-olive-700",
  "novità":  "bg-cream-300 text-graphite-700",
};

const TAG_LABELS: Record<string, string> = {
  popular:   "Popolare",
  signature: "Signature",
  "novità":  "Novità",
};

export default async function HomePage({ params }: HomePageProps) {
  const { locale } = await params;
  const t          = await getTranslations();
  const supabase   = await createClient();

  // Datos del usuario
  const { data: { user } } = await supabase.auth.getUser();

  let profile: any = null;
  let points        = 0;

  if (user) {
    const { data: p } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    const { data: l } = await supabase
      .from("loyalty_accounts")
      .select("total_points")
      .eq("user_id", user.id)
      .single();

    profile = p;
    points  = l?.total_points ?? 0;
  }

  const rawName   = profile?.full_name?.split(" ")[0] ?? null;
  const firstName = rawName
    ? rawName.charAt(0).toUpperCase() + rawName.slice(1).toLowerCase()
    : null;

  return (
    <div className="animate-fade-in">
      <HomeWelcomePopup locale={locale} isLoggedIn={!!user} />

      {/* Hero */}
      <section className="relative px-4 pt-10 pb-8 flex flex-col items-center text-center overflow-hidden">
        <div aria-hidden="true" className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full bg-terracotta-100 opacity-30 blur-3xl pointer-events-none" />

        {/* Saludo personalizado */}
        {firstName && (
          <p className="text-graphite-500 text-base font-medium mb-3">
            Ciao, <span className="text-terracotta-600 font-bold text-lg">{firstName}</span>! 👋
          </p>
        )}

        <div className="relative mb-6 w-full max-w-xs">
          <Image src="/logo.png" alt="MA'N'GIA" width={400} height={165} className="w-full h-auto object-contain" priority />
        </div>

        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-terracotta-100 text-terracotta-700 text-xs font-medium tracking-wide mb-5">
          Pinsa · Sapori autentici
        </span>

        <p className="text-graphite-500 text-sm leading-relaxed mb-7 max-w-xs">
          Impasto a lunga lievitazione, ingredienti selezionati, gusto autentico.
        </p>

        <Link href={`/${locale}/menu`} className="inline-flex items-center gap-2 bg-terracotta-500 text-white px-6 py-3 rounded-xl font-medium text-sm hover:bg-terracotta-600 active:scale-95 transition-all shadow-warm-md">
          Sfoglia il menù
          <ArrowRight size={16} />
        </Link>
      </section>

      {/* Carta fedeltà — con puntos reales si está logueado */}
      <section className="px-4 mb-6">
        <Link href={user ? `/${locale}/loyalty` : `/${locale}/auth/register`} className="block">
          <div className="rounded-2xl bg-gradient-to-br from-terracotta-500 via-terracotta-600 to-terracotta-700 p-5 flex items-center justify-between shadow-warm-md">
            <div>
              <p className="text-white/70 text-xs font-medium mb-1 tracking-widest uppercase">
                {user ? "La tua carta fedeltà" : "Iscriviti e accumula punti"}
              </p>
              <p className="text-white font-display text-2xl font-bold">
                {user ? `${points} punti` : "Registrati gratis"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Star size={30} className="text-white/70" />
              <ArrowRight size={16} className="text-white/50" />
            </div>
          </div>
        </Link>
      </section>

      {/* I nostri must */}
      <section className="px-4 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl font-bold text-graphite-800">I nostri must</h2>
          <Link href={`/${locale}/menu`} className="text-terracotta-600 text-sm font-medium flex items-center gap-1 hover:text-terracotta-700">
            Menù <ArrowRight size={14} />
          </Link>
        </div>

        <div className="flex flex-col gap-3">
          {FEATURED_ITEMS.map((item) => (
            <Link key={item.id} href={`/${locale}/menu`}>
              <div className="bg-white rounded-2xl p-4 flex items-center gap-4 shadow-card active:scale-[0.98] transition-transform">
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-0.5">
                    <span className="font-display font-semibold text-graphite-800 text-sm leading-snug">
                      {item.name}
                    </span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 uppercase tracking-wide ${TAG_STYLES[item.tag]}`}>
                      {TAG_LABELS[item.tag]}
                    </span>
                  </div>
                  <p className="text-graphite-400 text-xs leading-relaxed truncate mb-1">{item.desc}</p>
                  <p className="text-terracotta-600 font-bold text-sm">€ {item.price.toFixed(2)}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Promozioni */}
      <section className="px-4 mb-10">
        <h2 className="font-display text-xl font-bold text-graphite-800 mb-4">Promozioni in corso</h2>
        <div className="bg-white rounded-2xl p-8 text-center shadow-card">
          <p className="text-graphite-400 text-sm">Nessuna promozione attiva al momento.</p>
        </div>
      </section>

    </div>
  );
}