import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/site/ProductCard";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { categoriesQuery, productsQuery, storesQuery } from "@/lib/promovip";

export const Route = createFileRoute("/produtos")({
  validateSearch: (search: Record<string, unknown>): { q?: string } => (typeof search['q'] === "string" && search['q'].trim() ? { q: search['q'].slice(0, 120) } : {}),
  loader: ({ context }) => Promise.all([context.queryClient.ensureQueryData(productsQuery), context.queryClient.ensureQueryData(categoriesQuery), context.queryClient.ensureQueryData(storesQuery)]),
  head: () => ({ meta: [
    { title: "Achadinhos — PromoraShop" },
    { name: "description", content: "Explore produtos selecionados pela PromoraShop e acesse diretamente as lojas parceiras." },
    { property: "og:title", content: "Achadinhos — PromoraShop" },
    { property: "og:description", content: "Produtos selecionados com informação clara e links para lojas parceiras." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ]}),
  component: ProductsPage,
});

function ProductsPage() {
  const { data: products } = useSuspenseQuery(productsQuery);
  const { data: categories } = useSuspenseQuery(categoriesQuery);
  const { data: stores } = useSuspenseQuery(storesQuery);
  const { q } = Route.useSearch();
  const [query, setQuery] = useState(q ?? "");
  useEffect(() => { setQuery(q ?? ""); }, [q]);
  const [category, setCategory] = useState("all");
  const [store, setStore] = useState("all");
  const [sort, setSort] = useState("featured");
  const visible = useMemo(() => products.filter((product) => {
    const raw = (`${product.title} ${product.short_description ?? ""} ${product.description ?? ""} ${product.tags.join(" ")} ${product.stores?.name ?? ""} ${product.categories?.name ?? ""}`);
    const text = normalize(raw); const compact = text.replace(/\s+/g, "");
    const words = normalize(query).split(/\s+/).filter(Boolean);
    return words.every((word) => text.includes(word) || compact.includes(word)) && (category === "all" || product.category_id === category) && (store === "all" || product.store_id === store);
  }).sort((a, b) => sort === "new" ? Date.parse(b.created_at) - Date.parse(a.created_at) : Number(b.featured) - Number(a.featured) || a.sort_order - b.sort_order), [products, query, category, store, sort]);

  return <SiteLayout><div className="mx-auto w-full max-w-6xl px-4 py-10">
    <h1 className="font-display text-3xl font-bold text-foreground md:text-5xl">{q ? <>Resultados para “{q}”</> : "Achadinhos para o seu estilo"}</h1>
    <p className="mt-3 max-w-2xl text-muted-foreground">Busque com calma. O preço e a disponibilidade devem ser confirmados na loja parceira.</p>
    <div className="mt-8 grid gap-3 rounded-xl border border-border bg-card p-4 md:grid-cols-[2fr_1fr_1fr_1fr]">
      <label className="relative"><Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar produtos" className="pl-9" /></label>
      <Select value={category} onValueChange={setCategory}><SelectTrigger><SelectValue placeholder="Categoria" /></SelectTrigger><SelectContent><SelectItem value="all">Todas as categorias</SelectItem>{categories.map((item) => <SelectItem value={item.id} key={item.id}>{item.name}</SelectItem>)}</SelectContent></Select>
      <Select value={store} onValueChange={setStore}><SelectTrigger><SelectValue placeholder="Loja" /></SelectTrigger><SelectContent><SelectItem value="all">Todas as lojas</SelectItem>{stores.map((item) => <SelectItem value={item.id} key={item.id}>{item.name}</SelectItem>)}</SelectContent></Select>
      <Select value={sort} onValueChange={setSort}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="featured">Destaques</SelectItem><SelectItem value="new">Novidades</SelectItem></SelectContent></Select>
    </div>
    <div className="mt-8">{visible.length ? <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-6 lg:grid-cols-4">{visible.map((product) => <ProductCard key={product.id} product={product} />)}</div> : <div className="rounded-2xl border border-primary/15 bg-soft-gradient p-6 text-center md:p-10">
      <p className="font-display text-xl font-bold">{query.trim() ? <>Não encontramos “{query.trim()}” no nosso catálogo.</> : "Não encontramos esse produto no momento 💜"}</p>
      <p className="mt-2 text-muted-foreground">Mas podemos tentar encontrar uma oferta para você.</p>
      <Button asChild size="lg" className="mt-5"><Link to="/caca-ao-desconto" search={query.trim() ? { produto: query.trim() } : {}}>🔎 Procurar desconto</Link></Button>
    </div>}</div>
  </div></SiteLayout>;
}

function normalize(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s+/g, " ").trim();
}
