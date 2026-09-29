import { discountPercent, formatPrice, type Product } from "@/lib/promovip";

type P = Pick<Product, "price" | "original_price" | "currency" | "discount_mode" | "discount_percent">;

export function PriceBlock({ product, size = "card" }: { product: P; size?: "card" | "detail" }) {
  if (product.price === null) return <span className="text-sm text-muted-foreground">{size === "detail" ? "Preço disponível na loja" : "Consulte na loja"}</span>;
  const hasOld = product.original_price != null && product.original_price > product.price;
  const pct = hasOld ? discountPercent(product) : null;
  const pctLabel = pct == null ? null : `${pct.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}% OFF`;
  const big = size === "detail";
  return (
    <div className="space-y-0.5">
      {hasOld ? (
        <p className={`${big ? "text-sm" : "text-xs"} text-muted-foreground`}>
          De <span className="line-through">{formatPrice(product.original_price, product.currency)}</span>
        </p>
      ) : null}
      <div className="flex flex-wrap items-center gap-2">
        <span className={`font-display font-bold text-primary ${big ? "text-3xl" : "text-lg"}`}>
          {hasOld && big ? <span className="mr-1 text-base font-semibold text-foreground">Por</span> : null}
          {formatPrice(product.price, product.currency)}
        </span>
        {pctLabel ? <span className="rounded-md bg-primary px-1.5 py-0.5 text-[11px] font-bold text-primary-foreground">{pctLabel}</span> : null}
      </div>
    </div>
  );
}
