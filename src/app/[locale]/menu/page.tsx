import { getTranslations } from "next-intl/server";
import { createClient }    from "../../../lib/supabase/server";
import { MenuClient }      from "./MenuClient";

interface MenuPageProps {
  params: Promise<{ locale: string }>;
}

export default async function MenuPage({ params }: MenuPageProps) {
  const { locale } = await params;
  const t          = await getTranslations("menu");
  const supabase   = await createClient();

  // Fetch categorías
  const { data: categoriesRaw } = await supabase
    .from("categories")
    .select("*")
    .eq("is_active", true)
    .order("sort_order");

  // Fetch productos
  const { data: productsRaw } = await supabase
    .from("products")
    .select("*")
    .order("sort_order");

  // Mapear categorías con nombre en el locale actual
  const categories = [
    { id: "all", slug: "all", name: t("allCategories") },
    ...(categoriesRaw ?? []).map((cat) => ({
      id:   cat.id,
      slug: cat.slug,
      name: cat.name_i18n?.[locale] ?? cat.name_i18n?.["it"] ?? cat.slug,
    })),
  ];

  // Mapear productos con nombre y descripción en el locale actual
  const products = (productsRaw ?? []).map((p) => ({
    id:          p.id,
    categoryId:  p.category_id,
    name:        p.name_i18n?.[locale]        ?? p.name_i18n?.["it"]        ?? "",
    description: p.description_i18n?.[locale] ?? p.description_i18n?.["it"] ?? "",
    price:       p.price,
    tags:        p.tags        ?? [],
    allergens:   p.allergens   ?? [],
    isAvailable: p.is_available,
    imageUrl:    p.image_url   ?? null,
  }));

  return (
    <div className="page-enter">
      <div className="px-4 pt-6 pb-3">
        <h1 className="font-display text-2xl font-bold text-graphite-800">
          {t("title")}
        </h1>
      </div>

      <MenuClient
        categories={categories}
        products={products}
        locale={locale}
      />
    </div>
  );
}