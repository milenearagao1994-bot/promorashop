import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { CouponCard } from "@/components/site/CouponCard";
import { EmptyState } from "@/components/site/EmptyState";
import { SiteLayout } from "@/components/site/SiteLayout";
import { couponsQuery } from "@/lib/promovip";

export const Route = createFileRoute("/cupons")({
  loader: ({ context }) => context.queryClient.ensureQueryData(couponsQuery),
  head: () => ({ meta: [
    { title: "Cupons — PromoraShop" },
    { name: "description", content: "Consulte cupons cadastrados e confirme condições e validade na loja parceira." },
    { property: "og:title", content: "Cupons — PromoraShop" },
    { property: "og:description", content: "Cupons e condições informadas com transparência." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ]}), component: CouponsPage,
});
function CouponsPage() { const { data } = useSuspenseQuery(couponsQuery); return <SiteLayout><div className="mx-auto max-w-6xl px-4 py-10"><h1 className="font-display text-3xl font-bold md:text-5xl">Cupons</h1><p className="mt-3 max-w-2xl text-muted-foreground">Confira as condições na loja antes de finalizar sua compra.</p><div className="mt-8">{data.length ? <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{data.map((coupon) => <CouponCard key={coupon.id} coupon={coupon} />)}</div> : <EmptyState title="Nenhum cupom disponível" description="Quando a administradora cadastrar um cupom ativo, ele aparecerá aqui com validade e condições." />}</div></div></SiteLayout>; }