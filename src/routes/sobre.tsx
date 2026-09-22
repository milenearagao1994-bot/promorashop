import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { ExternalLink, Facebook, Heart, MessageCircle, ShieldCheck, Store } from "lucide-react";

import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { contactConfig, siteSettingsQuery } from "@/lib/promovip";

export const Route = createFileRoute("/sobre")({
  head: () => ({
    meta: [
      { title: "Sobre e contato — PromoraShop" },
      { name: "description", content: "Entenda como a PromoraShop seleciona descobertas, usa links de afiliados e fale com a gente pelo WhatsApp ou Facebook." },
      { property: "og:title", content: "Sobre e contato — PromoraShop" },
      { property: "og:description", content: "Como funcionam as descobertas, avaliações editoriais e links de afiliados da PromoraShop." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  const { data: settings } = useQuery(siteSettingsQuery);
  const contact = contactConfig(settings);
  const items = [
    { Icon: Heart, title: "Curadoria humana", text: "As avaliações são conteúdo editorial da PromoraShop e nunca são apresentadas como opinião de compradores." },
    { Icon: Store, title: "Compra fora do site", text: "Preços e disponibilidade podem mudar. Confirme tudo na loja antes de comprar." },
    { Icon: ShieldCheck, title: "Links de afiliados", text: "Alguns links podem gerar comissão sem custo adicional, conforme as regras de cada parceiro." },
  ];
  return (
    <SiteLayout>
      <div className="mx-auto max-w-4xl px-4 py-12">
        <p className="text-sm font-semibold text-primary">SOBRE A PROMORASHOP</p>
        <h1 className="mt-3 font-display text-4xl font-bold md:text-6xl">Descobertas compartilhadas com transparência.</h1>
        <p className="mt-6 text-lg leading-8 text-muted-foreground">
          A PromoraShop não vende produtos nem processa pagamentos. Reunimos produtos, informações e avaliações editoriais para ajudar você a
          escolher; a compra acontece na loja parceira.
        </p>
        <div className="mt-12 grid gap-8 md:grid-cols-3">
          {items.map(({ Icon, title, text }) => (
            <div key={title}>
              <Icon className="size-6 text-primary" />
              <h2 className="mt-4 font-display text-lg font-semibold">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p>
            </div>
          ))}
        </div>

        <section className="mt-16 overflow-hidden rounded-2xl border border-primary/15 bg-soft-gradient p-6 md:p-10">
          <p className="text-xs font-semibold text-primary">FALE COM A GENTE</p>
          <h2 className="mt-2 font-display text-3xl font-bold">Vamos conversar 💜</h2>
          <p className="mt-3 max-w-xl text-muted-foreground">
            Dúvidas sobre um achadinho, parcerias ou sugestões? Estamos por aqui.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-border bg-card/90 p-5 shadow-soft backdrop-blur">
              <MessageCircle className="size-6 text-primary" />
              <h3 className="mt-4 font-display text-lg font-semibold">WhatsApp</h3>
              <p className="mt-1 text-sm text-muted-foreground">{contact.whatsapp_label}</p>
              <Button asChild className="mt-5 w-full">
                <a href={contact.whatsapp} target="_blank" rel="noopener noreferrer">
                  Conversar pelo WhatsApp
                </a>
              </Button>
            </div>
            <div className="rounded-xl border border-border bg-card/90 p-5 shadow-soft backdrop-blur">
              <Facebook className="size-6 text-primary" />
              <h3 className="mt-4 font-display text-lg font-semibold">Facebook</h3>
              <p className="mt-1 text-sm text-muted-foreground">Página oficial da PromoraShop</p>
              <Button asChild variant="outline" className="mt-5 w-full">
                <a href={contact.facebook} target="_blank" rel="noopener noreferrer">
                  Visitar Facebook <ExternalLink />
                </a>
              </Button>
            </div>
          </div>
        </section>
      </div>
    </SiteLayout>
  );
}
