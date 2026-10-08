import type { Product } from "@/lib/promovip";

type DeliveryProduct = Pick<Product, "frete_gratis" | "entrega_super_rapida">;

/** Small "Frete grátis" tag shown before the product name. Renders nothing when off. */
export function FreeShippingTag({ product, className = "" }: { product: DeliveryProduct; className?: string }) {
  if (!product.frete_gratis) return null;
  return (
    <span className={`inline-flex w-fit items-center rounded-sm bg-shipping/10 px-1.5 py-0.5 text-[10px] font-bold uppercase leading-none text-shipping ${className}`}>
      Frete grátis
    </span>
  );
}

/** Store name with optional fast-delivery info: "Loja · Entrega⚡️" (short) or "Loja · Entrega Rápida ⚡️" (detail). */
export function StoreDeliveryLine({
  product,
  storeName,
  variant = "short",
  className = "",
}: {
  product: DeliveryProduct;
  storeName: string;
  variant?: "short" | "detail";
  className?: string;
}) {
  return (
    <p className={className}>
      {storeName}
      {product.entrega_super_rapida ? (
        <>
          {" · "}
          {variant === "detail" ? (
            <span className="font-semibold">
              <span className="delivery-fast-text">Entrega Rápida</span> <span className="delivery-fast-icon" aria-hidden="true">⚡️</span>
            </span>
          ) : (
            <span className="font-semibold">Entrega⚡️</span>
          )}
        </>
      ) : null}
    </p>
  );
}

export function DeliveryBadges({ product, storeName, variant = "short", className = "" }: { product: DeliveryProduct; storeName: string; variant?: "short" | "detail"; className?: string }) {
  return <StoreDeliveryLine product={product} storeName={storeName} variant={variant} className={className} />;
}
