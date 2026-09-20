import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { BarChart3, Eye, EyeOff, LogOut, Package, Pencil, Plus, Star, Store as StoreIcon, Tag, Ticket, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Logo } from "@/components/site/Logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import {
  adminCategoriesQuery,
  adminCouponsQuery,
  adminProductsQuery,
  adminReviewsQuery,
  adminStoresQuery,
  slugify,
  type Category,
  type Coupon,
  type EditorialReview,
  type Product,
  type Store,
} from "@/lib/promovip";

type Editor = { kind: "product"; value?: Product } | { kind: "coupon"; value?: Coupon } | { kind: "category"; value?: Category } | { kind: "store"; value?: Store } | { kind: "review"; value?: EditorialReview };
type TableName = "products" | "coupons" | "categories" | "stores" | "editorial_reviews";
const NONE = "__none__";

function validUrl(value: string, required = false) {
  if (!value) return !required;
  try { const url = new URL(value); return url.protocol === "https:" || url.protocol === "http:"; } catch { return false; }
}
function nullable(value: FormDataEntryValue | null) { const text = String(value ?? "").trim(); return text || null; }
function numberOrNull(value: FormDataEntryValue | null) { const text = String(value ?? "").trim().replace(",", "."); return text ? Number(text) : null; }

export function AdminPanel() {
  const navigate = useNavigate();
  const products = useQuery(adminProductsQuery);
  const coupons = useQuery(adminCouponsQuery);
  const categories = useQuery(adminCategoriesQuery);
  const stores = useQuery(adminStoresQuery);
  const reviews = useQuery(adminReviewsQuery);
  const analytics = useQuery({ queryKey: ["admin", "analytics"], queryFn: async () => { const { data, error } = await supabase.from("analytics_events").select("event_type,product_id,store_id,occurred_at"); if (error) throw error; return data; } });
  const [editor, setEditor] = useState<Editor | null>(null);
  const [saving, setSaving] = useState(false);
  const refresh = async () => Promise.all([products.refetch(), coupons.refetch(), categories.refetch(), stores.refetch(), reviews.refetch(), analytics.refetch()]);
  const active = products.data?.filter((p) => p.active).length ?? 0;
  const hidden = (products.data?.length ?? 0) - active;
  const views = analytics.data?.filter((e) => e.event_type === "product_view").length ?? 0;
  const clicks = analytics.data?.filter((e) => e.event_type === "outbound_click").length ?? 0;
  const expiring = useMemo(() => coupons.data?.filter((coupon) => coupon.active && coupon.expires_at && Date.parse(coupon.expires_at) > Date.now() && Date.parse(coupon.expires_at) < Date.now() + 7 * 86400000).length ?? 0, [coupons.data]);

  async function toggle(table: Exclude<TableName, "editorial_reviews"> | "editorial_reviews", id: string, value: boolean) {
    const { error } = await supabase.from(table).update({ active: value }).eq("id", id);
    if (error) return toast.error("Não foi possível atualizar o status.");
    toast.success("Status atualizado."); await refresh();
  }
  async function remove(table: TableName, id: string) {
    if (!window.confirm("Excluir este item permanentemente?")) return;
    const { error } = await supabase.from(table).delete().eq("id", id);
    if (error) return toast.error("Não foi possível excluir. Verifique se o item está em uso.");
    toast.success("Item excluído."); await refresh();
  }
  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!editor) return;
    setSaving(true);
    const form = new FormData(event.currentTarget);
    let table: TableName; let payload: Record<string, unknown>;
    try {
      if (editor.kind === "product") {
        const affiliateUrl = String(form.get("affiliate_url") ?? "").trim();
        const imageUrl = String(form.get("image_url") ?? "").trim();
        const videoUrl = String(form.get("video_url") ?? "").trim();
        const gallery = String(form.get("gallery") ?? "").split("\n").map((item) => item.trim()).filter(Boolean);
        if (!validUrl(affiliateUrl, true) || !validUrl(imageUrl) || !validUrl(videoUrl) || gallery.some((url) => !validUrl(url))) throw new Error("Confira os endereços informados.");
        const specificationsText = String(form.get("specifications") ?? "").trim();
        const specifications = specificationsText ? JSON.parse(specificationsText) : {};
        if (!specifications || Array.isArray(specifications) || typeof specifications !== "object") throw new Error("As características devem usar o formato de objeto JSON.");
        table = "products"; payload = { title: String(form.get("title") ?? "").trim(), slug: slugify(String(form.get("slug") || form.get("title") || "")), short_description: nullable(form.get("short_description")), description: nullable(form.get("description")), price: numberOrNull(form.get("price")), original_price: numberOrNull(form.get("original_price")), currency: String(form.get("currency") || "BRL"), price_updated_at: nullable(form.get("price_updated_at")), affiliate_url: affiliateUrl, image_url: imageUrl || null, gallery, video_url: videoUrl || null, store_id: form.get("store_id") === NONE ? null : form.get("store_id"), category_id: form.get("category_id") === NONE ? null : form.get("category_id"), tags: String(form.get("tags") ?? "").split(",").map((item) => item.trim()).filter(Boolean), specifications, coupon_code: nullable(form.get("coupon_code")), sort_order: Number(form.get("sort_order") || 0), featured: form.get("featured") === "on", active: form.get("active") === "on" };
      } else if (editor.kind === "coupon") {
        const affiliateUrl = String(form.get("affiliate_url") ?? "").trim(); if (!validUrl(affiliateUrl, true)) throw new Error("Informe um link válido para o cupom.");
        table = "coupons"; payload = { title: String(form.get("title") ?? "").trim(), code: nullable(form.get("code")), description: nullable(form.get("description")), discount_label: nullable(form.get("discount_label")), conditions: nullable(form.get("conditions")), affiliate_url: affiliateUrl, store_id: form.get("store_id") === NONE ? null : form.get("store_id"), expires_at: nullable(form.get("expires_at")), featured: form.get("featured") === "on", active: form.get("active") === "on" };
      } else if (editor.kind === "category") {
        table = "categories"; payload = { name: String(form.get("name") ?? "").trim(), slug: slugify(String(form.get("slug") || form.get("name") || "")), icon: nullable(form.get("icon")), sort_order: Number(form.get("sort_order") || 0), active: form.get("active") === "on" };
      } else if (editor.kind === "store") {
        const website = String(form.get("website_url") ?? "").trim(); const affiliate = String(form.get("affiliate_base_url") ?? "").trim(); const logo = String(form.get("logo_url") ?? "").trim();
        if (!validUrl(website) || !validUrl(affiliate) || !validUrl(logo)) throw new Error("Confira os endereços informados.");
        table = "stores"; payload = { name: String(form.get("name") ?? "").trim(), slug: slugify(String(form.get("slug") || form.get("name") || "")), website_url: website || null, affiliate_base_url: affiliate || null, logo_url: logo || null, admin_notes: nullable(form.get("admin_notes")), active: form.get("active") === "on" };
      } else {
        table = "editorial_reviews"; const rating = numberOrNull(form.get("rating")); if (rating !== null && (rating < 0 || rating > 5)) throw new Error("A nota deve ficar entre 0 e 5.");
        payload = { product_id: form.get("product_id"), title: String(form.get("title") ?? "").trim(), body: String(form.get("body") ?? "").trim(), rating, published_at: String(form.get("published_at") ?? new Date().toISOString()), active: form.get("active") === "on" };
      }
      const current = editor.value;
      const result = current ? await supabase.from(table).update(payload).eq("id", current.id) : await supabase.from(table).insert(payload as never);
      if (result.error) throw result.error;
      toast.success(current ? "Alterações salvas." : "Item criado."); setEditor(null); await refresh();
    } catch (error) { toast.error(error instanceof Error ? error.message : "Não foi possível salvar."); } finally { setSaving(false); }
  }

  const stats = [{ Icon: Package, label: "Produtos ativos", value: active }, { Icon: EyeOff, label: "Produtos ocultos", value: hidden }, { Icon: Eye, label: "Visualizações", value: views }, { Icon: BarChart3, label: "Cliques externos", value: clicks }];
  return <main className="min-h-screen bg-muted/40"><header className="border-b border-border bg-card"><div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4"><Logo/><div className="flex items-center gap-3"><span className="hidden text-sm text-muted-foreground sm:inline">Painel da proprietária</span><Button variant="outline" size="sm" onClick={async()=>{await supabase.auth.signOut();await navigate({to:"/auth"})}}><LogOut/>Sair</Button></div></div></header><div className="mx-auto max-w-7xl px-4 py-8"><h1 className="font-display text-3xl font-bold">Visão geral</h1><p className="mt-2 text-sm text-muted-foreground">Dados reais da PromoVip. Visualizações e cliques não representam compras.</p>{expiring ? <p className="mt-4 rounded-lg border border-border bg-card px-4 py-3 text-sm"><Ticket className="mr-2 inline size-4 text-primary"/>{expiring} cupom(ns) expira(m) nos próximos 7 dias.</p> : null}<div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">{stats.map(({Icon,label,value})=><Card key={label}><CardContent className="p-5"><Icon className="size-5 text-primary"/><p className="mt-5 text-2xl font-bold">{value}</p><p className="text-xs text-muted-foreground">{label}</p></CardContent></Card>)}</div><Tabs defaultValue="products" className="mt-8"><TabsList className="h-auto w-full justify-start overflow-x-auto"><TabsTrigger value="products">Produtos</TabsTrigger><TabsTrigger value="coupons">Cupons</TabsTrigger><TabsTrigger value="reviews">Avaliações</TabsTrigger><TabsTrigger value="categories">Categorias</TabsTrigger><TabsTrigger value="stores">Lojas</TabsTrigger></TabsList>
  <AdminList tab="products" title="Produtos" add="Novo produto" onAdd={()=>setEditor({kind:"product"})}>{products.data?.map((p)=><Row key={p.id} title={p.title} subtitle={`${p.stores?.name ?? "Sem loja"} · ${p.active ? "Ativo" : "Oculto"}`} onEdit={()=>setEditor({kind:"product",value:p})} onToggle={()=>toggle("products",p.id,!p.active)} onDelete={()=>remove("products",p.id)} active={p.active}/>)}</AdminList>
  <AdminList tab="coupons" title="Cupons" add="Novo cupom" onAdd={()=>setEditor({kind:"coupon"})}>{coupons.data?.map((c)=><Row key={c.id} title={c.title} subtitle={`${c.stores?.name ?? "Sem loja"} · ${c.active ? "Ativo" : "Inativo"}`} onEdit={()=>setEditor({kind:"coupon",value:c})} onToggle={()=>toggle("coupons",c.id,!c.active)} onDelete={()=>remove("coupons",c.id)} active={c.active}/>)}</AdminList>
  <AdminList tab="reviews" title="Avaliações editoriais" add="Nova avaliação" onAdd={()=>setEditor({kind:"review"})}>{reviews.data?.map((r)=><Row key={r.id} title={r.title} subtitle={`${products.data?.find((p)=>p.id===r.product_id)?.title ?? "Produto"} · ${r.active ? "Publicada" : "Oculta"}`} onEdit={()=>setEditor({kind:"review",value:r})} onToggle={()=>toggle("editorial_reviews",r.id,!r.active)} onDelete={()=>remove("editorial_reviews",r.id)} active={r.active}/>)}</AdminList>
  <AdminList tab="categories" title="Categorias" add="Nova categoria" onAdd={()=>setEditor({kind:"category"})}>{categories.data?.map((c)=><Row key={c.id} title={c.name} subtitle={`Ordem ${c.sort_order} · ${c.active !== false ? "Ativa" : "Oculta"}`} onEdit={()=>setEditor({kind:"category",value:c})} onToggle={()=>toggle("categories",c.id,c.active===false)} onDelete={()=>remove("categories",c.id)} active={c.active!==false}/>)}</AdminList>
  <AdminList tab="stores" title="Lojas" add="Nova loja" onAdd={()=>setEditor({kind:"store"})}>{stores.data?.map((s)=><Row key={s.id} title={s.name} subtitle={s.active ? "Ativa" : "Inativa"} onEdit={()=>setEditor({kind:"store",value:s})} onToggle={()=>toggle("stores",s.id,!s.active)} onDelete={()=>remove("stores",s.id)} active={s.active}/>)}</AdminList>
  </Tabs></div><EditorDialog editor={editor} products={products.data ?? []} categories={categories.data ?? []} stores={stores.data ?? []} saving={saving} onClose={()=>setEditor(null)} onSave={save}/></main>;
}

function AdminList({tab,title,add,onAdd,children}:{tab:string;title:string;add:string;onAdd:()=>void;children:React.ReactNode}) { return <TabsContent value={tab}><div className="mt-4 rounded-lg border border-border bg-card"><div className="flex items-center justify-between gap-3 border-b border-border p-4"><h2 className="font-display text-lg font-semibold">{title}</h2><Button size="sm" onClick={onAdd}><Plus/>{add}</Button></div><div className="divide-y divide-border px-4">{children || <p className="py-8 text-sm text-muted-foreground">Nenhum item cadastrado.</p>}</div></div></TabsContent>; }
function Row({title,subtitle,onEdit,onToggle,onDelete,active}:{title:string;subtitle:string;onEdit:()=>void;onToggle:()=>void;onDelete:()=>void;active:boolean}) { return <div className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><p className="truncate font-medium">{title}</p><p className="text-xs text-muted-foreground">{subtitle}</p></div><div className="flex gap-1"><Button variant="ghost" size="icon-sm" aria-label="Editar" title="Editar" onClick={onEdit}><Pencil/></Button><Button variant="ghost" size="icon-sm" aria-label={active?"Ocultar":"Reativar"} title={active?"Ocultar":"Reativar"} onClick={onToggle}>{active?<EyeOff/>:<Eye/>}</Button><Button variant="ghost" size="icon-sm" aria-label="Excluir" title="Excluir" onClick={onDelete}><Trash2/></Button></div></div>; }

function Field({label,name,defaultValue,type="text",required=false}:{label:string;name:string;defaultValue?:string|number|null;type?:string;required?:boolean}) { return <div className="space-y-2"><Label htmlFor={name}>{label}</Label><Input id={name} name={name} type={type} defaultValue={defaultValue ?? ""} required={required}/></div>; }
function Area({label,name,defaultValue}:{label:string;name:string;defaultValue?:string|null}) { return <div className="space-y-2"><Label htmlFor={name}>{label}</Label><Textarea id={name} name={name} defaultValue={defaultValue ?? ""}/></div>; }
function Check({label,name,checked=true}:{label:string;name:string;checked?:boolean}) { return <label className="flex items-center justify-between gap-4 rounded-lg border border-border px-3 py-2 text-sm"><span>{label}</span><Switch name={name} defaultChecked={checked}/></label>; }
function Relation({label,name,value,items}:{label:string;name:string;value?:string|null;items:{id:string;name?:string;title?:string}[]}) { return <div className="space-y-2"><Label>{label}</Label><Select name={name} defaultValue={value ?? NONE}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value={NONE}>Não definido</SelectItem>{items.map((item)=><SelectItem key={item.id} value={item.id}>{item.name ?? item.title}</SelectItem>)}</SelectContent></Select></div>; }

function EditorDialog({editor,products,categories,stores,saving,onClose,onSave}:{editor:Editor|null;products:Product[];categories:Category[];stores:Store[];saving:boolean;onClose:()=>void;onSave:(event:React.FormEvent<HTMLFormElement>)=>void}) {
  if (!editor) return null; const value=editor.value; const title=`${value?"Editar":"Adicionar"} ${editor.kind==="product"?"produto":editor.kind==="coupon"?"cupom":editor.kind==="review"?"avaliação":editor.kind==="category"?"categoria":"loja"}`;
  return <Dialog open onOpenChange={(open)=>{if(!open)onClose()}}><DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl"><DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader><form onSubmit={onSave} className="grid gap-4 sm:grid-cols-2">
    {editor.kind==="product"?<ProductFields value={editor.value} categories={categories} stores={stores}/>:null}
    {editor.kind==="coupon"?<CouponFields value={editor.value} stores={stores}/>:null}
    {editor.kind==="category"?<CategoryFields value={editor.value}/>:null}
    {editor.kind==="store"?<StoreFields value={editor.value}/>:null}
    {editor.kind==="review"?<ReviewFields value={editor.value} products={products}/>:null}
    <div className="flex justify-end gap-2 border-t border-border pt-4 sm:col-span-2"><Button type="button" variant="outline" onClick={onClose}>Cancelar</Button><Button disabled={saving}>{saving?"Salvando…":"Salvar"}</Button></div>
  </form></DialogContent></Dialog>;
}
function ProductFields({value,categories,stores}:{value?:Product;categories:Category[];stores:Store[]}) { return <><Field label="Nome" name="title" defaultValue={value?.title} required/><Field label="Slug" name="slug" defaultValue={value?.slug}/><div className="sm:col-span-2"><Area label="Descrição curta" name="short_description" defaultValue={value?.short_description}/></div><div className="sm:col-span-2"><Area label="Descrição completa" name="description" defaultValue={value?.description}/></div><Field label="Preço informado" name="price" type="number" defaultValue={value?.price} /><Field label="Preço anterior" name="original_price" type="number" defaultValue={value?.original_price}/><Field label="Moeda" name="currency" defaultValue={value?.currency ?? "BRL"}/><Field label="Data de atualização do preço" name="price_updated_at" type="datetime-local" defaultValue={value?.price_updated_at?.slice(0,16)}/><Relation label="Loja" name="store_id" value={value?.store_id} items={stores}/><Relation label="Categoria" name="category_id" value={value?.category_id} items={categories}/><div className="sm:col-span-2"><Field label="Link de afiliado" name="affiliate_url" defaultValue={value?.affiliate_url} type="url" required/></div><div className="sm:col-span-2"><Field label="Imagem principal" name="image_url" defaultValue={value?.image_url} type="url"/></div><div className="sm:col-span-2"><Area label="Galeria — um link por linha" name="gallery" defaultValue={Array.isArray(value?.gallery)?value.gallery.join("\n"):""}/></div><div className="sm:col-span-2"><Field label="Vídeo do YouTube" name="video_url" defaultValue={value?.video_url} type="url"/></div><Field label="Tags separadas por vírgula" name="tags" defaultValue={value?.tags.join(", ")}/><Field label="Código de cupom" name="coupon_code" defaultValue={value?.coupon_code}/><Field label="Ordem" name="sort_order" type="number" defaultValue={value?.sort_order ?? 0}/><div className="sm:col-span-2"><Area label="Características em JSON" name="specifications" defaultValue={value?.specifications?JSON.stringify(value.specifications,null,2):""}/></div><Check label="Destacar" name="featured" checked={value?.featured ?? false}/><Check label="Ativo" name="active" checked={value?.active ?? true}/></>; }
function CouponFields({value,stores}:{value?:Coupon;stores:Store[]}) { return <><Field label="Nome" name="title" defaultValue={value?.title} required/><Field label="Código" name="code" defaultValue={value?.code}/><Relation label="Loja" name="store_id" value={value?.store_id} items={stores}/><Field label="Validade" name="expires_at" type="datetime-local" defaultValue={value?.expires_at?.slice(0,16)}/><Field label="Identificação do desconto" name="discount_label" defaultValue={value?.discount_label}/><div className="sm:col-span-2"><Field label="Link de afiliado" name="affiliate_url" type="url" defaultValue={value?.affiliate_url} required/></div><div className="sm:col-span-2"><Area label="Descrição" name="description" defaultValue={value?.description}/></div><div className="sm:col-span-2"><Area label="Condições" name="conditions" defaultValue={value?.conditions}/></div><Check label="Destacar" name="featured" checked={value?.featured ?? false}/><Check label="Ativo" name="active" checked={value?.active ?? true}/></>; }
function CategoryFields({value}:{value?:Category}) { return <><Field label="Nome" name="name" defaultValue={value?.name} required/><Field label="Slug" name="slug" defaultValue={value?.slug}/><Field label="Ícone" name="icon" defaultValue={value?.icon}/><Field label="Ordem" name="sort_order" type="number" defaultValue={value?.sort_order ?? 0}/><div className="sm:col-span-2"><Check label="Ativa" name="active" checked={value?.active ?? true}/></div></>; }
function StoreFields({value}:{value?:Store}) { return <><Field label="Nome" name="name" defaultValue={value?.name} required/><Field label="Slug" name="slug" defaultValue={value?.slug}/><Field label="Site oficial" name="website_url" type="url" defaultValue={value?.website_url}/><Field label="Link-base de afiliado" name="affiliate_base_url" type="url" defaultValue={(value as Store & {affiliate_base_url?:string|null})?.affiliate_base_url}/><div className="sm:col-span-2"><Field label="Logo" name="logo_url" type="url" defaultValue={value?.logo_url}/></div><div className="sm:col-span-2"><Area label="Observações administrativas" name="admin_notes" defaultValue={(value as Store & {admin_notes?:string|null})?.admin_notes}/></div><div className="sm:col-span-2"><Check label="Ativa" name="active" checked={value?.active ?? true}/></div></>; }
function ReviewFields({value,products}:{value?:EditorialReview;products:Product[]}) { return <><div className="sm:col-span-2"><Relation label="Produto" name="product_id" value={value?.product_id} items={products}/></div><Field label="Título" name="title" defaultValue={value?.title} required/><Field label="Nota de 0 a 5" name="rating" type="number" defaultValue={value?.rating}/><div className="sm:col-span-2"><Area label="Texto editorial" name="body" defaultValue={value?.body}/></div><Field label="Data de publicação" name="published_at" type="datetime-local" defaultValue={value?.published_at?.slice(0,16) ?? new Date().toISOString().slice(0,16)}/><Check label="Publicada" name="active" checked={value?.active ?? true}/></>; }