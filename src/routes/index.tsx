import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, ChevronLeft, ChevronRight, MessageCircleHeart, Search, ShoppingBag, Sparkles, Tag } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { CouponCard } from "@/components/site/CouponCard";
import { EmptyState } from "@/components/site/EmptyState";
import { ProductCard } from "@/components/site/ProductCard";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { affiliateOpportunitiesQuery, bannersQuery, categoriesQuery, contactConfig, couponsQuery, discountHuntConfig, productsQuery, siteSettingsQuery, type Banner } from "@/lib/promovip";

const description = "Achadinhos, ofertas, promoções e produtos selecionados em um só lugar.";
const ZAP_MESSAGE = "Entre na lista VIP Gratuita e receba ofertas diárias no seu celular";
const ASPECTS = new Set(["15/9", "16/9", "4/3", "1/1", "21/9", "3/1"]);

export const Route = createFileRoute("/")({
  loader: ({ context }) => Promise.all([
    context.queryClient.ensureQueryData(productsQuery),
    context.queryClient.ensureQueryData(categoriesQuery),
    context.queryClient.ensureQueryData(couponsQuery),
    context.queryClient.ensureQueryData(bannersQuery),
    context.queryClient.ensureQueryData(siteSettingsQuery),
    context.queryClient.ensureQueryData(affiliateOpportunitiesQuery),
  ]),
  head: () => ({ meta: [
    { title: "PromoraShop — Achadinhos, ofertas e promoções" },
    { name: "description", content: description },
    { property: "og:title", content: "PromoraShop — Achadinhos, ofertas e promoções" },
    { property: "og:description", content: description },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: Index,
});

function whatsappLink(base: string, text: string) {
  const digits = base.replace(/\D/g, "") || "5571992600863";
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

function Index() {
  const { data: products } = useSuspenseQuery(productsQuery);
  const { data: categories } = useSuspenseQuery(categoriesQuery);
  const { data: coupons } = useSuspenseQuery(couponsQuery);
  const { data: banners } = useSuspenseQuery(bannersQuery);
  const { data: settings } = useSuspenseQuery(siteSettingsQuery);
  const { data: opportunities } = useSuspenseQuery(affiliateOpportunitiesQuery);

  const landing = (settings.find((s) => s.key === "landing")?.value ?? {}) as Record<string, string>;
  const aspect = ASPECTS.has(landing["banner_aspect"] ?? "") ? landing["banner_aspect"]! : "15/9";
  const featured = products.filter((p) => p.featured);
  const offers = (featured.length ? featured : products).slice(0, 12);
  const hunt = discountHuntConfig(settings);
  const contact = contactConfig(settings);
  const commission = opportunities.find((o) => o.commission_highlight && o.commission_info?.trim())?.commission_info?.trim();

  return (
    <SiteLayout>
      {banners.length ? (
        <section className="mx-auto max-w-6xl px-4 pt-4 md:pt-6"><HomeBanners banners={banners} aspect={aspect} /></section>
      ) : null}

      <section className="mx-auto max-w-6xl px-4 pt-6 md:pt-10">
        <div className="flex items-end justify-between gap-4">
          <h2 className="font-display text-2xl font-bold md:text-3xl">Promoções em Destaque</h2>
          <Button asChild variant="ghost" size="sm"><Link to="/produtos">Ver todas <ArrowRight /></Link></Button>
        </div>
        <div className="mt-4">
          {offers.length ? (
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:gap-5 lg:grid-cols-4 xl:grid-cols-5">{offers.map((p) => <ProductCard key={p.id} product={p} />)}</div>
          ) : (
            <EmptyState title="A curadoria está chegando" description="Nenhum produto foi cadastrado ainda." />
          )}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pt-8">
        <a href={whatsappLink(contact.whatsapp, ZAP_MESSAGE)} target="_blank" rel="noopener noreferrer" className="group flex items-center justify-between gap-4 rounded-2xl bg-brand-gradient px-5 py-4 text-primary-foreground shadow-soft transition hover:-translate-y-0.5 md:px-8 md:py-5">
          <span>
            <span className="block font-display text-lg font-bold md:text-xl">Quero receber ofertas no Zap</span>
            <span className="mt-0.5 block text-xs text-primary-foreground/80 md:text-sm">Entre na lista VIP Gratuita e receba ofertas diárias no seu celular.</span>
          </span>
          <ArrowRight className="size-5 shrink-0 transition group-hover:translate-x-1" />
        </a>
      </section>

      <section className="mx-auto max-w-6xl px-4 pt-12">
        <h2 className="font-display text-2xl font-bold md:text-3xl">🛍️ Explorar por categorias</h2>
        <div className="mt-4 flex gap-3 overflow-x-auto pb-3">
          {categories.length ? categories.map((c) => (
            <Link key={c.id} to="/produtos" search={{ q: c.name }} className="flex min-w-36 items-center gap-3 rounded-xl border border-border bg-card p-4 text-sm font-semibold transition hover:border-primary hover:text-primary"><Tag className="size-4" />{c.name}</Link>
          )) : <p className="text-sm text-muted-foreground">As categorias aparecerão aqui quando estiverem ativas.</p>}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pt-10">
        <div className="grid items-center gap-6 rounded-2xl border border-primary/15 bg-soft-gradient p-6 md:grid-cols-[1fr_auto] md:p-10">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-card px-3 py-1.5 text-xs font-semibold text-primary"><Search className="size-3.5" />🔎 {hunt.name.toUpperCase()}</div>
            <h2 className="mt-4 font-display text-2xl font-bold md:text-3xl">{hunt.title}</h2>
            <p className="mt-3 max-w-xl text-muted-foreground">{hunt.description}</p>
          </div>
          <Button asChild size="lg" className="w-full md:w-auto"><Link to="/caca-ao-desconto" search={{}}>{hunt.cta}</Link></Button>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pt-12">
        <div className="flex items-end justify-between gap-4">
          <h2 className="font-display text-2xl font-bold md:text-3xl">🎟️ Cupons</h2>
          <Button asChild variant="ghost" size="sm"><Link to="/cupons">Ver cupons <ArrowRight /></Link></Button>
        </div>
        <div className="mt-4">
          {coupons.slice(0, 3).length ? (
            <div className="grid gap-4 md:grid-cols-3">{coupons.slice(0, 3).map((c) => <CouponCard key={c.id} coupon={c} />)}</div>
          ) : <EmptyState title="Sem cupons ativos agora" description="Assim que houver cupons cadastrados e não expirados, eles aparecerão aqui." />}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pt-12">
        <div className="flex flex-col items-start justify-between gap-4 rounded-xl border border-border bg-card p-5 sm:flex-row sm:items-center">
          <div>
            <h2 className="font-display text-lg font-semibold">💜 Exclusivo para Afiliados</h2>
            <p className="mt-1 text-sm text-muted-foreground">Produtos, campanhas e oportunidades para quem divulga.</p>
            {commission ? <p className="mt-3 inline-flex items-baseline gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">Comissão extra <span className="font-display text-lg">{commission}</span></p> : null}
          </div>
          <Button asChild variant="outline"><Link to="/afiliados">Conhecer área de afiliados <ArrowRight /></Link></Button>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pt-12">
        <div className="flex flex-col gap-5 overflow-hidden rounded-2xl bg-night-gradient px-6 py-8 text-primary-foreground md:flex-row md:items-center md:justify-between md:px-10">
          <div className="flex items-start gap-4">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary-foreground/10"><MessageCircleHeart className="size-6 text-lilac" /></span>
            <div>
              <h2 className="font-display text-xl font-bold md:text-2xl">✨ Conversar com a Vivi</h2>
              <p className="mt-1 max-w-xl text-sm text-primary-foreground/75">{landing["vivi_description"] || "A Vivi é sua assistente que vai te ajudar a encontrar o que você precisa, por um preço que vale a pena."}</p>
            </div>
          </div>
          <Button asChild variant="vip" size="lg"><Link to="/vivi"><Sparkles />Abrir chat</Link></Button>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-12 text-center">
        <ShoppingBag className="mx-auto size-5 text-primary/70" />
        <p className="mt-3 text-sm leading-6 text-muted-foreground">Achadinhos selecionados com carinho, informações claras e uma assistente pronta para ajudar você a encontrar o que combina com sua vida!</p>
      </section>
    </SiteLayout>
  );
}

function HomeBanners({ banners, aspect }: { banners: Banner[]; aspect: string }) {
  const slides = banners.filter((b) => b.image_url);
  const [index, setIndex] = useState(0);
  const [pausedUntil, setPausedUntil] = useState(0);
  const touchStart = useRef<number | null>(null);
  const total = slides.length;
  useEffect(() => {
    if (total < 2) return;
    const timer = window.setInterval(() => { if (Date.now() >= pausedUntil) setIndex((v) => (v + 1) % total); }, 5000);
    return () => window.clearInterval(timer);
  }, [total, pausedUntil]);
  if (!total) return null;
  const go = (next: number) => { setIndex(((next % total) + total) % total); setPausedUntil(Date.now() + 8000); };
  return (
    <div className="relative">
      <div className="relative overflow-hidden rounded-2xl bg-muted shadow-soft" style={{ aspectRatio: aspect }}
        onTouchStart={(e) => { touchStart.current = e.touches[0]?.clientX ?? null; }}
        onTouchEnd={(e) => { const s = touchStart.current; const end = e.changedTouches[0]?.clientX; touchStart.current = null; if (s === null || end === undefined || Math.abs(end - s) < 40) return; go(index + (end < s ? 1 : -1)); }}>
        <div className="flex h-full transition-transform duration-500" style={{ transform: `translateX(-${index * 100}%)` }}>
          {slides.map((b, i) => (
            <a key={b.id} href={b.link_url ?? "#"} target="_blank" rel="noopener noreferrer" aria-label={`Banner ${i + 1} de ${total}`} className="block h-full w-full shrink-0">
              <img src={b.image_url!} alt="" className="size-full object-cover" loading={i === 0 ? "eager" : "lazy"} draggable={false} />
            </a>
          ))}
        </div>
        {total > 1 ? (<>
          <button type="button" aria-label="Banner anterior" onClick={() => go(index - 1)} className="absolute left-2 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-card/80 text-primary shadow-soft backdrop-blur"><ChevronLeft className="size-4" /></button>
          <button type="button" aria-label="Próximo banner" onClick={() => go(index + 1)} className="absolute right-2 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-card/80 text-primary shadow-soft backdrop-blur"><ChevronRight className="size-4" /></button>
        </>) : null}
      </div>
      {total > 1 ? (
        <div className="mt-2 flex justify-center gap-1.5">
          {slides.map((b, i) => <button key={b.id} type="button" aria-label={`Ir para banner ${i + 1}`} onClick={() => go(i)} className={`h-1.5 rounded-full transition-all ${i === index ? "w-5 bg-primary" : "w-1.5 bg-primary/30"}`} />)}
        </div>
      ) : null}
    </div>
  );
}
