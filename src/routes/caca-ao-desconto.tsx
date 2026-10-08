"use client";

import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Download, FileText, ImagePlus, Link2, MessageCircle, Search, Trash2 } from "lucide-react";
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

  async function createPdfBlob() {
    const escapePdf = (value: string) => value.replace(/\\/g, "\\\\").replace(/\\(/g, "\\\\(").replace(/\\)/g, "\\\\)");
    const rawLines = [
      "PROMORASHOP — CAÇA AO DESCONTO",
      "",
      "Produto: " + (name.trim() || "Nao informado"),
      "Link: " + (link.trim() || "Nao informado"),
      "",
      "Solicitacao:",
      config.message_question,
    ];
    const lines = rawLines.map((line) => line.normalize("NFD").replace(/[\\u0300-\\u036f]/g, "")).map(escapePdf);
    const content = ["BT", "/F1 15 Tf", "50 790 Td", ...lines.flatMap((line, i) => [i ? "0 -24 Td" : "", `(${line}) Tj`]), "ET"].filter(Boolean).join("\n");
    const objects = [
      "<< /Type /Catalog /Pages 2 0 R >>",
      "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
      "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
      "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
      `<< /Length ${content.length} >>\\nstream\\n${content}\\nendstream`,
    ];
    let pdf = "%PDF-1.4\\n";
    const offsets = [0];
    for (let i = 0; i < objects.length; i++) { offsets.push(pdf.length); pdf += `${i + 1} 0 obj\\n${objects[i]}\\nendobj\\n`; }
    const xref = pdf.length;
    pdf += `xref\\n0 ${objects.length + 1}\\n0000000000 65535 f \\n`;
    for (let i = 1; i < offsets.length; i++) pdf += `${String(offsets[i]).padStart(10, "0")} 00000 n \\n`;
    pdf += `trailer\\n<< /Size ${objects.length + 1} /Root 1 0 R >>\\nstartxref\\n${xref}\\n%%EOF`;
    return new Blob([pdf], { type: "application/pdf" });
  }

  async function sendPdfToWhatsApp() {
    if (!ready) return;
    const blob = await createPdfBlob();
    const file = new File([blob], "caca-ao-desconto-promorashop.pdf", { type: "application/pdf" });
    const textMessage = message + "\\n\\n📎 PDF da solicitação: caca-ao-desconto-promorashop.pdf";
    if (navigator.share && (!navigator.canShare || navigator.canShare({ files: [file] }))) {
      try {
        await navigator.share({ title: "Caça ao Desconto — PromoraShop", text: textMessage, files: [file] });
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = file.name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    window.open(whatsappLink(config.whatsapp, textMessage), "_blank", "noopener,noreferrer");
  }

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
                <Link2 className="mr-1 inline size-3" /> O PDF reúne nome, link e a solicitação. Em celular compatível, o botão acima abre o compartilhamento já com o PDF pronto para selecionar o WhatsApp.
              </p>
            ) : null}
            <Button type="button" size="lg" className="w-full" disabled={!ready} onClick={sendPdfToWhatsApp}>
              <FileText /> 💬 Enviar PDF pelo WhatsApp
            </Button>
            {ready ? (
              <Button type="button" variant="outline" className="w-full" onClick={async () => {
                const blob = await createPdfBlob();
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = "caca-ao-desconto-promorashop.pdf";
                a.click();
                setTimeout(() => URL.revokeObjectURL(url), 1000);
              }}>
                <Download /> Baixar PDF
              </Button>
            ) : null}
            {!ready ? <p className="text-center text-xs text-muted-foreground">Adicione uma foto, um link ou o nome do produto para enviar.</p> : null}
          </section>
        </div>
      </div>
    </SiteLayout>
  );
}
