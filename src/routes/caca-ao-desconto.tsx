"use client";

import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { MessageCircle, Search } from "lucide-react";
import { useEffect, useState } from "react";

import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DISCOUNT_HUNT_DESCRIPTION, discountHuntConfig, siteSettingsQuery } from "@/lib/promovip";

type Search = { produto?: string | undefined; link?: string | undefined };

export const Route = createFileRoute("/caca-ao-desconto")({
  validateSearch: (search: Record<string, unknown>): Search => ({
    produto: typeof search["produto"] === "string" ? search["produto"] : undefined,
    link: typeof search["link"] === "string" ? search["link"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Caça ao Desconto — PromoraShop" },
      { name: "description", content: DISCOUNT_HUNT_DESCRIPTION },
      { property: "og:title", content: "Caça ao Desconto — PromoraShop" },
      { property: "og:description", content: DISCOUNT_HUNT_DESCRIPTION },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DiscountHuntPage,
});

function whatsappLink(base: string, text: string) {
  const digits = base.replace(/\D/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

function DiscountHuntPage() {
  const search = Route.useSearch();
  const { data: settings } = useQuery(siteSettingsQuery);
  const config = discountHuntConfig(settings);
  const [name, setName] = useState(search.produto ?? "");
  const [link, setLink] = useState(search.link ?? "");

  useEffect(() => {
    setName(search.produto ?? "");
    setLink(search.link ?? "");
  }, [search.produto, search.link]);
  const lines = [
    `🔎 ${config.name.toUpperCase()} — PromoraShop`,
    "",
    config.message_intro,
    "",
    ...(name.trim() ? ["🛍️ Produto:", name.trim(), ""] : []),
    ...(link.trim() ? ["🔗 Link:", link.trim(), ""] : []),
    config.message_question,
  ];
  const message = lines.join("\n");
  const ready = Boolean(name.trim() || link.trim());

  return (
    <SiteLayout>
      <div className="mx-auto max-w-5xl px-4 py-10 md:py-14">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-card px-3 py-1.5 text-xs font-semibold text-primary">
          <Search className="size-3.5" /> {config.name.toUpperCase()}
        </div>
        <h1 className="mt-5 font-display text-3xl font-bold md:text-5xl">{config.title}</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">{DISCOUNT_HUNT_DESCRIPTION}</p>

        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          <section className="space-y-5 rounded-2xl border border-border bg-card p-5 shadow-soft md:p-6">
            <h2 className="font-display text-lg font-semibold">Adicione o que você tem</h2>
            <div className="space-y-2">
              <Label htmlFor="link">Link do produto (opcional)</Label>
              <Input id="link" value={link} onChange={(event) => setLink(event.target.value)} placeholder="Cole aqui o link que você encontrou" inputMode="url" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="produto">Nome ou observação (opcional)</Label>
              <Textarea id="produto" value={name} onChange={(event) => setName(event.target.value)} placeholder="Ex.: tênis branco número 37" />
            </div>
          </section>

          <section className="space-y-4 rounded-2xl border border-primary/20 bg-soft-gradient p-5 md:p-6">
            <h2 className="font-display text-lg font-semibold">Confira sua solicitação</h2>
            <pre className="whitespace-pre-wrap rounded-xl border border-border bg-card/90 p-4 text-sm leading-6 text-foreground">{message}</pre>
            <Button asChild size="lg" className="w-full" disabled={!ready}>
              <a
                href={ready ? whatsappLink(config.whatsapp, message) : "#"}
                target="_blank"
                rel="noopener noreferrer"
                aria-disabled={!ready}
                onClick={(event) => { if (!ready) event.preventDefault(); }}
              >
                <MessageCircle /> 💬 {config.send_label}
              </a>
            </Button>
            {!ready ? <p className="text-center text-xs text-muted-foreground">Adicione um link ou o nome do produto para enviar.</p> : null}
          </section>
        </div>
      </div>
    </SiteLayout>
  );
}
