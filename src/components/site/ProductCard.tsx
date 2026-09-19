import { Link } from "@tanstack/react-router";
import { ArrowUpRight, ImageIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatPrice, type Product } from "@/lib/promovip";

export function ProductCard({ product }: { product: Product }) {
  return (
    <article className="group overflow-hidden rounded-xl border border-border bg-card transition duration-300 hover:-translate-y-1 hover:shadow-card">
      <div className="relative aspect-[4/5] overflow-hidden bg-muted">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.title}
            loading="lazy"
            className="size-full object-cover transition duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex size-full items-center justify-center text-muted-foreground">
            <ImageIcon className="size-8" aria-hidden="true" />
          </div>
        )}
        {product.featured ? <Badge className="absolute left-3 top-3">Destaque</Badge> : null}
      </div>
      <div className="space-y-3 p-4">
        <div>
          <p className="text-xs font-medium text-muted-foreground">{product.stores?.name ?? "Loja parceira"}</p>
          <h3 className="mt-1 line-clamp-2 font-display text-base font-semibold text-foreground">{product.title}</h3>
        </div>
        <div className="flex min-h-10 items-end justify-between gap-3">
          <div>
            {product.price === null ? (
              <span className="text-sm text-muted-foreground">Consulte na loja</span>
            ) : (
              <span className="font-display text-lg font-bold text-primary">{formatPrice(product.price, product.currency)}</span>
            )}
          </div>
          <Button asChild size="icon-sm" aria-label={`Ver ${product.title}`}>
            <Link to="/produto/$slug" params={{ slug: product.slug }}><ArrowUpRight /></Link>
          </Button>
        </div>
      </div>
    </article>
  );
}