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
  specifications?: Record<string, unknown>;
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
