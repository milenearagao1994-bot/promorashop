import { Link } from "@tanstack/react-router";
import { Timer, Zap } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { autoDiscount, formatPrice, type FlashDeal } from "@/lib/promovip";

function remaining(endsAt: string, now: number) {
  const ms = Math.max(0, new Date(endsAt).getTime() - now);
  const s = Math.floor(ms / 1000);
  const pad = (n: number) => String(n).padStart(2, "0");
  const days = Math.floor(s / 86400);
  const hms = `${pad(Math.floor((s % 86400) / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`;
  return { done: ms <= 0, label: days ? `${days}d ${hms}` : hms };
}

/** Countdown is derived from the stored end time, so it stays correct after reload or on another device. */
export function FlashDealCard({ deal, preview = false }: { deal: FlashDeal; preview?: boolean }) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const t = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, []);
  const p = deal.products;
  const time = now === null ? null : remaining(deal.ends_at, now);
  if (!p || (time?.done && !preview)) return null;
  const off = autoDiscount(deal.final_price, deal.original_price);
  const image = deal.image_url || p.image_url;
  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-primary/20 bg-card shadow-soft">
      <div className="aspect-square bg-muted">{image ? <img src={image} alt={p.title} loading="lazy" className="size-full object-cover" /> : null}</div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <h3 className="line-clamp-2 text-sm font-semibold">{p.title}</h3>
        <span className="text-xs text-muted-foreground line-through">{formatPrice(deal.original_price)}</span>
        {off ? <span className="w-fit rounded-full bg-primary px-2 py-0.5 text-xs font-bold text-primary-foreground">{off}% OFF</span> : null}
        <span className="font-display text-xl font-bold text-primary">{formatPrice(deal.final_price)}</span>
        <span className="mt-1 flex items-center gap-1 text-xs font-semibold tabular-nums" aria-live="off">
          <Timer className="size-3.5 text-primary" />{time ? (time.done ? "Encerrada" : `Termina em ${time.label}`) : "—"}
        </span>
        <Button asChild size="sm" className="mt-2 w-full">
          <Link to="/produto/$slug" params={{ slug: p.slug }}>Quero esse</Link>
        </Button>
      </div>
    </article>
  );
}

export function FlashDealsSection({ deals }: { deals: FlashDeal[] }) {
  if (!deals.length) return null;
  return (
    <section className="rounded-2xl bg-night-gradient p-3 md:p-5">
      <h2 className="flex items-center gap-2 font-display text-lg font-bold text-highlight-foreground md:text-2xl"><Zap className="size-5 fill-primary text-primary" />Relâmpagos</h2>
      <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:gap-4">
        {deals.slice(0, 3).map((d) => <FlashDealCard key={d.id} deal={d} />)}
      </div>
    </section>
  );
}
