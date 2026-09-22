"use client";

import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { ImagePlus, Link2, MessageCircle, Search, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { discountHuntConfig, siteSettingsQuery } from "@/lib/promovip";

type Search = { produto?: string | undefined; link?: string | undefined; imagem?: string | undefined };

export const Route = createFileRoute("/caca-ao-desconto")({
  validateSearch: (search: Record<string, unknown>): Search => ({
    produto: typeof search["produto"] === "string" ? search["produto"] : undefined,
    link: typeof search["link"] === "string" ? search["link"] : undefined,
    imagem: typeof search["imagem"] === "string" ? search["imagem"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Caça ao Desconto — PromoraShop" },
      { name: "description", content: "Envie a foto ou o link de um produto e pergunte se existe oferta, desconto ou cupom para ele." },
      { property: "og:title", content: "Caça ao Desconto — PromoraShop" },
      { property: "og:description", content: "Mande uma foto ou o link do produto e a equipe da PromoraShop procura uma oferta para você." },
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
  const [imageUrl, setImageUrl] = useState(search.imagem ?? "");
  const [localImage, setLocalImage] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setName(search.produto ?? "");
    setLink(search.link ?? "");
    setImageUrl(search.imagem ?? "");
  }, [search.produto, search.link, search.imagem]);

  useEffect(() => () => { if (localImage) URL.revokeObjectURL(localImage); }, [localImage]);

  const preview = localImage ?? (imageUrl || null);
  const lines = [
    `🔎 ${config.name.toUpperCase()} — PromoraShop`,
    "",
    config.message_intro,
    "",
    ...(name.trim() ? ["🛍️ Produto:", name.trim(), ""] : []),
    ...(link.trim() ? ["🔗 Link:", link.trim(), ""] : []),
    ...(localImage ? ["📷 Imagem: vou anexar aqui na conversa.", ""] : imageUrl ? ["📷 Imagem:", imageUrl, ""] : []),
    config.message_question,
  ];
  const message = lines.join("\n");
  const ready = Boolean(name.trim() || link.trim() || preview);

  return (
    <SiteLayout>
      <div className="mx-auto max-w-5xl px-4 py-10 md:py-14">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-card px-3 py-1.5 text-xs font-semibold text-primary">
          <Search className="size-3.5" /> {config.name.toUpperCase()}
        </div>
        <h1 className="mt-5 font-display text-3xl font-bold md:text-5xl">{config.title}</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">{config.description}</p>

        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          <section className="space-y-5 rounded-2xl border border-border bg-card p-5 shadow-soft md:p-6">
            <h2 className="font-display text-lg font-semibold">Adicione o que você tem</h2>
            <div className="space-y-2">
              <Label htmlFor="foto">Foto do produto (opcional)</Label>
              <input
                id="foto"
                ref={fileRef}
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (!file) return;
                  if (localImage) URL.revokeObjectURL(localImage);
                  setLocalImage(URL.createObjectURL(file));
                }}
              />
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" onClick={() => fileRef.current?.click()}>
                  <ImagePlus /> {localImage ? "Trocar foto" : "Adicionar foto"}
                </Button>
                {localImage ? (
                  <Button type="button" variant="ghost" onClick={() => { URL.revokeObjectURL(localImage); setLocalImage(null); if (fileRef.current) fileRef.current.value = ""; }}>
                    <Trash2 /> Remover
                  </Button>
                ) : null}
              </div>
            </div>
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
            {preview ? (
              <img src={preview} alt="Produto enviado para a Caça ao Desconto" className="max-h-64 w-full rounded-xl bg-card object-contain" />
            ) : null}
            <pre className="whitespace-pre-wrap rounded-xl border border-border bg-card/90 p-4 text-sm leading-6 text-foreground">{message}</pre>
            {localImage ? (
              <p className="rounded-lg bg-card/80 p-3 text-xs leading-5 text-muted-foreground">
                <Link2 className="mr-1 inline size-3" /> A foto fica aqui na tela: o WhatsApp não permite anexá-la automaticamente pelo link, então
                anexe-a na conversa depois de abrir o WhatsApp.
              </p>
            ) : null}
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
            {!ready ? <p className="text-center text-xs text-muted-foreground">Adicione uma foto, um link ou o nome do produto para enviar.</p> : null}
          </section>
        </div>
      </div>
    </SiteLayout>
  );
}
