import { ExternalLink, Ticket } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Coupon } from "@/lib/promovip";

export function CouponCard({ coupon }: { coupon: Coupon }) {
  const expires = coupon.expires_at ? new Date(coupon.expires_at) : null;
  const expired = expires ? expires.getTime() < Date.now() : false;

  return (
    <article className="rounded-xl border border-border bg-card p-5 shadow-soft">
      <div className="flex items-start justify-between gap-4">
        <div className="flex size-10 items-center justify-center rounded-lg bg-secondary text-primary"><Ticket /></div>
        {coupon.featured ? <Badge variant="secondary">Destaque</Badge> : null}
      </div>
      <p className="mt-5 text-xs font-medium text-muted-foreground">{coupon.stores?.name ?? "Loja parceira"}</p>
      <h3 className="mt-1 font-display text-lg font-semibold text-foreground">{coupon.title}</h3>
      {coupon.discount_label ? <p className="mt-2 text-2xl font-bold text-primary">{coupon.discount_label}</p> : null}
      {coupon.description ? <p className="mt-3 text-sm text-muted-foreground">{coupon.description}</p> : null}
      {coupon.conditions ? <p className="mt-3 text-xs text-muted-foreground">Condições: {coupon.conditions}</p> : null}
      <p className="mt-3 text-xs text-muted-foreground">
        {expires ? `${expired ? "Expirou" : "Validade informada"}: ${expires.toLocaleDateString("pt-BR")}` : "Validade não informada — confirme na loja"}
      </p>
      {coupon.code ? <div className="mt-4 rounded-lg border border-dashed border-primary/40 bg-secondary px-3 py-2 text-center font-mono text-sm font-semibold">{coupon.code}</div> : null}
      <Button asChild className="mt-4 w-full" variant="outline" disabled={expired}>
        <a href={coupon.affiliate_url} target="_blank" rel="sponsored noopener noreferrer">
          {expired ? "Cupom expirado" : "Ver condições na loja"}<ExternalLink />
        </a>
      </Button>
    </article>
  );
}