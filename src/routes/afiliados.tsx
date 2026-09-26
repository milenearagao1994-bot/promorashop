import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Rocket } from "lucide-react";
import { useEffect } from "react";

import { EmptyState } from "@/components/site/EmptyState";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { AFFILIATE_CONTENT_KEYS, affiliateContent, affiliateOpportunitiesQuery, siteSettingsQuery, type AffiliateOpportunity } from "@/lib/promovip";

const title = "Exclusivo para Afiliados — PromoraShop";
const description = "Encontre produtos, campanhas e oportunidades para divulgar e potencializar seus ganhos como afiliado.";
export const Route = createFileRoute("/afiliados")({
  loader: ({ context }) => Promise.all([context.queryClient.ensureQueryData(affiliateOpportunitiesQuery), context.queryClient.ensureQueryData(siteSettingsQuery)]),
  head: () => ({ meta: [{ title }, { name: "description", content: description }, { property: "og:title", content: title }, { property: "og:description", content: description }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: AffiliatesPage,
});

function Card({ o }: { o: AffiliateOpportunity }) {
  async function go() {
    try { await supabase.from("affiliate_events").insert({ event_type: "link_click", opportunity_id: o.id, store_id: o.store_id, category_id: o.category_id }); } catch { /* não bloqueia o afiliado */ }
    window.open(o.link_url, "_blank", "noopener,noreferrer");
  }
  return (
    <article className="flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-card">
      {o.image_url ? <img src={o.image_url} alt={o.title} loading="lazy" className="aspect-square w-full bg-muted object-cover" /> : null}
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex flex-wrap gap-1.5 text-[11px] font-semibold">
          {o.featured ? <span className="rounded-full bg-accent px-2 py-0.5 text-accent-foreground">🔥 Destaque</span> : null}
          {o.stores?.name ? <span className="rounded-full bg-secondary px-2 py-0.5 text-primary">{o.stores.name}</span> : null}
          {o.categories?.name ? <span className="rounded-full bg-muted px-2 py-0.5 text-muted-foreground">{o.categories.name}</span> : null}
        </div>
        <h3 className="font-display text-base font-semibold leading-snug">{o.title}</h3>
        {o.commission_info ? <p className={`text-sm font-semibold ${o.commission_highlight ? "text-primary" : "text-foreground"}`}>💰 {o.commission_info}</p> : null}
        {o.description ? <p className="whitespace-pre-line text-sm text-muted-foreground">{o.description}</p> : null}
        {o.affiliate_notes ? <p className="whitespace-pre-line rounded-lg bg-muted/60 p-2 text-xs text-muted-foreground">📝 {o.affiliate_notes}</p> : null}
        {o.caption ? <details className="text-xs"><summary className="cursor-pointer font-semibold text-primary">Legenda sugerida</summary><p className="mt-1 whitespace-pre-line text-muted-foreground">{o.caption}</p></details> : null}
        {o.benefits ? <details className="text-xs"><summary className="cursor-pointer font-semibold text-primary">Benefícios</summary><p className="mt-1 whitespace-pre-line text-muted-foreground">{o.benefits}</p></details> : null}
        {o.video_url ? <a href={o.video_url} target="_blank" rel="noreferrer" className="text-xs font-semibold text-primary underline">Ver vídeo</a> : null}
        {o.promo_image_url ? <a href={o.promo_image_url} target="_blank" rel="noreferrer" className="text-xs font-semibold text-primary underline">Imagem para divulgação</a> : null}
        {o.ends_at ? <p className="text-[11px] text-muted-foreground">Até {new Date(o.ends_at).toLocaleDateString("pt-BR")}</p> : null}
        <Button onClick={go} className="mt-auto w-full"><Rocket />Divulgar produto</Button>
      </div>
    </article>
  );
}

function AffiliatesPage() {
  const { data } = useSuspenseQuery(affiliateOpportunitiesQuery);
  const { data: settings } = useSuspenseQuery(siteSettingsQuery);
  const content = affiliateContent(settings);
  useEffect(() => { void supabase.from("affiliate_events").insert({ event_type: "page_view" }); }, []);
  const featured = data.filter((o) => o.featured);
  const byStore = new Map<string, { name: string; items: AffiliateOpportunity[] }>();
  for (const o of data) { const k = o.store_id; const g = byStore.get(k) ?? { name: o.stores?.name ?? "Outras lojas", items: [] }; g.items.push(o); byStore.set(k, g); }
  const cats = Array.from(new Map(data.filter((o) => o.categories).map((o) => [o.category_id!, o.categories!])).values());
  const blocks = AFFILIATE_CONTENT_KEYS.filter(([k]) => content[k]?.trim());
  return (
    <SiteLayout>
      <section className="bg-soft-gradient"><div className="mx-auto max-w-6xl px-4 py-12">
        <p className="text-xs font-semibold text-primary">💜 EXCLUSIVO PARA AFILIADOS</p>
        <h1 className="mt-2 font-display text-3xl font-bold md:text-5xl">Área exclusiva para afiliados</h1>
        <p className="mt-4 max-w-2xl text-muted-foreground">{description}</p>
        <p className="mt-3 max-w-2xl text-xs text-muted-foreground">Comissões e condições são definidas pelas lojas parceiras. Cliques não garantem vendas nem comissões.</p>
        {cats.length ? <div className="mt-6 flex gap-2 overflow-x-auto pb-1">{cats.map((c) => <a key={c.id} href={`#cat-${c.slug}`} className="shrink-0 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold hover:border-primary">{c.icon ? `${c.icon} ` : ""}{c.name}</a>)}</div> : null}
      </div></section>
      <div className="mx-auto max-w-6xl space-y-12 px-4 py-10">
        {blocks.length ? <div className="grid gap-3 md:grid-cols-2">{blocks.map(([k, label]) => <div key={k} className="rounded-xl border border-border bg-card p-4"><h2 className="font-display font-semibold">{label}</h2><p className="mt-2 whitespace-pre-line text-sm text-muted-foreground">{content[k]}</p></div>)}</div> : null}
        {!data.length ? <EmptyState title="Oportunidades em breve" description="Assim que houver oportunidades cadastradas, elas aparecerão aqui." /> : null}
        {featured.length ? <section><h2 className="font-display text-2xl font-bold">🔥 Oportunidades em destaque</h2><div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">{featured.map((o) => <Card key={o.id} o={o} />)}</div></section> : null}
        {Array.from(byStore.entries()).map(([id, g]) => <section key={id}><h2 className="font-display text-2xl font-bold">🛍️ {g.name}</h2><div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">{g.items.map((o) => <Card key={o.id} o={o} />)}</div></section>)}
        {cats.map((c) => { const items = data.filter((o) => o.category_id === c.id); return <section key={c.id} id={`cat-${c.slug}`} className="scroll-mt-20"><h2 className="font-display text-xl font-bold">{c.icon ? `${c.icon} ` : ""}{c.name}</h2><div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">{items.map((o) => <Card key={o.id} o={o} />)}</div></section>; })}
      </div>
    </SiteLayout>
  );
}
