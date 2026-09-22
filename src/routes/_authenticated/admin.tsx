import { createFileRoute } from "@tanstack/react-router";

import { AdminPanel } from "@/components/admin/AdminPanel";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Painel administrativo — PromoraShop" },
      { name: "description", content: "Gestão protegida do catálogo e das métricas da PromoraShop." },
      { property: "og:title", content: "Painel administrativo — PromoraShop" },
      { property: "og:description", content: "Gestão protegida do catálogo e das métricas da PromoraShop." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminPanel,
});