import { useQuery } from "@tanstack/react-query";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { MediaListField } from "@/components/admin/MediaListField";
import { MediaUploadField } from "@/components/admin/MediaUploadField";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import {
  AFFILIATE_CONTENT_KEYS, adminAffiliateOpportunitiesQuery, adminSiteSettingsQuery, affiliateContent, galleryToArray,
  type AffiliateOpportunity, type Category, type Store,
} from "@/lib/promovip";

const t = (f: FormData, k: string) => { const v = String(f.get(k) ?? "").trim(); return v || null; };
const validLink = (v: string) => { try { const u = new URL(v); return u.protocol === "https:" || u.protocol === "http:"; } catch { return false; } };
const toLocal = (iso: string | null) => (iso ? new Date(iso).toISOString().slice(0, 10) : "");

export function AffiliatesAdmin({ stores, categories }: { stores: Store[]; categories: Category[] }) {
  const list = useQuery(adminAffiliateOpportunitiesQuery);
  const settings = useQuery(adminSiteSettingsQuery);
  const events = useQuery({ queryKey: ["admin", "affiliate-events"], queryFn: async () => { const { data, error } = await supabase.from("affiliate_events").select("event_type,opportunity_id,store_id,category_id,created_at"); if (error) throw error; return data; } });
  const [editing, setEditing] = useState<AffiliateOpportunity | "new" | null>(null);
  const [saving, setSaving] = useState(false);
  const [days, setDays] = useState(30);
  const items = list.data ?? [];

  const stats = useMemo(() => {
    const since = Date.now() - days * 864e5;
    const ev = (events.data ?? []).filter((e) => new Date(e.created_at).getTime() >= since);
    const clicks = ev.filter((e) => e.event_type === "link_click");
    const count = (key: "opportunity_id" | "store_id" | "category_id") => { const m = new Map<string, number>(); for (const c of clicks) { const k = c[key]; if (k) m.set(k, (m.get(k) ?? 0) + 1); } return [...m.entries()].sort((a, b) => b[1] - a[1]); };
    return { views: ev.filter((e) => e.event_type === "page_view").length, clicks: clicks.length, byOpp: count("opportunity_id"), byStore: count("store_id"), byCat: count("category_id") };
  }, [events.data, days]);
  const name = (arr: { id: string; name?: string; title?: string }[], id: string) => { const x = arr.find((a) => a.id === id); return x?.title ?? x?.name ?? "—"; };

  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const title = t(f, "title"), link = t(f, "link_url"), store = t(f, "store_id");
    if (!title) { toast.error("Informe o nome do produto."); return; }
    if (!store) { toast.error("Selecione a loja."); return; }
    if (!link || !validLink(link)) { toast.error("Informe um link válido."); return; }
    const row = {
      title, link_url: link, store_id: store, category_id: t(f, "category_id"),
      image_url: t(f, "image_url"), gallery: String(f.get("gallery") ?? "").split("\n").map((s) => s.trim()).filter(Boolean),
      video_url: t(f, "video_url"), commission_info: t(f, "commission_info"), commission_highlight: f.get("commission_highlight") === "on",
      description: t(f, "description"), affiliate_notes: t(f, "affiliate_notes"), caption: t(f, "caption"), benefits: t(f, "benefits"),
      promo_image_url: t(f, "promo_image_url"),
      starts_at: t(f, "starts_at") ? new Date(String(f.get("starts_at"))).toISOString() : null,
      ends_at: t(f, "ends_at") ? new Date(String(f.get("ends_at")) + "T23:59:59").toISOString() : null,
      featured: f.get("featured") === "on", active: f.get("active") === "on", sort_order: Number(f.get("sort_order") || 0),
    };
    setSaving(true);
    const q = editing && editing !== "new" ? supabase.from("affiliate_opportunities").update(row).eq("id", editing.id) : supabase.from("affiliate_opportunities").insert(row);
    const { error } = await q; setSaving(false);
    if (error) { toast.error("Não foi possível salvar a oportunidade."); return; }
    toast.success("Oportunidade salva."); setEditing(null); await list.refetch();
  }
  async function patch(id: string, v: { active?: boolean; featured?: boolean }) { const { error } = await supabase.from("affiliate_opportunities").update(v).eq("id", id); if (error) toast.error("Não foi possível atualizar."); await list.refetch(); }
  async function del(id: string) { if (!confirm("Excluir esta oportunidade?")) return; const { error } = await supabase.from("affiliate_opportunities").delete().eq("id", id); if (error) toast.error("Não foi possível excluir."); await list.refetch(); }
  async function saveContent(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); const f = new FormData(e.currentTarget);
    const value = Object.fromEntries(AFFILIATE_CONTENT_KEYS.map(([k]) => [k, String(f.get(k) ?? "").trim()]));
    const { error } = await supabase.from("site_settings").upsert({ key: "affiliates", value, public: true });
    if (error) { toast.error("Não foi possível salvar."); return; }
    toast.success("Conteúdo atualizado."); await settings.refetch();
  }
  const cur = editing && editing !== "new" ? editing : null;
  const content = affiliateContent(settings.data);

  return (
    <div className="mt-4 space-y-6">
      <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card p-4">
        <div><h2 className="font-display text-lg font-semibold">💜 Exclusivo para Afiliados</h2><p className="text-xs text-muted-foreground">Separado do catálogo público dos consumidores.</p></div>
        <Button size="sm" onClick={() => setEditing("new")}><Plus />Nova oportunidade</Button>
      </div>
      <div className="space-y-2">
        {items.length ? items.map((o) => (
          <div key={o.id} className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-card p-3">
            {o.image_url ? <img src={o.image_url} alt="" className="size-12 rounded-md object-cover" /> : null}
            <div className="min-w-0 flex-1"><p className="truncate font-semibold">{o.featured ? "🔥 " : ""}{o.title}</p><p className="text-xs text-muted-foreground">{o.stores?.name} · ordem {o.sort_order} · {o.active ? "Ativa" : "Inativa"}</p></div>
            <Switch checked={o.active} onCheckedChange={(v) => patch(o.id, { active: v })} aria-label="Ativa" />
            <Button size="sm" variant="outline" onClick={() => patch(o.id, { featured: !o.featured })}>{o.featured ? "Tirar destaque" : "🔥 Destacar"}</Button>
            <Button size="icon-sm" variant="ghost" aria-label="Editar" onClick={() => setEditing(o)}><Pencil /></Button>
            <Button size="icon-sm" variant="ghost" aria-label="Excluir" onClick={() => del(o.id)}><Trash2 /></Button>
          </div>
        )) : <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">Nenhuma oportunidade cadastrada.</p>}
      </div>

      <section className="rounded-lg border border-border bg-card p-4">
        <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-display font-semibold">📊 Analytics da área de afiliados</h3>
          <select value={days} onChange={(e) => setDays(Number(e.target.value))} className="rounded-md border border-input bg-background px-2 py-1 text-sm"><option value={1}>Hoje</option><option value={7}>7 dias</option><option value={30}>30 dias</option><option value={3650}>Todo o período</option></select></div>
        <p className="mt-1 text-xs text-muted-foreground">Cliques mostram quantas vezes os links foram abertos. Clique não significa venda nem comissão confirmada.</p>
        <div className="mt-4 grid grid-cols-2 gap-3"><Card><CardContent className="p-4"><p className="text-2xl font-bold">{stats.views}</p><p className="text-xs text-muted-foreground">Visualizações da área</p></CardContent></Card><Card><CardContent className="p-4"><p className="text-2xl font-bold">{stats.clicks}</p><p className="text-xs text-muted-foreground">Cliques nos links</p></CardContent></Card></div>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {([["🔥 Produtos mais acessados", stats.byOpp, items], ["Por loja", stats.byStore, stores], ["Por categoria", stats.byCat, categories]] as const).map(([label, rows, src]) => (
            <div key={label}><p className="text-sm font-semibold">{label}</p><ul className="mt-2 space-y-1 text-sm">{rows.length ? rows.slice(0, 10).map(([id, n]) => <li key={id} className="flex justify-between gap-2"><span className="truncate">{name(src as { id: string }[], id)}</span><span className="font-semibold">{n}</span></li>) : <li className="text-muted-foreground">Sem cliques no período.</li>}</ul></div>
          ))}
        </div>
      </section>

      <form key={settings.dataUpdatedAt} onSubmit={saveContent} className="space-y-3 rounded-lg border border-border bg-card p-4">
        <h3 className="font-display font-semibold">Conteúdo extra (opcional)</h3>
        <p className="text-xs text-muted-foreground">Blocos vazios não aparecem na página.</p>
        <div className="grid gap-3 md:grid-cols-2">{AFFILIATE_CONTENT_KEYS.map(([k, label]) => <div key={k}><Label htmlFor={`aff-${k}`}>{label}</Label><Textarea id={`aff-${k}`} name={k} defaultValue={content[k] ?? ""} rows={3} /></div>)}</div>
        <Button type="submit">Salvar conteúdo</Button>
      </form>

      <Dialog open={editing !== null} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader><DialogTitle>{cur ? "Editar oportunidade" : "Nova oportunidade"}</DialogTitle></DialogHeader>
          <form onSubmit={save} className="space-y-4" key={cur?.id ?? "new"}>
            <div><Label htmlFor="a-title">Nome do produto · Obrigatório</Label><Input id="a-title" name="title" defaultValue={cur?.title ?? ""} required /></div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div><Label htmlFor="a-store">Loja · Obrigatório</Label><select id="a-store" name="store_id" defaultValue={cur?.store_id ?? ""} required className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"><option value="">Selecione</option>{stores.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
              <div><Label htmlFor="a-cat">Categoria · Opcional</Label><select id="a-cat" name="category_id" defaultValue={cur?.category_id ?? ""} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"><option value="">Sem categoria</option>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
            </div>
            <div><Label htmlFor="a-link">Link do produto · Obrigatório</Label><Input id="a-link" name="link_url" type="url" defaultValue={cur?.link_url ?? ""} required /></div>
            <MediaUploadField label="Imagem principal · Opcional" name="image_url" kind="image" folder="afiliados" defaultValue={cur?.image_url ?? null} />
            <MediaListField label="Imagens adicionais · Opcional" name="gallery" folder="afiliados" defaultValue={galleryToArray(cur?.gallery)} />
            <MediaUploadField label="Vídeo · Opcional" name="video_url" kind="video" folder="afiliados" defaultValue={cur?.video_url ?? null} />
            <div><Label htmlFor="a-com">Informação de comissão · Opcional</Label><Input id="a-com" name="commission_info" placeholder="Ex.: Comissão diferenciada" defaultValue={cur?.commission_info ?? ""} /></div>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="commission_highlight" defaultChecked={cur?.commission_highlight} />Destacar a comissão</label>
            <div><Label htmlFor="a-desc">Descrição · Opcional</Label><Textarea id="a-desc" name="description" defaultValue={cur?.description ?? ""} /></div>
            <div><Label htmlFor="a-notes">Observações para o afiliado · Opcional</Label><Textarea id="a-notes" name="affiliate_notes" defaultValue={cur?.affiliate_notes ?? ""} /></div>
            <div><Label htmlFor="a-cap">Legenda sugerida · Opcional</Label><Textarea id="a-cap" name="caption" defaultValue={cur?.caption ?? ""} /></div>
            <div><Label htmlFor="a-ben">Benefícios · Opcional</Label><Textarea id="a-ben" name="benefits" defaultValue={cur?.benefits ?? ""} /></div>
            <MediaUploadField label="Imagem pronta para divulgação · Opcional" name="promo_image_url" kind="image" folder="afiliados" defaultValue={cur?.promo_image_url ?? null} />
            <div className="grid gap-4 sm:grid-cols-3">
              <div><Label htmlFor="a-s">Início · Opcional</Label><Input id="a-s" name="starts_at" type="date" defaultValue={toLocal(cur?.starts_at ?? null)} /></div>
              <div><Label htmlFor="a-e">Término · Opcional</Label><Input id="a-e" name="ends_at" type="date" defaultValue={toLocal(cur?.ends_at ?? null)} /></div>
              <div><Label htmlFor="a-o">Ordem</Label><Input id="a-o" name="sort_order" type="number" defaultValue={cur?.sort_order ?? 0} /></div>
            </div>
            <div className="flex gap-6 text-sm"><label className="flex items-center gap-2"><input type="checkbox" name="featured" defaultChecked={cur?.featured} />🔥 Destaque</label><label className="flex items-center gap-2"><input type="checkbox" name="active" defaultChecked={cur ? cur.active : true} />Ativa</label></div>
            <Button type="submit" disabled={saving} className="w-full">{saving ? "Salvando..." : "Salvar"}</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
