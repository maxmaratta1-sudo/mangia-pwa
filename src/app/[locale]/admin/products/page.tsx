"use client";

import { useEffect, useState } from "react";
import { createClient }        from "../../../../lib/supabase/client";
import { Eye, EyeOff }         from "lucide-react";

export default function AdminProductsPage() {
  const [products,    setProducts   ] = useState<any[]>([]);
  const [categories,  setCategories ] = useState<any[]>([]);
  const [loading,     setLoading    ] = useState(true);
  const [filter,      setFilter     ] = useState("all");

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const [{ data: products }, { data: categories }] = await Promise.all([
        supabase.from("products").select("*, categories(name_i18n)").order("sort_order"),
        supabase.from("categories").select("*").order("sort_order"),
      ]);
      setProducts(products ?? []);
      setCategories(categories ?? []);
      setLoading(false);
    }
    load();
  }, []);

  async function toggleAvailability(productId: string, current: boolean) {
    const supabase = createClient();
    await supabase.from("products").update({ is_available: !current }).eq("id", productId);
    setProducts((prev) => prev.map((p) =>
      p.id === productId ? { ...p, is_available: !current } : p
    ));
  }

  async function updatePrice(productId: string, newPrice: number) {
    if (!newPrice || newPrice <= 0) return;
    const supabase = createClient();
    await supabase.from("products").update({ price: newPrice }).eq("id", productId);
    setProducts((prev) => prev.map((p) =>
      p.id === productId ? { ...p, price: newPrice } : p
    ));
  }

  const filtered = filter === "all"
    ? products
    : products.filter((p) => p.category_id === filter);

  if (loading) {
    return <div className="flex items-center justify-center min-h-[40vh]"><p className="text-graphite-400 text-sm">Caricamento…</p></div>;
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-graphite-800 mb-4">Prodotti</h1>

      {/* Filtro categorie */}
      <div className="flex gap-2 mb-4 overflow-x-auto no-scrollbar pb-1">
        <button
          onClick={() => setFilter("all")}
          className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
            filter === "all" ? "bg-graphite-800 text-white" : "bg-white text-graphite-600 border border-graphite-200"
          }`}
        >
          Tutti
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setFilter(cat.id)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
              filter === cat.id ? "bg-graphite-800 text-white" : "bg-white text-graphite-600 border border-graphite-200"
            }`}
          >
            {cat.name_i18n?.it ?? cat.slug}
          </button>
        ))}
      </div>

      {/* Lista prodotti */}
      <div className="flex flex-col gap-3">
        {filtered.map((product) => (
          <div key={product.id} className={`bg-white rounded-2xl shadow-card p-4 ${!product.is_available ? "opacity-60" : ""}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="font-display font-semibold text-graphite-800 text-sm leading-snug">
                  {product.name_i18n?.it ?? "—"}
                </p>
                <p className="text-graphite-400 text-xs mt-0.5">
                  {product.categories?.name_i18n?.it ?? "—"}
                </p>
                {product.tags?.length > 0 && (
                  <div className="flex gap-1 mt-1">
                    {product.tags.map((tag: string) => (
                      <span key={tag} className="text-[10px] bg-graphite-100 text-graphite-600 px-2 py-0.5 rounded-full">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Toggle disponibilità */}
              <button
                onClick={() => toggleAvailability(product.id, product.is_available)}
                className={`p-2 rounded-xl transition-all ${
                  product.is_available
                    ? "bg-olive-100 text-olive-600 hover:bg-olive-200"
                    : "bg-graphite-100 text-graphite-400 hover:bg-graphite-200"
                }`}
                title={product.is_available ? "Disabilita" : "Abilita"}
              >
                {product.is_available ? <Eye size={16} /> : <EyeOff size={16} />}
              </button>
            </div>

            {/* Prezzo modificabile */}
            <div className="flex items-center gap-2 mt-3">
              <span className="text-graphite-500 text-xs">Prezzo:</span>
              <input
                type="number"
                step="0.50"
                min="0"
                defaultValue={product.price}
                onBlur={(e) => {
                  const newPrice = parseFloat(e.target.value);
                  if (newPrice !== product.price) updatePrice(product.id, newPrice);
                }}
                className="w-24 h-8 px-2 rounded-lg border border-graphite-200 text-sm text-graphite-700 focus:outline-none focus:ring-2 focus:ring-terracotta-400"
              />
              <span className="text-graphite-400 text-xs">€</span>
              <span className={`ml-auto text-xs font-medium px-2 py-0.5 rounded-full ${
                product.is_available ? "bg-olive-100 text-olive-700" : "bg-graphite-100 text-graphite-500"
              }`}>
                {product.is_available ? "Disponibile" : "Non disponibile"}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}