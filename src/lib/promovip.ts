import { queryOptions } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";

export type Store = {
  id: string;
  name: string;
  slug: string;
  website_url: string | null;
  logo_url: string | null;
  accent_color: string | null;
  affiliate_base_url?: string | null;
  admin_notes?: string | null;
  active: boolean;
};

export type Category = {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  sort_order: number;
  active?: boolean;
};

export type Product = {
  id: string;
  title: string;
  slug: string;
  short_description: string | null;
  description: string | null;
  price: number | null;
  original_price: number | null;
  currency: string;
  price_updated_at: string | null;
  image_url: string | null;
  gallery: unknown;
  video_url: string | null;
  affiliate_url: string;
  coupon_code: string | null;
  store_id: string | null;
  category_id: string | null;
  tags: string[];
  editorial_review: string | null;
  editorial_rating: number | null;
  featured: boolean;
  active: boolean;
  created_at: string;
  sort_order: number;
  specifications?: Record<string, unknown>;
  stores?: Pick<Store, "id" | "name" | "slug" | "accent_color"> | null;
  categories?: Pick<Category, "id" | "name" | "slug"> | null;
};

export type Coupon = {
  id: string;
  code: string | null;
  title: string;
  description: string | null;
  conditions: string | null;
  discount_label: string | null;
  store_id: string | null;
  affiliate_url: string;
  image_url?: string | null;
  expires_at: string | null;
  featured: boolean;
  active: boolean;
  stores?: Pick<Store, "id" | "name" | "slug" | "accent_color"> | null;
};

export type EditorialReview = {
  id: string;
  product_id: string;
  title: string;
  body: string;
  rating: number | null;
  published_at: string;
  active: boolean;
};

export type Banner = { id:string; title:string; subtitle:string|null; image_url:string|null; link_url:string|null; link_label:string|null; starts_at:string|null; ends_at:string|null; sort_order:number; active:boolean; media?:unknown; video_url?:string|null; autoplay?:boolean };
export type SiteSetting = { key:string; value:Record<string, unknown>; public:boolean };

export function settingsMap(settings: SiteSetting[] | undefined) {
  return Object.fromEntries((settings ?? []).map((item) => [item.key, item.value])) as Record<string, Record<string, string>>;
}

export const CONTACT_DEFAULTS = {
  whatsapp: "https://wa.me/5571992600863",
  whatsapp_label: "+55 71 99260-0863",
  facebook: "https://www.facebook.com/PromoraShop.ofc?mibextid=wwXIfr",
};

export const DISCOUNT_HUNT_DEFAULTS = {
  name: "Caça ao Desconto",
  title: "Encontrou um produto?",
  description: "Mande uma foto ou o link e pergunte se existe uma oferta, desconto ou cupom para ele.",
  cta: "Procurar desconto",
  send_label: "Enviar pelo WhatsApp",
  whatsapp: CONTACT_DEFAULTS.whatsapp,
  message_intro: "Oi! Encontrei este produto e queria saber se vocês conseguem encontrar uma oferta melhor para ele.",
  message_question: "Tem esse produto com desconto ou algum cupom específico para ele?",
};

export function discountHuntConfig(settings: SiteSetting[] | undefined) {
  const saved = settingsMap(settings)["discount_hunt"] ?? {};
  const merged = { ...DISCOUNT_HUNT_DEFAULTS };
  for (const key of Object.keys(DISCOUNT_HUNT_DEFAULTS) as (keyof typeof DISCOUNT_HUNT_DEFAULTS)[]) {
    const value = saved[key];
    if (typeof value === "string" && value.trim()) merged[key] = value.trim();
  }
  return merged;
}

export function contactConfig(settings: SiteSetting[] | undefined) {
  const social = settingsMap(settings)["social"] ?? {};
  return {
    whatsapp: social["whatsapp"]?.trim() || CONTACT_DEFAULTS.whatsapp,
    whatsapp_label: social["whatsapp_label"]?.trim() || CONTACT_DEFAULTS.whatsapp_label,
    facebook: social["facebook"]?.trim() || CONTACT_DEFAULTS.facebook,
  };
}

export function bannerImages(banner: Banner): string[] {
  const list = Array.isArray(banner.media) ? banner.media.filter((item): item is string => typeof item === "string") : [];
  const all = [banner.image_url, ...list].filter((item): item is string => Boolean(item));
  return Array.from(new Set(all));
}

const PRODUCT_SELECT =
  "*, stores(id,name,slug,accent_color), categories(id,name,slug)" as const;

export function galleryToArray(gallery: unknown): string[] {
  if (Array.isArray(gallery)) return gallery.filter((item): item is string => typeof item === "string");
  return [];
}

export function formatPrice(value: number | null | undefined, currency = "BRL") {
  if (value === null || value === undefined) return null;
  return value.toLocaleString("pt-BR", { style: "currency", currency });
}

export function discountPercent(product: Pick<Product, "price" | "original_price">) {
  if (!product.price || !product.original_price || product.original_price <= product.price) return null;
  return Math.round((1 - product.price / product.original_price) * 100);
}

export function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 70);
}

export function youtubeEmbedUrl(url: string | null | undefined) {
  if (!url) return null;
  const idMatch =
    url.match(/[?&]v=([\w-]{6,})/) ||
    url.match(/youtu\.be\/([\w-]{6,})/) ||
    url.match(/shorts\/([\w-]{6,})/) ||
    url.match(/embed\/([\w-]{6,})/);
  if (idMatch) return `https://www.youtube-nocookie.com/embed/${idMatch[1]}`;
  return null;
}

export const storesQuery = queryOptions({
  queryKey: ["stores"],
  queryFn: async (): Promise<Store[]> => {
    const { data, error } = await supabase
      .from("stores")
      .select("id,name,slug,website_url,logo_url,accent_color,active")
      .eq("active", true)
      .order("name");
    if (error) throw error;
    return (data ?? []) as Store[];
  },
});

export const adminStoresQuery = queryOptions({
  queryKey: ["stores", "admin"],
  queryFn: async (): Promise<Store[]> => {
    const { data, error } = await supabase.from("stores").select("*").order("name");
    if (error) throw error;
    return (data ?? []) as Store[];
  },
});

export const categoriesQuery = queryOptions({
  queryKey: ["categories"],
  queryFn: async (): Promise<Category[]> => {
    const { data, error } = await supabase.from("categories").select("*").order("sort_order");
    if (error) throw error;
    return (data ?? []) as Category[];
  },
});

export const adminCategoriesQuery = queryOptions({
  queryKey: ["categories", "admin"],
  queryFn: async (): Promise<Category[]> => {
    const { data, error } = await supabase.from("categories").select("*").order("sort_order");
    if (error) throw error;
    return (data ?? []) as Category[];
  },
});

export const productsQuery = queryOptions({
  queryKey: ["products", "public"],
  queryFn: async (): Promise<Product[]> => {
    const { data, error } = await supabase
      .from("products")
      .select(PRODUCT_SELECT)
      .eq("active", true)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as unknown as Product[];
  },
});

export const adminProductsQuery = queryOptions({
  queryKey: ["products", "admin"],
  queryFn: async (): Promise<Product[]> => {
    const { data, error } = await supabase
      .from("products")
      .select(PRODUCT_SELECT)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as unknown as Product[];
  },
});

export function productQuery(slug: string) {
  return queryOptions({
    queryKey: ["product", slug],
    queryFn: async (): Promise<Product | null> => {
      const { data, error } = await supabase
        .from("products")
        .select(PRODUCT_SELECT)
        .eq("slug", slug)
        .maybeSingle();
      if (error) throw error;
      return (data ?? null) as unknown as Product | null;
    },
  });
}

export const couponsQuery = queryOptions({
  queryKey: ["coupons", "public"],
  queryFn: async (): Promise<Coupon[]> => {
    const { data, error } = await supabase
      .from("coupons")
      .select("*, stores(id,name,slug,accent_color)")
      .eq("active", true)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as unknown as Coupon[];
  },
});

export const adminCouponsQuery = queryOptions({
  queryKey: ["coupons", "admin"],
  queryFn: async (): Promise<Coupon[]> => {
    const { data, error } = await supabase
      .from("coupons")
      .select("*, stores(id,name,slug,accent_color)")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as unknown as Coupon[];
  },
});

export const adminReviewsQuery = queryOptions({
  queryKey: ["editorial-reviews", "admin"],
  queryFn: async (): Promise<EditorialReview[]> => {
    const { data, error } = await supabase.from("editorial_reviews").select("*").order("published_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as EditorialReview[];
  },
});

export const bannersQuery = queryOptions({ queryKey:["banners","public"], queryFn:async():Promise<Banner[]>=>{ const {data,error}=await supabase.from("banners").select("*").order("sort_order"); if(error)throw error; return data ?? []; } });
export const adminBannersQuery = queryOptions({ queryKey:["banners","admin"], queryFn:async():Promise<Banner[]>=>{ const {data,error}=await supabase.from("banners").select("*").order("sort_order"); if(error)throw error; return data ?? []; } });
export const siteSettingsQuery = queryOptions({ queryKey:["site-settings","public"], queryFn:async():Promise<SiteSetting[]>=>{ const {data,error}=await supabase.from("site_settings").select("key,value,public").eq("public",true); if(error)throw error; return (data ?? []) as SiteSetting[]; } });
export const adminSiteSettingsQuery = queryOptions({ queryKey:["site-settings","admin"], queryFn:async():Promise<SiteSetting[]>=>{ const {data,error}=await supabase.from("site_settings").select("key,value,public"); if(error)throw error; return (data ?? []) as SiteSetting[]; } });

export type ReviewStatus = "pending" | "approved" | "rejected";

export type ProductReview = {
  id: string;
  product_id: string;
  author_name: string;
  body: string;
  rating: number;
  photo_url: string | null;
  source: "admin" | "visitor";
  status: ReviewStatus;
  created_at: string;
  updated_at: string;
};

export function productReviewsQuery(productId: string | undefined) {
  return queryOptions({
    queryKey: ["product-reviews", productId ?? "none"],
    enabled: Boolean(productId),
    queryFn: async (): Promise<ProductReview[]> => {
      if (!productId) return [];
      const { data, error } = await supabase
        .from("product_reviews")
        .select("*")
        .eq("product_id", productId)
        .eq("status", "approved")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as ProductReview[];
    },
  });
}

export const adminProductReviewsQuery = queryOptions({
  queryKey: ["product-reviews", "admin"],
  queryFn: async (): Promise<ProductReview[]> => {
    const { data, error } = await supabase.from("product_reviews").select("*").order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as ProductReview[];
  },
});

export function reviewAverage(reviews: ProductReview[]) {
  if (!reviews.length) return null;
  return reviews.reduce((total, review) => total + review.rating, 0) / reviews.length;
}

// ---------- Área exclusiva para afiliados (separada do catálogo do consumidor) ----------
export type AffiliateOpportunity = {
  id: string; title: string; link_url: string; store_id: string; category_id: string | null;
  image_url: string | null; gallery: unknown; video_url: string | null;
  commission_info: string | null; commission_highlight: boolean; description: string | null;
  affiliate_notes: string | null; caption: string | null; benefits: string | null; promo_image_url: string | null;
  starts_at: string | null; ends_at: string | null; featured: boolean; active: boolean; sort_order: number; created_at: string;
  stores?: Pick<Store, "id" | "name" | "slug"> | null;
  categories?: Pick<Category, "id" | "name" | "slug" | "icon"> | null;
};
const AFF_SELECT = "*, stores(id,name,slug), categories(id,name,slug,icon)";
export const affiliateOpportunitiesQuery = queryOptions({
  queryKey: ["affiliates", "public"],
  queryFn: async (): Promise<AffiliateOpportunity[]> => {
    const { data, error } = await supabase.from("affiliate_opportunities").select(AFF_SELECT).eq("active", true)
      .order("featured", { ascending: false }).order("sort_order").order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as unknown as AffiliateOpportunity[];
  },
});
export const adminAffiliateOpportunitiesQuery = queryOptions({
  queryKey: ["affiliates", "admin"],
  queryFn: async (): Promise<AffiliateOpportunity[]> => {
    const { data, error } = await supabase.from("affiliate_opportunities").select(AFF_SELECT).order("sort_order").order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as unknown as AffiliateOpportunity[];
  },
});
export const AFFILIATE_CONTENT_KEYS = [
  ["notices", "📢 Avisos"], ["campaigns", "🔥 Campanhas em destaque"], ["commission", "💰 Oportunidades de comissão"],
  ["products", "📦 Produtos para divulgação"], ["tips", "🎯 Dicas de divulgação"], ["notes", "📝 Observações da campanha"],
] as const;
export function affiliateContent(settings: SiteSetting[] | undefined) {
  return settingsMap(settings)["affiliates"] ?? {};
}
