import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronDown, ChevronUp, Loader2, Pause, Play, Volume2, VolumeX } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { FreeShippingTag, StoreDeliveryLine } from "@/components/site/DeliveryBadges";
import { PriceBlock } from "@/components/site/PriceBlock";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { productsQuery, youtubeEmbedUrl, type Product } from "@/lib/promovip";

export const Route = createFileRoute("/promoravideos")({
  head: () => ({
    meta: [
      { title: "PromoraVídeos — Achadinhos em vídeo | PromoraShop" },
      { name: "description", content: "Descubra produtos assistindo a vídeos curtos e verticais na PromoraShop." },
      { property: "og:title", content: "PromoraVídeos — PromoraShop" },
      { property: "og:description", content: "Vídeos curtos dos achadinhos da PromoraShop." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(productsQuery),
  component: PromoraVideos,
});

function hasVideo(p: Product) {
  const v = p.video_url?.trim();
  return !!v && (v.startsWith("http") || v.startsWith("/"));
}

function PromoraVideos() {
  const { data } = useSuspenseQuery(productsQuery);
  const items = data.filter(hasVideo);
  const [active, setActive] = useState(0);
  const [muted, setMuted] = useState(true);
  const feed = useRef<HTMLDivElement>(null);

  const goTo = useCallback((i: number) => {
    const el = feed.current?.children[i] as HTMLElement | undefined;
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  useEffect(() => {
    const root = feed.current;
    if (!root) return;
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) setActive(Number((e.target as HTMLElement).dataset["index"])); }),
      { root, threshold: 0.6 },
    );
    Array.from(root.children).forEach((c) => obs.observe(c));
    return () => obs.disconnect();
  }, [items.length]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown" || e.key === "ArrowRight") { e.preventDefault(); goTo(Math.min(active + 1, items.length - 1)); }
      if (e.key === "ArrowUp" || e.key === "ArrowLeft") { e.preventDefault(); goTo(Math.max(active - 1, 0)); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, items.length, goTo]);

  return (
    <SiteLayout>
      <div className="mx-auto max-w-6xl px-4 py-4">
        <h1 className="font-display text-2xl font-bold text-foreground">PromoraVídeos</h1>
        {items.length === 0 ? (
          <div className="mt-8 rounded-xl border border-border bg-card p-8 text-center">
            <p className="text-muted-foreground">Ainda não há produtos com vídeo. Volte em breve!</p>
            <Button asChild className="mt-4"><Link to="/produtos">Ver achadinhos</Link></Button>
          </div>
        ) : (
          <div className="relative mt-3 flex justify-center">
            <div
              ref={feed}
              className="h-[calc(100dvh-9rem)] w-full max-w-[420px] snap-y snap-mandatory overflow-y-auto overscroll-contain rounded-2xl [scrollbar-width:none]"
            >
              {items.map((p, i) => (
                <VideoSlide key={p.id} product={p} index={i} active={i === active} near={Math.abs(i - active) <= 1} muted={muted} onToggleMute={() => setMuted((m) => !m)} />
              ))}
            </div>
            <div className="absolute right-0 top-1/2 hidden -translate-y-1/2 flex-col gap-3 md:flex">
              <Button variant="secondary" size="icon" aria-label="Vídeo anterior" disabled={active === 0} onClick={() => goTo(active - 1)}><ChevronUp /></Button>
              <Button variant="secondary" size="icon" aria-label="Próximo vídeo" disabled={active >= items.length - 1} onClick={() => goTo(active + 1)}><ChevronDown /></Button>
            </div>
          </div>
        )}
      </div>
    </SiteLayout>
  );
}

function VideoSlide({ product: p, index, active, near, muted, onToggleMute }: { product: Product; index: number; active: boolean; near: boolean; muted: boolean; onToggleMute: () => void }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [paused, setPaused] = useState(false);
  const embed = youtubeEmbedUrl(p.video_url);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    if (active) { setPaused(false); v.play().catch(() => setPaused(true)); }
    else v.pause();
  }, [active]);

  const toggle = () => {
    const v = ref.current;
    if (!v) return;
    if (v.paused) { v.play().catch(() => {}); setPaused(false); } else { v.pause(); setPaused(true); }
  };

  const click = async (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    await supabase.from("analytics_events").insert({ event_type: "outbound_click", product_id: p.id, store_id: p.store_id, metadata: { source: "promoravideos" } });
    window.location.assign(p.affiliate_url);
  };

  return (
    <section data-index={index} className="flex h-full snap-start snap-always flex-col gap-2 pb-2">
      <div className="relative min-h-0 flex-1 overflow-hidden rounded-2xl bg-foreground/95">
        {embed ? (
          active ? (
            <iframe className="size-full" src={`${embed}?autoplay=1&mute=1&playsinline=1`} title={`Vídeo de ${p.title}`} allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen onLoad={() => setLoading(false)} />
          ) : null
        ) : (
          <video
            ref={ref}
            src={near ? p.video_url! : undefined}
            muted={muted}
            loop
            playsInline
            preload={active ? "auto" : "metadata"}
            poster={p.image_url ?? undefined}
            onClick={toggle}
            onWaiting={() => setLoading(true)}
            onCanPlay={() => setLoading(false)}
            onPlaying={() => setLoading(false)}
            onError={() => { setFailed(true); setLoading(false); }}
            className="size-full cursor-pointer object-contain"
          />
        )}
        {loading && !failed && near ? (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center"><Loader2 className="size-8 animate-spin text-primary-foreground" /></div>
        ) : null}
        {failed ? (
          <div className="absolute inset-0 flex items-center justify-center p-6 text-center text-sm text-primary-foreground">Não foi possível carregar este vídeo agora.</div>
        ) : null}
        {!embed && !failed ? (
          <div className="absolute right-3 top-3 flex gap-2">
            <button type="button" onClick={toggle} aria-label={paused ? "Reproduzir" : "Pausar"} className="flex size-9 items-center justify-center rounded-full bg-primary/80 text-primary-foreground backdrop-blur">
              {paused ? <Play className="size-4" /> : <Pause className="size-4" />}
            </button>
            <button type="button" onClick={onToggleMute} aria-label={muted ? "Ativar som" : "Desativar som"} className="flex size-9 items-center justify-center rounded-full bg-primary/80 text-primary-foreground backdrop-blur">
              {muted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
            </button>
          </div>
        ) : null}
      </div>
      <div className="shrink-0 rounded-2xl border border-border bg-card p-3">
        <StoreDeliveryLine product={p} storeName={p.stores?.name ?? "Loja parceira"} className="text-xs font-medium text-muted-foreground" />
        <FreeShippingTag product={p} className="mt-1" />
        <h2 className="mt-1 line-clamp-1 font-display text-base font-semibold text-foreground">{p.title}</h2>
        <div className="mt-2 flex items-end justify-between gap-3">
          <PriceBlock product={p} />
          <Button asChild className="shrink-0">
            <a href={p.affiliate_url} rel="sponsored noreferrer" onClick={click}>Quero esse! 💜</a>
          </Button>
        </div>
      </div>
    </section>
  );
}
