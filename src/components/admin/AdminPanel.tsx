import { PriceDiscountFields } from "@/components/admin/PriceDiscountFields";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { BarChart3, Eye, EyeOff, LogOut, MessageSquare, Package, Pencil, Plus, Settings, ShieldCheck, Ticket, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { ClickAnalytics } from "@/components/admin/ClickAnalytics";
import { MediaListField } from "@/components/admin/MediaListField";
import { MediaUploadField } from "@/components/admin/MediaUploadField";
import { ReviewsModeration } from "@/components/admin/ReviewsModeration";
import { Logo } from "@/components/site/Logo";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { AffiliatesAdmin } from "@/components/admin/AffiliatesAdmin";
import {
  adminCategoriesQuery,
  adminBannersQuery,
  adminCouponsQuery,
  adminProductsQuery,
  adminProductReviewsQuery,
  adminReviewsQuery,
  adminStoresQuery,
  adminSiteSettingsQuery,
  slugify,
  type Category,
  type Coupon,
  type EditorialReview,
  type Product,
  type Store,
  type Banner,
  type ProductReview,
} from "@/lib/promovip";

type Editor = { kind: "product"; value?: Product } | { kind: "coupon"; value?: Coupon } | { kind: "category"; value?: Category } | { kind: "store"; value?: Store } | { kind: "review"; value?: EditorialReview } | {kind:"banner";value?:Banner} | {kind:"customer";value?:ProductReview};
type TableName = "products" | "coupons" | "categories" | "stores" | "editorial_reviews" | "banners" | "product_reviews";
const NONE = "__none__";

function validUrl(value: string, required = false) {
  if (!value) return !required;
  try { const url = new URL(value); return url.protocol === "https:" || url.protocol === "http:"; } catch { return false; }
}
/** Media accepts both external addresses and internal paths created by our own upload. */
function validMedia(value: string, required = false) {
  if (!value) return !required;
  if (value.startsWith("/")) return true;
  return validUrl(value, required);
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
  const banners = useQuery(adminBannersQuery);
  const settings = useQuery(adminSiteSettingsQuery);
  const customerReviews = useQuery(adminProductReviewsQuery);
  const analytics = useQuery({ queryKey: ["admin", "analytics"], queryFn: async () => { const { data, error } = await supabase.from("analytics_events").select("event_type,product_id,store_id,occurred_at"); if (error) throw error; return data; } });
  const [editor, setEditor] = useState<Editor | null>(null);
  const [saving, setSaving] = useState(false);
  const refresh = async () => Promise.all([products.refetch(), coupons.refetch(), categories.refetch(), stores.refetch(), reviews.refetch(), banners.refetch(), settings.refetch(), analytics.refetch(), customerReviews.refetch()]);
  const active = products.data?.filter((p) => p.active).length ?? 0;
  const hidden = (products.data?.length ?? 0) - active;
  const views = analytics.data?.filter((e) => e.event_type === "product_view").length ?? 0;
  const clicks = analytics.data?.filter((e) => e.event_type === "outbound_click").length ?? 0;
  const expiring = useMemo(() => coupons.data?.filter((coupon) => coupon.active && coupon.expires_at && Date.parse(coupon.expires_at) > Date.now() && Date.parse(coupon.expires_at) < Date.now() + 7 * 86400000).length ?? 0, [coupons.data]);

  async function toggle(table: Exclude<TableName, "product_reviews">, id: string, value: boolean) {
    const { error } = await supabase.from(table).update({ active: value }).eq("id", id);
    if (error) { toast.error("Não foi possível atualizar o status."); return; }
    toast.success("Status atualizado."); await refresh();
  }
  async function remove(table: TableName, id: string) {
    if (!window.confirm("Excluir este item permanentemente?")) return;
    const { error } = await supabase.from(table).delete().eq("id", id);
    if (error) { toast.error("Não foi possível excluir. Verifique se o item está em uso."); return; }
    toast.success("Item excluído."); await refresh();
  }
  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!editor) return;
    setSaving(true);
    const form = new FormData(event.currentTarget);
    let table: TableName; let payload: Record<string, unknown>;
    try {
      if (editor.kind === "product") {
        const title = String(form.get("title") ?? "").trim();
        const affiliateUrl = String(form.get("affiliate_url") ?? "").trim();
        const imageUrl = String(form.get("image_url") ?? "").trim();
        const videoUrl = String(form.get("video_url") ?? "").trim();
        const gallery = String(form.get("gallery") ?? "").split("\n").map((item) => item.trim()).filter(Boolean);
        const price = numberOrNull(form.get("price"));
        const storeId = form.get("store_id") === NONE ? null : String(form.get("store_id") ?? "");
        if (!title || price === null || !storeId || !imageUrl || !affiliateUrl) throw new Error("Preencha nome, preço, loja, link de afiliado e foto principal.");
        if (price < 0) throw new Error("Informe um preço válido.");
        const originalPrice = numberOrNull(form.get("original_price"));
        if (originalPrice !== null && originalPrice < 0) throw new Error("Informe um preço anterior válido.");
        if (form.get("discount_mode") === "manual") { const pct = numberOrNull(form.get("discount_percent")); if (pct !== null && (pct <= 0 || pct >= 100)) throw new Error("Informe um percentual de desconto entre 0 e 100."); }
        if (!validUrl(affiliateUrl, true)) throw new Error("Informe um link de afiliado válido.");
        if (!validMedia(imageUrl, true)) throw new Error("Não foi possível enviar a imagem. Tente novamente.");
        if (!validMedia(videoUrl)) throw new Error("Não foi possível enviar o vídeo. Tente novamente.");
        if (gallery.some((url) => !validMedia(url))) throw new Error("Não foi possível enviar uma das fotos adicionais. Tente novamente.");
        const specificationsText = String(form.get("specifications") ?? "").trim();
        const specifications = specificationsText ? JSON.parse(specificationsText) : {};
        if (!specifications || Array.isArray(specifications) || typeof specifications !== "object") throw new Error("As características devem usar o formato de objeto JSON.");
        table = "products"; payload = { title, slug: slugify(String(form.get("slug") || title)), short_description: nullable(form.get("short_description")), description: nullable(form.get("description")), price, original_price: numberOrNull(form.get("original_price")), discount_mode: form.get("discount_mode") === "manual" ? "manual" : "auto", discount_percent: form.get("discount_mode") === "manual" ? numberOrNull(form.get("discount_percent")) : null, currency: String(form.get("currency") || "BRL"), price_updated_at: nullable(form.get("price_updated_at")), affiliate_url: affiliateUrl, image_url: imageUrl, gallery, video_url: videoUrl || null, store_id: storeId, category_id: form.get("category_id") === NONE ? null : form.get("category_id"), tags: String(form.get("tags") ?? "").split(",").map((item) => item.trim()).filter(Boolean), specifications, coupon_code: nullable(form.get("coupon_code")), sort_order: Number(form.get("sort_order") || 0), frete_gratis: form.get("frete_gratis") === "on", entrega_super_rapida: form.get("entrega_super_rapida") === "on", featured: form.get("featured") === "on", active: form.get("active") === "on" };
      } else if (editor.kind === "coupon") {
        const affiliateUrl = String(form.get("affiliate_url") ?? "").trim(); const couponImage = String(form.get("image_url") ?? "").trim();
        if (!validUrl(affiliateUrl, true)) throw new Error("Informe um link válido para o cupom.");
        if (couponImage && !validMedia(couponImage)) throw new Error("Não foi possível enviar a imagem. Tente novamente.");
        table = "coupons"; payload = { title: String(form.get("title") ?? "").trim(), code: nullable(form.get("code")), description: nullable(form.get("description")), discount_label: nullable(form.get("discount_label")), conditions: nullable(form.get("conditions")), affiliate_url: affiliateUrl, image_url: nullable(form.get("image_url")), store_id: form.get("store_id") === NONE ? null : form.get("store_id"), expires_at: nullable(form.get("expires_at")), featured: form.get("featured") === "on", active: form.get("active") === "on" };
      } else if (editor.kind === "category") {
        table = "categories"; payload = { name: String(form.get("name") ?? "").trim(), slug: slugify(String(form.get("slug") || form.get("name") || "")), icon: nullable(form.get("icon")), sort_order: Number(form.get("sort_order") || 0), active: form.get("active") === "on" };
      } else if (editor.kind === "store") {
        const website = String(form.get("website_url") ?? "").trim(); const affiliate = String(form.get("affiliate_base_url") ?? "").trim(); const logo = String(form.get("logo_url") ?? "").trim();
        if (!validUrl(website)) throw new Error("Informe um endereço de site válido.");
        if (!validUrl(affiliate)) throw new Error("Informe um link de afiliado válido.");
        if (!validMedia(logo)) throw new Error("Não foi possível enviar a imagem. Tente novamente.");
        table = "stores"; payload = { name: String(form.get("name") ?? "").trim(), slug: slugify(String(form.get("slug") || form.get("name") || "")), website_url: website || null, affiliate_base_url: affiliate || null, logo_url: logo || null, admin_notes: nullable(form.get("admin_notes")), active: form.get("active") === "on" };
      } else if(editor.kind === "banner") {
        const image=String(form.get("image_url")??"").trim();const link=String(form.get("link_url")??"").trim();const bannerVideo=String(form.get("video_url")??"").trim();const media=String(form.get("media")??"").split("\n").map(item=>item.trim()).filter(Boolean);
        if(!validMedia(image))throw new Error("Não foi possível enviar a imagem. Tente novamente.");
        if(!validUrl(link))throw new Error("Informe um link válido para o banner.");
        if(!validMedia(bannerVideo))throw new Error("Não foi possível enviar o vídeo. Tente novamente.");
        if(media.some(url=>!validMedia(url)))throw new Error("Não foi possível enviar uma das imagens do carrossel. Tente novamente.");
        table="banners";payload={title:String(form.get("title")??"").trim(),subtitle:nullable(form.get("subtitle")),image_url:image||null,media,video_url:bannerVideo||null,autoplay:form.get("autoplay")==="on",link_url:link||null,link_label:nullable(form.get("link_label")),starts_at:nullable(form.get("starts_at")),ends_at:nullable(form.get("ends_at")),sort_order:Number(form.get("sort_order")||0),active:form.get("active")==="on"};
      } else if (editor.kind === "customer") {
        const rating = Number(form.get("rating") ?? 5);
        if (!Number.isInteger(rating) || rating < 1 || rating > 5) throw new Error("A nota deve ficar entre 1 e 5 estrelas.");
        const photo = String(form.get("photo_url") ?? "").trim();
        table = "product_reviews";
        payload = { product_id: form.get("product_id"), author_name: String(form.get("author_name") ?? "").trim(), body: String(form.get("body") ?? "").trim(), rating, photo_url: photo || null, source: "admin", status: String(form.get("status") ?? "approved"), created_at: new Date(String(form.get("created_at") || new Date().toISOString())).toISOString() };
      } else {
        table = "editorial_reviews"; const rating = numberOrNull(form.get("rating")); if (rating !== null && (rating < 0 || rating > 5)) throw new Error("A nota deve ficar entre 0 e 5.");
        payload = { product_id: form.get("product_id"), title: String(form.get("title") ?? "").trim(), body: String(form.get("body") ?? "").trim(), rating, published_at: String(form.get("published_at") ?? new Date().toISOString()), active: form.get("active") === "on" };
      }
      const current = editor.value;
      const result = current ? await supabase.from(table).update(payload as never).eq("id", current.id) : await supabase.from(table).insert(payload as never);
      if (result.error) throw result.error;
      toast.success(current ? "Alterações salvas." : "Item criado."); setEditor(null); await refresh();
    } catch (error) { toast.error(error instanceof Error ? error.message : "Não foi possível salvar."); } finally { setSaving(false); }
  }

  async function saveSettings(event:React.FormEvent<HTMLFormElement>){event.preventDefault();setSaving(true);const f=new FormData(event.currentTarget);const rows=[{key:"landing",value:{banner_aspect:String(f.get("banner_aspect")??"15/9"),vivi_title:String(f.get("vivi_title")??""),vivi_description:String(f.get("vivi_description")??"")},public:true},{key:"social",value:{whatsapp:String(f.get("whatsapp")??""),facebook:String(f.get("facebook")??"")},public:true},{key:"music_player",value:{playlist_id:String(f.get("playlist_id")??""),title:"Playlist PromoraShop"},public:true},{key:"discount_hunt",value:{name:String(f.get("hunt_name")??""),title:String(f.get("hunt_title")??""),description:String(f.get("hunt_description")??""),cta:String(f.get("hunt_cta")??""),send_label:String(f.get("hunt_send_label")??""),whatsapp:String(f.get("hunt_whatsapp")??""),message_intro:String(f.get("hunt_message_intro")??""),message_question:String(f.get("hunt_message_question")??"")},public:true},{key:"vivi",value:{avatar_url:String(f.get("vivi_avatar_url")??""),full_image_url:String(f.get("vivi_full_image_url")??""),greeting:String(f.get("vivi_greeting")??""),intro:String(f.get("vivi_intro")??"")},public:true}];const{error}=await supabase.from("site_settings").upsert(rows);setSaving(false);if(error){toast.error("Não foi possível salvar as configurações.");return}toast.success("Configurações atualizadas.");await settings.refetch()}
  async function changePassword(event:React.FormEvent<HTMLFormElement>){event.preventDefault();const form=event.currentTarget;const f=new FormData(form);const current=String(f.get("current")??"");const password=String(f.get("password")??"");if(password!==String(f.get("confirm")??"")){toast.error("As senhas não coincidem.");return}const{data}=await supabase.auth.getUser();if(!data.user?.email){toast.error("Sua sessão expirou.");return}const verified=await supabase.auth.signInWithPassword({email:data.user.email,password:current});if(verified.error){toast.error("A senha atual está incorreta.");return}const{error}=await supabase.auth.updateUser({password});if(error)toast.error("Não foi possível alterar a senha.");else{form.reset();toast.success("Senha alterada com segurança.")}}

  const pendingReviews = customerReviews.data?.filter((review) => review.status === "pending").length ?? 0;
  const stats = [{ Icon: Package, label: "Produtos ativos", value: active }, { Icon: EyeOff, label: "Produtos ocultos", value: hidden }, { Icon: Eye, label: "Visualizações", value: views }, { Icon: BarChart3, label: "Cliques externos", value: clicks }];
  const config=Object.fromEntries((settings.data??[]).map(s=>[s.key,s.value])) as Record<string,Record<string,string>>;const landing=config["landing"]??{};const social=config["social"]??{};const music=config["music_player"]??{};const hunt=config["discount_hunt"]??{};const vivi=config["vivi"]??{};
  return <main className="min-h-screen bg-muted/40"><header className="border-b border-border bg-card"><div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4"><Logo/><div className="flex items-center gap-3"><span className="hidden text-sm text-muted-foreground sm:inline">Painel da proprietária</span><Button variant="outline" size="sm" onClick={async()=>{await supabase.auth.signOut();await navigate({to:"/admin/login",replace:true})}}><LogOut/>Sair</Button></div></div></header><div className="mx-auto max-w-7xl px-4 py-8"><h1 className="font-display text-3xl font-bold">Visão geral</h1><p className="mt-2 text-sm text-muted-foreground">Dados reais da PromoraShop. Visualizações e cliques não representam compras.</p>{expiring ? <p className="mt-4 rounded-lg border border-border bg-card px-4 py-3 text-sm"><Ticket className="mr-2 inline size-4 text-primary"/>{expiring} cupom(ns) expira(m) nos próximos 7 dias.</p> : null}<div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">{stats.map(({Icon,label,value})=><Card key={label}><CardContent className="p-5"><Icon className="size-5 text-primary"/><p className="mt-5 text-2xl font-bold">{value}</p><p className="text-xs text-muted-foreground">{label}</p></CardContent></Card>)}</div><Tabs defaultValue="products" className="mt-8"><TabsList className="h-auto w-full justify-start overflow-x-auto"><TabsTrigger value="products">Produtos</TabsTrigger><TabsTrigger value="coupons">Cupons</TabsTrigger><TabsTrigger value="reviews">Avaliações{pendingReviews?` (${pendingReviews})`:""}</TabsTrigger><TabsTrigger value="clicks">📊 Cliques externos</TabsTrigger><TabsTrigger value="affiliates">💜 Afiliados</TabsTrigger><TabsTrigger value="editorial">Textos editoriais</TabsTrigger><TabsTrigger value="categories">Categorias</TabsTrigger><TabsTrigger value="stores">Lojas</TabsTrigger><TabsTrigger value="banners">Banners</TabsTrigger><TabsTrigger value="content">Conteúdo e redes</TabsTrigger><TabsTrigger value="security">Segurança</TabsTrigger></TabsList>
  <AdminList tab="products" title="Produtos" add="Novo produto" onAdd={()=>setEditor({kind:"product"})}>{products.data?.map((p)=><Row key={p.id} title={p.title} subtitle={`${p.stores?.name ?? "Sem loja"} · ${p.active ? "Ativo" : "Oculto"}`} onEdit={()=>setEditor({kind:"product",value:p})} onToggle={()=>toggle("products",p.id,!p.active)} onDelete={()=>remove("products",p.id)} active={p.active}/>)}</AdminList>
  <AdminList tab="coupons" title="Cupons" add="Novo cupom" onAdd={()=>setEditor({kind:"coupon"})}>{coupons.data?.map((c)=><Row key={c.id} title={c.title} subtitle={`${c.stores?.name ?? "Sem loja"} · ${c.active ? "Ativo" : "Inativo"}`} onEdit={()=>setEditor({kind:"coupon",value:c})} onToggle={()=>toggle("coupons",c.id,!c.active)} onDelete={()=>remove("coupons",c.id)} active={c.active}/>)}</AdminList>
  <TabsContent value="reviews"><div className="mt-4 flex items-center justify-between gap-3 rounded-lg border border-border bg-card p-4"><h2 className="flex items-center gap-2 font-display text-lg font-semibold"><MessageSquare className="size-5 text-primary"/>Avaliações dos clientes</h2><Button size="sm" onClick={()=>setEditor({kind:"customer"})}><Plus/>Nova avaliação</Button></div><ReviewsModeration reviews={customerReviews.data ?? []} products={products.data ?? []} onChanged={refresh}/></TabsContent>
  <TabsContent value="affiliates"><AffiliatesAdmin stores={stores.data ?? []} categories={categories.data ?? []}/></TabsContent>
  <TabsContent value="clicks"><ClickAnalytics events={analytics.data ?? []} products={products.data ?? []} stores={stores.data ?? []} categories={categories.data ?? []}/></TabsContent>
  <AdminList tab="editorial" title="Textos editoriais" add="Novo texto" onAdd={()=>setEditor({kind:"review"})}>{reviews.data?.map((r)=><Row key={r.id} title={r.title} subtitle={`${products.data?.find((p)=>p.id===r.product_id)?.title ?? "Produto"} · ${r.active ? "Publicada" : "Oculta"}`} onEdit={()=>setEditor({kind:"review",value:r})} onToggle={()=>toggle("editorial_reviews",r.id,!r.active)} onDelete={()=>remove("editorial_reviews",r.id)} active={r.active}/>)}</AdminList>
  <AdminList tab="categories" title="Categorias" add="Nova categoria" onAdd={()=>setEditor({kind:"category"})}>{categories.data?.map((c)=><Row key={c.id} title={c.name} subtitle={`Ordem ${c.sort_order} · ${c.active !== false ? "Ativa" : "Oculta"}`} onEdit={()=>setEditor({kind:"category",value:c})} onToggle={()=>toggle("categories",c.id,c.active===false)} onDelete={()=>remove("categories",c.id)} active={c.active!==false}/>)}</AdminList>
  <AdminList tab="stores" title="Lojas" add="Nova loja" onAdd={()=>setEditor({kind:"store"})}>{stores.data?.map((s)=><Row key={s.id} title={s.name} subtitle={s.active ? "Ativa" : "Inativa"} onEdit={()=>setEditor({kind:"store",value:s})} onToggle={()=>toggle("stores",s.id,!s.active)} onDelete={()=>remove("stores",s.id)} active={s.active}/>)}</AdminList>
  <AdminList tab="banners" title="Promoções e banners" add="Novo banner" onAdd={()=>setEditor({kind:"banner"})}>{banners.data?.map((b)=><Row key={b.id} title={b.title} subtitle={`Ordem ${b.sort_order} · ${b.active?"Ativo":"Oculto"}`} onEdit={()=>setEditor({kind:"banner",value:b})} onToggle={()=>toggle("banners",b.id,!b.active)} onDelete={()=>remove("banners",b.id)} active={b.active}/>)}</AdminList>
  <TabsContent value="content"><form onSubmit={saveSettings} className="mt-4 grid gap-4 rounded-lg border border-border bg-card p-5 sm:grid-cols-2"><h2 className="flex items-center gap-2 font-display text-lg font-semibold sm:col-span-2"><Settings className="size-5 text-primary"/>Conteúdo da landing e canais</h2><div className="space-y-2"><Label htmlFor="banner_aspect">Proporção do banner</Label><select id="banner_aspect" name="banner_aspect" defaultValue={landing["banner_aspect"]||"15/9"} className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"><option value="15/9">15:9 (padrão)</option><option value="16/9">16:9</option><option value="4/3">4:3</option><option value="1/1">1:1</option><option value="21/9">21:9</option><option value="3/1">3:1</option></select></div><Field label="Título da seção Conversar com a Vivi" name="vivi_title" defaultValue={landing["vivi_title"]}/><div className="sm:col-span-2"><Area label="Descrição da Vivi" name="vivi_description" defaultValue={landing["vivi_description"]}/></div><Field label="WhatsApp" name="whatsapp" type="url" defaultValue={social["whatsapp"]}/><Field label="Facebook" name="facebook" type="url" defaultValue={social["facebook"]}/><Field label="ID da playlist do YouTube" name="playlist_id" defaultValue={music["playlist_id"]}/><h2 className="flex items-center gap-2 font-display text-lg font-semibold sm:col-span-2"><Settings className="size-5 text-primary"/>Caça ao Desconto</h2><Field label="Nome da função" name="hunt_name" defaultValue={hunt["name"]}/><Field label="Título na landing" name="hunt_title" defaultValue={hunt["title"]}/><div className="sm:col-span-2"><Area label="Descrição" name="hunt_description" defaultValue={hunt["description"]}/></div><Field label="Texto do botão" name="hunt_cta" defaultValue={hunt["cta"]}/><Field label="Texto do botão de envio" name="hunt_send_label" defaultValue={hunt["send_label"]}/><div className="sm:col-span-2"><Field label="WhatsApp da Caça ao Desconto" name="hunt_whatsapp" type="url" defaultValue={hunt["whatsapp"]}/></div><div className="sm:col-span-2"><Area label="Início da mensagem automática" name="hunt_message_intro" defaultValue={hunt["message_intro"]}/></div><div className="sm:col-span-2"><Area label="Pergunta final da mensagem" name="hunt_message_question" defaultValue={hunt["message_question"]}/></div><h2 className="flex items-center gap-2 font-display text-lg font-semibold sm:col-span-2"><Settings className="size-5 text-primary"/>Mídia e mensagens da Vivi</h2><Field label="Imagem circular da Vivi" name="vivi_avatar_url" type="url" defaultValue={vivi["avatar_url"]}/><input type="hidden" name="vivi_full_image_url" value={vivi["full_image_url"]??""}/><div className="sm:col-span-2"><Area label="Saudação no chat" name="vivi_greeting" defaultValue={vivi["greeting"]}/></div><div className="sm:col-span-2"><Area label="Texto de apresentação" name="vivi_intro" defaultValue={vivi["intro"]}/></div><div className="flex justify-end sm:col-span-2"><Button disabled={saving}>Salvar conteúdo</Button></div></form></TabsContent>
  <TabsContent value="security"><form onSubmit={changePassword} className="mt-4 max-w-xl space-y-4 rounded-lg border border-border bg-card p-5"><h2 className="flex items-center gap-2 font-display text-lg font-semibold"><ShieldCheck className="size-5 text-primary"/>Segurança da conta</h2><p className="text-sm text-muted-foreground">Altere sua senha após confirmar a senha atual.</p><Field label="Senha atual" name="current" type="password" required/><Field label="Nova senha" name="password" type="password" required/><Field label="Confirmar nova senha" name="confirm" type="password" required/><Button>Alterar senha</Button></form></TabsContent>
  </Tabs></div><EditorDialog editor={editor} products={products.data ?? []} categories={categories.data ?? []} stores={stores.data ?? []} saving={saving} onClose={()=>setEditor(null)} onSave={save}/></main>;
}

function AdminList({tab,title,add,onAdd,children}:{tab:string;title:string;add:string;onAdd:()=>void;children:React.ReactNode}) { return <TabsContent value={tab}><div className="mt-4 rounded-lg border border-border bg-card"><div className="flex items-center justify-between gap-3 border-b border-border p-4"><h2 className="font-display text-lg font-semibold">{title}</h2><Button size="sm" onClick={onAdd}><Plus/>{add}</Button></div><div className="divide-y divide-border px-4">{children || <p className="py-8 text-sm text-muted-foreground">Nenhum item cadastrado.</p>}</div></div></TabsContent>; }
function Row({title,subtitle,onEdit,onToggle,onDelete,active}:{title:string;subtitle:string;onEdit:()=>void;onToggle:()=>void;onDelete:()=>void;active:boolean}) { return <div className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><p className="truncate font-medium">{title}</p><p className="text-xs text-muted-foreground">{subtitle}</p></div><div className="flex gap-1"><Button variant="ghost" size="icon-sm" aria-label="Editar" title="Editar" onClick={onEdit}><Pencil/></Button><Button variant="ghost" size="icon-sm" aria-label={active?"Ocultar":"Reativar"} title={active?"Ocultar":"Reativar"} onClick={onToggle}>{active?<EyeOff/>:<Eye/>}</Button><Button variant="ghost" size="icon-sm" aria-label="Excluir" title="Excluir" onClick={onDelete}><Trash2/></Button></div></div>; }

function Field({label,name,defaultValue,type="text",required=false}:{label:string;name:string;defaultValue?:string|number|null|undefined;type?:string;required?:boolean}) { return <div className="space-y-2"><Label htmlFor={name}>{label}</Label><Input id={name} name={name} type={type} step={type === "number" ? "any" : undefined} defaultValue={defaultValue ?? ""} required={required}/></div>; }
function Area({label,name,defaultValue}:{label:string;name:string;defaultValue?:string|null|undefined}) { return <div className="space-y-2"><Label htmlFor={name}>{label}</Label><Textarea id={name} name={name} defaultValue={defaultValue ?? ""}/></div>; }
function Check({label,name,checked=true}:{label:string;name:string;checked?:boolean}) { return <label className="flex items-center justify-between gap-4 rounded-lg border border-border px-3 py-2 text-sm"><span>{label}</span><Switch name={name} defaultChecked={checked}/></label>; }
function DeliveryCheck({label,name,checked}:{label:string;name:string;checked:boolean}) { return <label className="flex min-h-10 items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm"><Checkbox name={name} defaultChecked={checked}/><span>{label}</span></label>; }
function Relation({label,name,value,items,required=false}:{label:string;name:string;value?:string|null|undefined;items:{id:string;name?:string;title?:string}[];required?:boolean}) { return <div className="space-y-2"><Label>{label}</Label><Select name={name} defaultValue={value ?? NONE} required={required}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{required ? null : <SelectItem value={NONE}>Não definido</SelectItem>}{items.map((item)=><SelectItem key={item.id} value={item.id}>{item.name ?? item.title}</SelectItem>)}</SelectContent></Select></div>; }

function EditorDialog({editor,products,categories,stores,saving,onClose,onSave}:{editor:Editor|null;products:Product[];categories:Category[];stores:Store[];saving:boolean;onClose:()=>void;onSave:(event:React.FormEvent<HTMLFormElement>)=>void}) {
  if (!editor) return null; const value=editor.value; const title=`${value?"Editar":"Adicionar"} ${editor.kind==="product"?"produto":editor.kind==="coupon"?"cupom":editor.kind==="review"?"texto editorial":editor.kind==="customer"?"avaliação":editor.kind==="category"?"categoria":editor.kind==="banner"?"banner":"loja"}`;
  return <Dialog open onOpenChange={(open)=>{if(!open)onClose()}}><DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl"><DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader><form onSubmit={onSave} className="grid gap-4 sm:grid-cols-2">
    {editor.kind==="product"?<ProductFields value={editor.value} categories={categories} stores={stores}/>:null}
    {editor.kind==="coupon"?<CouponFields value={editor.value} stores={stores}/>:null}
    {editor.kind==="category"?<CategoryFields value={editor.value}/>:null}
    {editor.kind==="store"?<StoreFields value={editor.value}/>:null}
    {editor.kind==="review"?<ReviewFields value={editor.value} products={products}/>:null}
    {editor.kind==="banner"?<BannerFields value={editor.value}/>:null}
    {editor.kind==="customer"?<CustomerReviewFields value={editor.value} products={products}/>:null}
    <div className="flex justify-end gap-2 border-t border-border pt-4 sm:col-span-2"><Button type="button" variant="outline" onClick={onClose}>Cancelar</Button><Button disabled={saving}>{saving?"Salvando…":"Salvar"}</Button></div>
  </form></DialogContent></Dialog>;
}
function ProductFields({value,categories,stores}:{value?:Product|undefined;categories:Category[];stores:Store[]}) { return <><p className="sm:col-span-2 text-sm text-muted-foreground">Cadastre rapidamente com os cinco campos obrigatórios. Todo o restante pode ser acrescentado depois.</p><Field label="Nome do produto · Obrigatório" name="title" defaultValue={value?.title} required/><PriceDiscountFields price={value?.price} original={value?.original_price} mode={value?.discount_mode} percent={value?.discount_percent}/><Relation label="Loja · Obrigatório" name="store_id" value={value?.store_id} items={stores} required/><div className="sm:col-span-2"><Field label="Link de afiliado · Obrigatório" name="affiliate_url" defaultValue={value?.affiliate_url} type="url" required/></div><div className="sm:col-span-2"><MediaUploadField label="Foto principal · Obrigatório" name="image_url" kind="image" folder="produtos" defaultValue={value?.image_url ?? null} helper="Escolha a foto direto do dispositivo." required/></div><DeliveryCheck label="🚚 Frete grátis · Opcional" name="frete_gratis" checked={value?.frete_gratis ?? false}/><DeliveryCheck label="⚡ Entrega SUPER rápida · Opcional" name="entrega_super_rapida" checked={value?.entrega_super_rapida ?? false}/><Field label="Slug · Opcional" name="slug" defaultValue={value?.slug}/><div className="sm:col-span-2"><Area label="Descrição curta · Opcional" name="short_description" defaultValue={value?.short_description}/></div><div className="sm:col-span-2"><Area label="Descrição completa · Opcional" name="description" defaultValue={value?.description}/></div><Field label="Moeda · Opcional" name="currency" defaultValue={value?.currency ?? "BRL"}/><Field label="Data de atualização do preço · Opcional" name="price_updated_at" type="datetime-local" defaultValue={value?.price_updated_at?.slice(0,16)}/><Relation label="Categoria · Opcional" name="category_id" value={value?.category_id} items={categories}/><div className="sm:col-span-2"><MediaListField folder="produtos" label="Fotos adicionais · Opcional" name="gallery" helper="Adicione quantas fotos quiser, organize a ordem, substitua ou defina uma como principal." defaultValue={Array.isArray(value?.gallery)?(value.gallery as string[]):[]} onPromote={(url)=>{const input=document.querySelector<HTMLInputElement>('input[name="image_url"]');if(input)input.value=url}}/></div><div className="sm:col-span-2"><MediaUploadField label="Vídeo do produto · Opcional" name="video_url" kind="video" folder="produtos" defaultValue={value?.video_url ?? null} helper="Envie um vídeo do dispositivo ou cole um link do YouTube."/></div><Field label="Tags · Opcional" name="tags" defaultValue={value?.tags.join(", ")}/><Field label="Código de cupom · Opcional" name="coupon_code" defaultValue={value?.coupon_code}/><Field label="Ordem · Opcional" name="sort_order" type="number" defaultValue={value?.sort_order ?? 0}/><div className="sm:col-span-2"><Area label="Características em JSON · Opcional" name="specifications" defaultValue={value?.specifications?JSON.stringify(value.specifications,null,2):""}/></div><Check label="Destacar" name="featured" checked={value?.featured ?? false}/><Check label="Ativo" name="active" checked={value?.active ?? true}/></>; }
function CouponFields({value,stores}:{value?:Coupon|undefined;stores:Store[]}) { return <><Field label="Nome" name="title" defaultValue={value?.title} required/><Field label="Código" name="code" defaultValue={value?.code}/><Relation label="Loja" name="store_id" value={value?.store_id} items={stores}/><Field label="Validade" name="expires_at" type="datetime-local" defaultValue={value?.expires_at?.slice(0,16)}/><Field label="Identificação do desconto" name="discount_label" defaultValue={value?.discount_label}/><div className="sm:col-span-2"><Field label="Link de afiliado" name="affiliate_url" type="url" defaultValue={value?.affiliate_url} required/></div><div className="sm:col-span-2"><Area label="Descrição" name="description" defaultValue={value?.description}/></div><div className="sm:col-span-2"><Area label="Condições" name="conditions" defaultValue={value?.conditions}/></div><div className="sm:col-span-2"><MediaUploadField label="📷 Imagem do cupom · Opcional" name="image_url" kind="image" folder="cupons" defaultValue={value?.image_url ?? null} helper="Opcional. Escolha a imagem direto do dispositivo (JPG ou PNG)."/></div><Check label="Destacar" name="featured" checked={value?.featured ?? false}/><Check label="Ativo" name="active" checked={value?.active ?? true}/></>; }
function CategoryFields({value}:{value?:Category|undefined}) { return <><Field label="Nome" name="name" defaultValue={value?.name} required/><Field label="Slug" name="slug" defaultValue={value?.slug}/><Field label="Ícone" name="icon" defaultValue={value?.icon}/><Field label="Ordem" name="sort_order" type="number" defaultValue={value?.sort_order ?? 0}/><div className="sm:col-span-2"><Check label="Ativa" name="active" checked={value?.active ?? true}/></div></>; }
function StoreFields({value}:{value?:Store|undefined}) { return <><Field label="Nome" name="name" defaultValue={value?.name} required/><Field label="Slug" name="slug" defaultValue={value?.slug}/><Field label="Site oficial" name="website_url" type="url" defaultValue={value?.website_url}/><Field label="Link-base de afiliado" name="affiliate_base_url" type="url" defaultValue={value?.affiliate_base_url}/><div className="sm:col-span-2"><Field label="Logo" name="logo_url" type="url" defaultValue={value?.logo_url}/></div><div className="sm:col-span-2"><Area label="Observações administrativas" name="admin_notes" defaultValue={value?.admin_notes}/></div><div className="sm:col-span-2"><Check label="Ativa" name="active" checked={value?.active ?? true}/></div></>; }
function CustomerReviewFields({value,products}:{value?:ProductReview|undefined;products:Product[]}) { return <><div className="sm:col-span-2"><Relation label="Produto" name="product_id" value={value?.product_id} items={products} required/></div><Field label="Nome do cliente" name="author_name" defaultValue={value?.author_name} required/><Field label="Nota de 1 a 5 estrelas" name="rating" type="number" defaultValue={value?.rating ?? 5} required/><div className="sm:col-span-2"><Area label="Avaliação" name="body" defaultValue={value?.body}/></div><Field label="Data" name="created_at" type="datetime-local" defaultValue={(value?.created_at ?? new Date().toISOString()).slice(0,16)}/><div className="space-y-2"><Label>Situação</Label><Select name="status" defaultValue={value?.status ?? "approved"}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="approved">Aprovada</SelectItem><SelectItem value="pending">Pendente</SelectItem><SelectItem value="rejected">Rejeitada</SelectItem></SelectContent></Select></div><div className="sm:col-span-2"><MediaUploadField label="Foto da avaliação" name="photo_url" kind="image" folder="avaliacoes" defaultValue={value?.photo_url ?? null} helper="Opcional. Escolha uma foto do dispositivo."/></div></>; }
function ReviewFields({value,products}:{value?:EditorialReview|undefined;products:Product[]}) { return <><div className="sm:col-span-2"><Relation label="Produto" name="product_id" value={value?.product_id} items={products} required/></div><Field label="Título" name="title" defaultValue={value?.title} required/><Field label="Nota de 0 a 5" name="rating" type="number" defaultValue={value?.rating}/><div className="sm:col-span-2"><Area label="Texto editorial" name="body" defaultValue={value?.body}/></div><Field label="Data de publicação" name="published_at" type="datetime-local" defaultValue={value?.published_at?.slice(0,16) ?? new Date().toISOString().slice(0,16)}/><Check label="Publicada" name="active" checked={value?.active ?? true}/></>; }
function BannerFields({value}:{value:Banner|undefined}){return <><Field label="Título" name="title" defaultValue={value?.title} required/><Field label="Texto do botão" name="link_label" defaultValue={value?.link_label}/><div className="sm:col-span-2"><Area label="Descrição" name="subtitle" defaultValue={value?.subtitle}/></div><div className="sm:col-span-2"><MediaUploadField label="Imagem principal" name="image_url" kind="image" folder="banners" defaultValue={value?.image_url ?? null} helper="Escolha a imagem direto do dispositivo."/></div><div className="sm:col-span-2"><MediaListField folder="banners" label="Carrossel de imagens" name="media" helper="Adicione quantas imagens quiser e organize a ordem exibida no banner." defaultValue={Array.isArray(value?.media)?(value.media as string[]):[]}/></div><div className="sm:col-span-2"><MediaUploadField label="Vídeo do banner" name="video_url" kind="video" folder="banners" defaultValue={value?.video_url ?? null} helper="Envie um vídeo do dispositivo ou cole um link do YouTube."/></div><div className="sm:col-span-2"><Field label="Link de destino" name="link_url" type="url" defaultValue={value?.link_url}/></div><Field label="Início" name="starts_at" type="datetime-local" defaultValue={value?.starts_at?.slice(0,16)}/><Field label="Fim" name="ends_at" type="datetime-local" defaultValue={value?.ends_at?.slice(0,16)}/><Field label="Ordem" name="sort_order" type="number" defaultValue={value?.sort_order??0}/><Check label="Passar imagens/vídeo automaticamente (sem som)" name="autoplay" checked={value?.autoplay??false}/><Check label="Ativo" name="active" checked={value?.active??true}/></>}