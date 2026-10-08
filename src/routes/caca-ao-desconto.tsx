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
    const canvas = document.createElement("canvas");
    canvas.width = 1240;
    canvas.height = 1754;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Não foi possível criar o PDF.");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#171717";
    ctx.font = "bold 42px Arial";
    ctx.fillText("PROMORASHOP — CAÇA AO DESCONTO", 70, 90);
    ctx.font = "28px Arial";
    ctx.fillText("Produto:", 70, 155);
    ctx.font = "bold 28px Arial";
    ctx.fillText(name.trim() || "Não informado", 210, 155);
    ctx.font = "28px Arial";
    ctx.fillText("Link:", 70, 205);
    ctx.font = "22px Arial";
    const linkText = link.trim() || "Não informado";
    ctx.fillText(linkText.slice(0, 75), 150, 205);

    let y = 270;
    if (preview) {
      try {
        const img = new Image();
        img.crossOrigin = "anonymous";
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = () => reject(new Error("Não foi possível carregar a foto."));
          img.src = preview;
        });
        const maxW = 1100;
        const maxH = 850;
        const scale = Math.min(maxW / img.naturalWidth, maxH / img.naturalHeight, 1);
        const w = img.naturalWidth * scale;
        const h = img.naturalHeight * scale;
        ctx.drawImage(img, (canvas.width - w) / 2, y, w, h);
        y += h + 50;
      } catch {
        // Mantém o PDF funcional mesmo se a imagem não puder ser incorporada pelo navegador.
      }
    }

    ctx.font = "bold 30px Arial";
    ctx.fillText("Solicitação:", 70, Math.min(y, 1450));
    ctx.font = "26px Arial";
    const question = config.message_question;
    const words = question.split(" ");
    let line = "";
    let lineY = Math.min(y + 48, 1500);
    for (const word of words) {
      const next = line ? line + " " + word : word;
      if (ctx.measureText(next).width > 1080) {
        ctx.fillText(line, 70, lineY);
        line = word;
        lineY += 38;
      } else line = next;
    }
    if (line) ctx.fillText(line, 70, lineY);

    const jpegBlob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("Não foi possível gerar o PDF.")), "image/jpeg", 0.9);
    });
    const jpeg = new Uint8Array(await jpegBlob.arrayBuffer());
    const encoder = new TextEncoder();
    const ascii = (s: string) => encoder.encode(s);
    const objects: Uint8Array[] = [];
    objects.push(ascii("<< /Type /Catalog /Pages 2 0 R >>"));
    objects.push(ascii("<< /Type /Pages /Kids [3 0 R] /Count 1 >>"));
    objects.push(ascii("<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /XObject << /Im1 5 0 R >> >> /Contents 4 0 R >>"));
    const content = ascii("q 595 0 0 842 0 0 cm /Im1 Do Q");
    objects.push(ascii(`<< /Length ${content.length} >>\\nstream\\n` + new TextDecoder().decode(content) + "\\nendstream"));
    objects.push(jpeg);

    const headers = [
      "<< /Type /XObject /Subtype /Image /Width 1240 /Height 1754 /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length " + jpeg.length + " >>",
    ];
    let total = 0;
    const chunks: Uint8Array[] = [ascii("%PDF-1.4\\n")];
    const offsets: number[] = [0];
    total = chunks[0].length;
    for (let i = 0; i < objects.length; i++) {
      offsets.push(total);
      const head = ascii(`${i + 1} 0 obj\\n`);
      const tail = ascii("\\nendobj\\n");
      if (i === 4) {
        const h = ascii(headers[0] + "\\nstream\\n");
        chunks.push(head, h, objects[i], ascii("\\nendstream\\n"), ascii("endobj\\n"));
        total += head.length + h.length + objects[i].length + 14;
      } else {
        chunks.push(head, objects[i], tail);
        total += head.length + objects[i].length + tail.length;
      }
    }
    const xrefOffset = total;
    let xref = `xref\\n0 ${objects.length + 1}\\n0000000000 65535 f \\n`;
    for (let i = 1; i < offsets.length; i++) xref += `${String(offsets[i]).padStart(10, "0")} 00000 n \\n`;
    xref += `trailer\\n<< /Size ${objects.length + 1} /Root 1 0 R >>\\nstartxref\\n${xrefOffset}\\n%%EOF`;
    chunks.push(ascii(xref));
    return new Blob(chunks as BlobPart[], { type: "application/pdf" });
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
