import type { Metadata, Viewport } from "next";
import { notFound }                from "next/navigation";
import { NextIntlClientProvider }  from "next-intl";
import { getMessages }             from "next-intl/server";
import { Playfair_Display, Lato } from "next/font/google";

import { routing }   from "../../i18n/routing";
import { Header }    from "../../components/layout/Header";
import { BottomNav } from "../../components/layout/BottomNav";
import "../globals.css";
import { AiChat } from "../../components/ui/AiChat";


// ── Fonts ────────────────────────────────────────────────────────────────────
const playfair = Playfair_Display({
  subsets:  ["latin"],
  variable: "--font-display",
  display:  "swap",
  weight:   ["400", "500", "700"],
});

const lato = Lato({
  subsets:  ["latin"],
  variable: "--font-sans",
  display:  "swap",
  weight:   ["300", "400", "700"],
});

// ── Metadata ─────────────────────────────────────────────────────────────────
export const metadata: Metadata = {
  title: {
    default:  "MA'N'GIA",
    template: "%s | MA'N'GIA",
  },
  description:
    "Pinsa a lievitazione naturale. Sapori autentici, ingredienti selezionati.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable:          true,
    statusBarStyle:   "default",
    title:            "MA'N'GIA — Al Localino · Street Pinsa",
  },
  formatDetection: { telephone: false },
  openGraph: {
    type:      "website",
    siteName:  "MA'N'GIA",
    title:     "MA'N'GIA — Al Localino · Street Pinsa",
    description: "Pinsa a lievitazione naturale. Sapori autentici.",
  },
};

export const viewport: Viewport = {
  themeColor:          "#fef9ea",
  width:               "device-width",
  initialScale:        1,
  maximumScale:        1,
  userScalable:        false,
  viewportFit:         "cover",
};

// ── Layout ───────────────────────────────────────────────────────────────────
interface RootLayoutProps {
  children: React.ReactNode;
  params:   Promise<{ locale: string }>;
}

export default async function RootLayout({ children, params }: RootLayoutProps) {
  const { locale } = await params;

  // Validate locale
  if (!routing.locales.includes(locale as any)) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <html lang={locale} className={`${playfair.variable} ${lato.variable}`}>
      <body className="bg-cream-100 text-graphite-800 font-sans antialiased min-h-screen">
        <NextIntlClientProvider messages={messages}>
          {/* Header */}
          <Header locale={locale} />

          {/* Main content — padded top (header) + bottom (nav) */}
          <main className="max-w-lg mx-auto pb-20 min-h-[calc(100dvh-3.5rem)]">
            {children}
          </main>

          {/* Bottom nav */}
          <BottomNav locale={locale} />
          <AiChat locale={locale} />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

// Generate static locale routes
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}
