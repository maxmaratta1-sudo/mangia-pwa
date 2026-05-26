"use client";

import { useState, useMemo }  from "react";
import { Search }              from "lucide-react";
import { ProductCard }         from "../../../components/menu/ProductCard";
import type { Product }        from "../../../components/menu/ProductCard";
import { cn }                  from "../../../lib/utils";

interface Category { id: string; slug: string; name: string; }
interface RawProduct {
  id: string; categoryId: string; name: string; description: string;
  price: number; tags: string[]; isAvailable: boolean; allergens: string[];
}
interface MenuClientProps {
  categories: Category[];
  products:   RawProduct[];
  locale:     string;
}

export function MenuClient({ categories, products }: MenuClientProps) {
  const [activeCategory, setActiveCategory] = useState("all");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => products.filter((p) => {
    const matchCat    = activeCategory === "all" || p.categoryId === activeCategory;
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
                        p.description.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  }), [products, activeCategory, search]);

  const mapped: Product[] = filtered.map((p) => ({
    id: p.id, name: p.name, description: p.description,
    price: p.price, tags: p.tags, isAvailable: p.isAvailable, allergens: p.allergens,
  }));

  return (
    <>
      {/* Search */}
      <div className="px-4 mb-4">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-graphite-400 pointer-events-none" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cerca nel menù…"
            className="w-full h-11 pl-9 pr-4 rounded-xl bg-white border border-graphite-200 text-sm text-graphite-800 placeholder:text-graphite-400 focus:outline-none focus:ring-2 focus:ring-terracotta-400 focus:border-transparent"
          />
        </div>
      </div>

      {/* Category pills — scrollable, padding corregido */}
      <div className="mb-5 overflow-x-auto no-scrollbar">
        <div className="flex gap-2 pl-4 pr-4 w-max pb-1">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-150 border",
                activeCategory === cat.id
                  ? "bg-cream-200 text-terracotta-700 border-terracotta-400 font-semibold"
                  : "bg-white text-graphite-700 border-graphite-200"
              )}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="px-4 pb-6">
        {mapped.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">🍕</p>
            <p className="text-graphite-400 text-sm">Nessun prodotto trovato.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {mapped.map((product) => (
              <ProductCard key={product.id} product={product} onAddToCart={(p) => console.log("cart:", p.id)} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}