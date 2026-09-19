import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";

import { EmptyState } from "@/components/site/EmptyState";
import { ProductCard } from "@/components/site/ProductCard";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { categoriesQuery, productsQuery, storesQuery } from "@/lib/promovip";

export const Route = createFileRoute("/produtos")({
  loader: ({ context }) => Promise.all([context.queryClient.ensureQueryData(productsQuery), context.queryClient.ensureQueryData(categoriesQuery), context.queryClient.ensureQueryData(storesQuery)]),
  head: () => ({ meta: [
    { title: "Achadinhos — PromoVip" },
    { name: "description", content: "Explore produtos selecionados pela PromoVip e acesse diretamente as lojas parceiras." },
    { property: "og:title", content: "Achadinhos — PromoVip" },
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
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [store, setStore] = useState("all");
  const [sort, setSort] = useState("featured");
  const visible = useMemo(() => products.filter((product) => {
    const text = `${product.title} ${product.short_description ?? ""} ${product.tags.join(" ")}`.toLowerCase();
    return text.includes(query.toLowerCase()) && (category === "all" || product.category_id === category) && (store === "all" || product.store_id === store);
  }).sort((a, b) => sort === "new" ? Date.parse(b.created_at) - Date.parse(a.created_at) : Number(b.featured) - Number(a.featured) || a.sort_order - b.sort_order), [products, query, category, store, sort]);

  return <SiteLayout><div className="mx-auto w-full max-w-6xl px-4 py-10">
    <h1 className="font-display text-3xl font-bold text-foreground md:text-5xl">Achadinhos para o seu estilo</h1>
    <p className="mt-3 max-w-2xl text-muted-foreground">Busque com calma. O preço e a disponibilidade devem ser confirmados na loja parceira.</p>
    <div className="mt-8 grid gap-3 rounded-xl border border-border bg-card p-4 md:grid-cols-[2fr_1fr_1fr_1fr]">
      <label className="relative"><Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar produtos" className="pl-9" /></label>
      <Select value={category} onValueChange={setCategory}><SelectTrigger><SelectValue placeholder="Categoria" /></SelectTrigger><SelectContent><SelectItem value="all">Todas as categorias</SelectItem>{categories.map((item) => <SelectItem value={item.id} key={item.id}>{item.name}</SelectItem>)}</SelectContent></Select>
      <Select value={store} onValueChange={setStore}><SelectTrigger><SelectValue placeholder="Loja" /></SelectTrigger><SelectContent><SelectItem value="all">Todas as lojas</SelectItem>{stores.map((item) => <SelectItem value={item.id} key={item.id}>{item.name}</SelectItem>)}</SelectContent></Select>
      <Select value={sort} onValueChange={setSort}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="featured">Destaques</SelectItem><SelectItem value="new">Novidades</SelectItem></SelectContent></Select>
    </div>
    <div className="mt-8">{visible.length ? <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-6 lg:grid-cols-4">{visible.map((product) => <ProductCard key={product.id} product={product} />)}</div> : <EmptyState title="Nenhum achadinho por aqui" description="Tente retirar um filtro ou conversar com a Vivi para buscar outra ideia." />}</div>
  </div></SiteLayout>;
}