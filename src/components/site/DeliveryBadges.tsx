import type { Product } from "@/lib/promovip";

export function DeliveryBadges({ product, className = "" }: { product: Pick<Product, "frete_gratis" | "entrega_super_rapida">; className?: string }) {
  if (!product.frete_gratis && !product.entrega_super_rapida) return null;

  return (
    <div className={`flex flex-wrap gap-1.5 ${className}`}>
      {product.frete_gratis ? (
        <span className="inline-flex items-center rounded-md border border-primary/20 bg-secondary px-2 py-1 text-[11px] font-semibold leading-tight text-secondary-foreground">
          🚚 Frete grátis
        </span>
      ) : null}
      {product.entrega_super_rapida ? (
        <span className="delivery-fast relative inline-flex items-center gap-1 overflow-hidden rounded-md border border-primary/25 bg-accent px-2 py-1 text-[11px] font-semibold leading-tight text-accent-foreground">
          <span className="delivery-fast-icon" aria-hidden="true">⚡</span>
          <span className="delivery-fast-text">Entrega SUPER rápida</span>
        </span>
      ) : null}
    </div>
  );
}