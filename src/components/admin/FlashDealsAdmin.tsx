import { useQuery } from "@tanstack/react-query";
import { Minus, Pause, Play, Plus, Square, Trash2, Zap } from "lucide-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";

import { MediaUploadField } from "@/components/admin/MediaUploadField";
import { FlashDealCard } from "@/components/site/FlashDeals";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { adminFlashDealsQuery, autoDiscount, formatPrice, type FlashDeal, type Product } from "@/lib/promovip";

const STATUS = { active: "Ativa", paused: "Pausada", ended: "Encerrada" } as const;

function toLocal(iso: string) {
  const d = new Date(iso);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

export function FlashDealsAdmin({ products }: { products: Product[] }) {
  const deals = useQuery(adminFlashDealsQuery);
  const [editing, setEditing] = useState<FlashDeal | "new" | null>(null);
  const [draft, setDraft] = useState({ product_id: "", original: "", final: "", ends: "" });
  const [busy, setBusy] = useState(false);
  const list = deals.data ?? [];
  const live = list.filter((d) => d.status === "active" && new Date(d.ends_at) > new Date()).length;

  const open = (d: FlashDeal | "new") => {
    setEditing(d);
    if (d === "new") setDraft({ product_id: "", original: "", final: "", ends: toLocal(new Date(Date.now() + 86400000).toISOString()) });
    else setDraft({ product_id: d.product_id, original: String(d.original_price), final: String(d.final_price), ends: toLocal(d.ends_at) });
  };

  const run = async (fn: () => PromiseLike<{ error: { message: string } | null }>, ok: string) => {
    setBusy(true);
    const { error } = await fn();
    setBusy(false);
    if (error) { toast.error(error.message.includes("Limite") ? "Já existem 3 ofertas Relâmpagos ativas." : "Não foi possível salvar. Tente novamente."); return false; }
    toast.success(ok); await deals.refetch(); return true;
  };

  const save = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const original = Number(draft.original.replace(",", "."));
    const final = Number(draft.final.replace(",", "."));
    if (!draft.product_id) return toast.error("Selecione um produto.");
    if (!(original > 0)) return toast.error("Informe o preço original.");
    if (!(final > 0) || final >= original) return toast.error("O preço final deve ser menor que o original.");
    const ends = new Date(draft.ends);
    if (Number.isNaN(ends.getTime()) || ends <= new Date()) return toast.error("Informe um encerramento no futuro.");
    const payload = { product_id: draft.product_id, original_price: original, final_price: final, ends_at: ends.toISOString(), image_url: String(form.get("image_url") ?? "").trim() || null, sort_order: Number(form.get("sort_order") || 0) };
    const ok = await run(() => editing === "new" ? supabase.from("flash_deals").insert({ ...payload, status: "active" }) : supabase.from("flash_deals").update(payload).eq("id", (editing as FlashDeal).id), "Oferta salva.");
    if (ok) setEditing(null);
    return;
  };

  const shift = (d: FlashDeal, hours: number) => {
    const base = Math.max(new Date(d.ends_at).getTime(), Date.now());
    const next = new Date(base + hours * 3600000);
    if (next <= new Date()) return toast.error("A duração não pode terminar no passado.");
    void run(() => supabase.from("flash_deals").update({ ends_at: next.toISOString() }).eq("id", d.id), "Duração atualizada.");
    return;
  };

  const product = products.find((p) => p.id === draft.product_id);
  const preview: FlashDeal | null = product && Number(draft.original) > 0 && Number(draft.final) > 0 && draft.ends ? {
    id: "preview", product_id: product.id, image_url: null, original_price: Number(draft.original), final_price: Number(draft.final), ends_at: new Date(draft.ends).toISOString(), status: "active", sort_order: 0,
    products: { id: product.id, title: product.title, slug: product.slug, image_url: product.image_url, affiliate_url: product.affiliate_url, store_id: product.store_id },
  } : null;

  return (
    <div className="mt-4 rounded-lg border border-border bg-card">
      <div className="flex items-center justify-between gap-3 border-b border-border p-4">
        <div><h2 className="flex items-center gap-2 font-display text-lg font-semibold"><Zap className="size-5 text-primary" />Relâmpagos</h2><p className="text-xs text-muted-foreground">{live}/3 ativas na página inicial.</p></div>
        <Button size="sm" onClick={() => open("new")} disabled={live >= 3}><Plus />Nova oferta</Button>
      </div>
      {editing ? (
        <form onSubmit={save} className="grid gap-4 border-b border-border p-4 md:grid-cols-[1fr_220px]">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2"><Label htmlFor="fd-product">Produto</Label>
              <select id="fd-product" value={draft.product_id} onChange={(e) => { const p = products.find((x) => x.id === e.target.value); setDraft((d) => ({ ...d, product_id: e.target.value, original: d.original || String(p?.original_price ?? p?.price ?? "") })); }} className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                <option value="">Selecione…</option>{products.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
              </select></div>
            <div className="space-y-2"><Label htmlFor="fd-orig">Preço original (R$)</Label><Input id="fd-orig" inputMode="decimal" value={draft.original} onChange={(e) => setDraft((d) => ({ ...d, original: e.target.value }))} /></div>
            <div className="space-y-2"><Label htmlFor="fd-final">Preço final (R$)</Label><Input id="fd-final" inputMode="decimal" value={draft.final} onChange={(e) => setDraft((d) => ({ ...d, final: e.target.value }))} /></div>
            <p className="text-sm sm:col-span-2">Desconto calculado: <strong>{autoDiscount(Number(draft.final), Number(draft.original)) ?? "—"}{autoDiscount(Number(draft.final), Number(draft.original)) ? "% OFF" : ""}</strong></p>
            <div className="space-y-2"><Label htmlFor="fd-ends">Encerra em</Label><Input id="fd-ends" type="datetime-local" value={draft.ends} onChange={(e) => setDraft((d) => ({ ...d, ends: e.target.value }))} /></div>
            <div className="space-y-2"><Label htmlFor="fd-order">Ordem</Label><Input id="fd-order" name="sort_order" type="number" defaultValue={editing === "new" ? 0 : editing.sort_order} /></div>
            <div className="sm:col-span-2"><MediaUploadField label="Imagem da oferta · Opcional" name="image_url" kind="image" folder="relampagos" defaultValue={editing === "new" ? null : editing.image_url} helper="Se ficar vazio, usamos a foto principal do produto." /></div>
            <div className="flex gap-2 sm:col-span-2"><Button disabled={busy}>Salvar e publicar</Button><Button type="button" variant="outline" onClick={() => setEditing(null)}>Cancelar</Button></div>
          </div>
          <div><p className="mb-2 text-xs font-semibold text-muted-foreground">Prévia</p>{preview ? <FlashDealCard deal={preview} preview /> : <p className="text-xs text-muted-foreground">Preencha produto, preços e encerramento.</p>}</div>
        </form>
      ) : null}
      <div className="divide-y divide-border px-4">
        {list.length ? list.map((d) => {
          const expired = new Date(d.ends_at) <= new Date();
          return (
            <div key={d.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <div className="min-w-0"><p className="truncate font-medium">{d.products?.title ?? "Produto removido"}</p><p className="text-xs text-muted-foreground">{formatPrice(d.original_price)} → {formatPrice(d.final_price)} · {expired ? "Tempo esgotado" : STATUS[d.status]} · até {new Date(d.ends_at).toLocaleString("pt-BR")}</p></div>
              <div className="flex flex-wrap gap-1">
                <Button size="sm" variant="outline" onClick={() => shift(d, -1)} aria-label="Diminuir 1 hora"><Minus />1h</Button>
                <Button size="sm" variant="outline" onClick={() => shift(d, 1)} aria-label="Aumentar 1 hora"><Plus />1h</Button>
                {d.status === "active" ? <Button size="sm" variant="outline" onClick={() => run(() => supabase.from("flash_deals").update({ status: "paused" }).eq("id", d.id), "Oferta pausada.")}><Pause />Pausar</Button>
                  : <Button size="sm" variant="outline" onClick={() => run(() => supabase.from("flash_deals").update({ status: "active" }).eq("id", d.id), "Oferta ativada.")}><Play />Ativar</Button>}
                {d.status !== "ended" ? <Button size="sm" variant="outline" onClick={() => run(() => supabase.from("flash_deals").update({ status: "ended" }).eq("id", d.id), "Oferta encerrada.")}><Square />Encerrar</Button> : null}
                <Button size="sm" variant="outline" onClick={() => open(d)}>Editar</Button>
                <Button size="sm" variant="ghost" aria-label="Remover" onClick={() => { if (confirm("Remover esta oferta?")) void run(() => supabase.from("flash_deals").delete().eq("id", d.id), "Oferta removida."); }}><Trash2 /></Button>
              </div>
            </div>
          );
        }) : <p className="py-8 text-sm text-muted-foreground">Nenhuma oferta Relâmpagos cadastrada.</p>}
      </div>
    </div>
  );
}
