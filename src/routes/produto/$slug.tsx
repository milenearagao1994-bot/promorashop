import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ExternalLink, Search, ShieldCheck } from "lucide-react";
import { useEffect } from "react";

import { ProductGallery } from "@/components/site/ProductGallery";
import { ProductReviews } from "@/components/site/ProductReviews";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice, galleryToArray, productQuery, youtubeEmbedUrl } from "@/lib/promovip";

export const Route = createFileRoute("/produto/$slug")({
  head: () => ({
    meta: [
      { title: "Produto — PromoraShop" },
      { name: "description", content: "Detalhes, informações e acesso à loja parceira pela PromoraShop." },
      { property: "og:title", content: "Produto — PromoraShop" },
      { property: "og:description", content: "Detalhes, informações e acesso à loja parceira pela PromoraShop." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Page,
});

function Page() {
  const { slug } = Route.useParams();
  const { data: p, isLoading } = useQuery(productQuery(slug));

  useEffect(() => {
    if (p) void supabase.from("analytics_events").insert({ event_type: "product_view", product_id: p.id, store_id: p.store_id });
  }, [p]);

  if (isLoading)
    return (
      <SiteLayout>
        <div className="mx-auto max-w-6xl px-4 py-20">Carregando…</div>
      </SiteLayout>
    );

  if (!p)
    return (
      <SiteLayout>
        <div className="mx-auto max-w-4xl px-4 py-20 text-center">
          <h1 className="font-display text-3xl font-bold">Produto não encontrado</h1>
          <Button asChild className="mt-6">
            <Link to="/produtos">Voltar</Link>
          </Button>
        </div>
      </SiteLayout>
    );

  const images = [p.image_url, ...galleryToArray(p.gallery)].filter(Boolean) as string[];
  const video = youtubeEmbedUrl(p.video_url);
  const click = async (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    await supabase.from("analytics_events").insert({ event_type: "outbound_click", product_id: p.id, store_id: p.store_id });
    window.location.assign(p.affiliate_url);
  };

  return (
    <SiteLayout>
      <div className="mx-auto max-w-6xl px-4 py-8 md:py-12">
        <Link to="/produtos" className="inline-flex items-center gap-2 text-sm text-muted-foreground">
          <ArrowLeft className="size-4" />
          Voltar aos achadinhos
        </Link>
        <div className="mt-6 grid gap-8 lg:grid-cols-[1.15fr_.85fr]">
          <ProductGallery images={images} videoEmbedUrl={video} title={p.title} />
          <div className="lg:sticky lg:top-24 lg:self-start">
            <p className="text-sm font-medium text-primary">{p.stores?.name ?? "Loja parceira"}</p>
            <h1 className="mt-2 font-display text-3xl font-bold md:text-4xl">{p.title}</h1>
            {p.short_description ? <p className="mt-4 text-muted-foreground">{p.short_description}</p> : null}
            <div className="mt-6">
              {p.price === null ? (
                <p className="text-muted-foreground">Preço disponível na loja</p>
              ) : (
                <>
                  <p className="font-display text-3xl font-bold text-primary">{formatPrice(p.price, p.currency)}</p>
                  {p.original_price ? <p className="text-sm text-muted-foreground line-through">{formatPrice(p.original_price, p.currency)}</p> : null}
                  {p.price_updated_at ? (
                    <p className="mt-1 text-xs text-muted-foreground">Preço informado em {new Date(p.price_updated_at).toLocaleDateString("pt-BR")}</p>
                  ) : null}
                </>
              )}
            </div>
            <Button asChild size="lg" className="mt-6 w-full">
              <a href={p.affiliate_url} rel="sponsored noreferrer" onClick={click}>
                Quero esse! 💜 <ExternalLink />
              </a>
            </Button>
            <Button asChild variant="ghost" size="sm" className="mt-2 w-full text-muted-foreground">
              <Link
                to="/caca-ao-desconto"
                search={{ produto: p.title, link: p.affiliate_url, ...(p.image_url ? { imagem: p.image_url } : {}) }}
              >
                <Search /> 🔎 Procurar desconto
              </Link>
            </Button>
            <div className="mt-4 flex gap-3 rounded-lg bg-secondary/60 p-4 text-sm text-muted-foreground">
              <ShieldCheck className="size-5 shrink-0 text-primary" />
              <p>A compra é concluída fora da PromoraShop. Confirme preço, disponibilidade e condições na loja.</p>
            </div>
            {p.tags.length ? (
              <div className="mt-5 flex flex-wrap gap-2">
                {p.tags.map((tag) => (
                  <Badge variant="outline" key={tag}>
                    {tag}
                  </Badge>
                ))}
              </div>
            ) : null}
          </div>
        </div>
        <ProductReviews productId={p.id} productTitle={p.title} />
        {p.description ? (
          <section className="mt-12 max-w-3xl">
            <h2 className="font-display text-2xl font-bold">Sobre este produto</h2>
            <p className="mt-4 whitespace-pre-line leading-7 text-muted-foreground">{p.description}</p>
          </section>
        ) : null}
      </div>
    </SiteLayout>
  );
}
