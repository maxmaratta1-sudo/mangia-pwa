"use client";

import Image  from "next/image";
import { Plus } from "lucide-react";
import { cn }   from "../../lib/utils";
import { useCartStore } from "../../store/cartStore";

export interface Product {
  id:          string;
  name:        string;
  description: string;
  price:       number;
  imageUrl?:   string;
  tags:        string[];
  isAvailable: boolean;
  allergens?:  string[];
}

const TAG_STYLES: Record<string, string> = {
  popular:   "bg-terracotta-100 text-terracotta-700",
  signature: "bg-olive-100 text-olive-700",
  "novità":  "bg-cream-300 text-graphite-700",
  promo:     "bg-graphite-100 text-graphite-600",
};

const TAG_LABELS: Record<string, string> = {
  popular:   "Popolare",
  signature: "Signature",
  "novità":  "Novità",
  promo:     "Promo",
};

interface ProductCardProps {
  product:      Product;
  onAddToCart?: (product: Product) => void;
  className?:   string;
}

export function ProductCard({ product, onAddToCart, className }: ProductCardProps) {
  const addItem = useCartStore((state) => state.addItem);
  return (
    <article className={cn(
      "bg-white rounded-2xl overflow-hidden shadow-card flex flex-col h-full",
      !product.isAvailable && "opacity-60",
      className
    )}>

      {/* Image — solo si existe, sin placeholder emoji */}
      {product.imageUrl && (
        <div className="relative w-full aspect-[4/3] overflow-hidden flex-shrink-0">
          <Image src={product.imageUrl} alt={product.name} fill className="object-cover" sizes="45vw" />
        </div>
      )}

      {/* Tags */}
      {product.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 px-3 pt-2">
          {product.tags.slice(0, 2).map((tag) => (
            <span key={tag} className={cn(
              "px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide uppercase",
              TAG_STYLES[tag] ?? "bg-graphite-100 text-graphite-600"
            )}>
              {TAG_LABELS[tag] ?? tag}
            </span>
          ))}
        </div>
      )}

      {/* Content */}
      <div className="px-3 pt-2 pb-3 flex flex-col justify-between" style={{minHeight: "130px"}}>
        <h3 className="font-display font-semibold text-graphite-800 text-sm leading-snug mb-1 line-clamp-2">
          {product.name}
        </h3>
        <p className="text-graphite-400 text-xs leading-relaxed line-clamp-2 flex-1">
          {product.description}
        </p>

        {/* Price + Add button */}
        <div className="flex items-center justify-between mt-3">
          <span className="text-terracotta-600 font-bold text-base">
            € {product.price.toFixed(2)}
          </span>
          <button
            onClick={() => {
              if (product.isAvailable) {
                addItem({ id: product.id, name: product.name, price: product.price });
                onAddToCart?.(product);
              }
            }}
            disabled={!product.isAvailable}
            aria-label={`Aggiungi ${product.name}`}
            className={cn(
              "w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-150",
              product.isAvailable
                ? "bg-terracotta-500 text-white hover:bg-terracotta-600 active:scale-90"
                : "bg-graphite-100 text-graphite-300 cursor-not-allowed"
            )}
          >
            <Plus size={18} strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </article>
  );
}