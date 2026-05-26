"use client";

import { useState }    from "react";
import Link            from "next/link";
import Image           from "next/image";
import { useRouter }   from "next/navigation";
import { createClient } from "../../../../lib/supabase/client";

export default function LoginPage({ params }: { params: { locale: string } }) {
  const router  = useRouter();
  const locale  = params.locale ?? "it";

  const [email,    setEmail   ] = useState("");
  const [password, setPassword] = useState("");
  const [error,    setError   ] = useState("");
  const [loading,  setLoading ] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError("Email o password non corretti.");
      setLoading(false);
      return;
    }

    router.push(`/${locale}`);
    router.refresh();
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-cream-100">

      {/* Logo */}
      <div className="mb-8 w-48">
        <Image src="/logo.png" alt="MA'N'GIA" width={300} height={124} className="w-full h-auto" priority />
      </div>

      {/* Card */}
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-card p-6">
        <h1 className="font-display text-2xl font-bold text-graphite-800 mb-1">
          Bentornato
        </h1>
        <p className="text-graphite-400 text-sm mb-6">
          Accedi al tuo account MA'N'GIA
        </p>

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-medium text-graphite-600 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="la-tua@email.com"
              className="w-full h-11 px-4 rounded-xl border border-graphite-200 text-sm text-graphite-800 placeholder:text-graphite-300 focus:outline-none focus:ring-2 focus:ring-terracotta-400 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-graphite-600 mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="w-full h-11 px-4 rounded-xl border border-graphite-200 text-sm text-graphite-800 placeholder:text-graphite-300 focus:outline-none focus:ring-2 focus:ring-terracotta-400 focus:border-transparent"
            />
          </div>

          {error && (
            <p className="text-red-500 text-xs bg-red-50 px-3 py-2 rounded-lg">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 bg-terracotta-500 text-white rounded-xl font-medium text-sm hover:bg-terracotta-600 active:scale-95 transition-all disabled:opacity-50"
          >
            {loading ? "Accesso in corso…" : "Accedi"}
          </button>
        </form>

        <p className="text-center text-graphite-400 text-xs mt-6">
          Non hai un account?{" "}
          <Link href={`/${locale}/auth/register`} className="text-terracotta-600 font-medium hover:underline">
            Registrati
          </Link>
        </p>
      </div>
    </div>
  );
}