"use client";

import { Flame } from "lucide-react";
import { useMemo, useState } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Category, Product, Store } from "@/lib/promovip";

export type ClickEvent = { event_type: string; product_id: string | null; store_id: string | null; occurred_at: string };

const ALL = "__all__";
const PERIODS = [
  { value: "7", label: "Últimos 7 dias" },
  { value: "30", label: "Últimos 30 dias" },
  { value: "90", label: "Últimos 90 dias" },
  { value: "all", label: "Todo o período" },
];

function dayKey(value: string) {
  return value.slice(0, 10);
}

export function ClickAnalytics({
  events,
  products,
  stores,
  categories,
}: {
  events: ClickEvent[];
  products: Product[];
  stores: Store[];
  categories: Category[];
}) {
  const [period, setPeriod] = useState("30");
  const [search, setSearch] = useState("");
  const [storeId, setStoreId] = useState(ALL);
  const [categoryId, setCategoryId] = useState(ALL);
  const [order, setOrder] = useState<"desc" | "asc">("desc");
  const [detail, setDetail] = useState<string | null>(null);

  const clicks = useMemo(() => events.filter((event) => event.event_type === "outbound_click"), [events]);

  const periodClicks = useMemo(() => {
    if (period === "all") return clicks;
    const limit = Date.now() - Number(period) * 86400000;
    return clicks.filter((event) => Date.parse(event.occurred_at) >= limit);
  }, [clicks, period]);

  const today = new Date().toISOString().slice(0, 10);
  const totals = {
    all: clicks.length,
    today: clicks.filter((event) => dayKey(event.occurred_at) === today).length,
    week: clicks.filter((event) => Date.parse(event.occurred_at) >= Date.now() - 7 * 86400000).length,
    month: clicks.filter((event) => Date.parse(event.occurred_at) >= Date.now() - 30 * 86400000).length,
  };

  const rows = useMemo(() => {
    const byProduct = new Map<string, { count: number; last: string }>();
    for (const event of periodClicks) {
      if (!event.product_id) continue;
      const current = byProduct.get(event.product_id);
      if (!current) byProduct.set(event.product_id, { count: 1, last: event.occurred_at });
      else {
        current.count += 1;
        if (event.occurred_at > current.last) current.last = event.occurred_at;
      }
    }
    return [...byProduct.entries()]
      .map(([id, value]) => {
        const product = products.find((item) => item.id === id);
        return {
          id,
          title: product?.title ?? "Produto removido",
          store: product?.stores?.name ?? "—",
          storeId: product?.store_id ?? null,
          category: product?.categories?.name ?? "—",
          categoryId: product?.category_id ?? null,
          link: product?.affiliate_url ?? null,
          count: value.count,
          last: value.last,
        };
      })
      .filter((row) => {
        if (search && !row.title.toLowerCase().includes(search.toLowerCase())) return false;
        if (storeId !== ALL && row.storeId !== storeId) return false;
        if (categoryId !== ALL && row.categoryId !== categoryId) return false;
        return true;
      })
      .sort((a, b) => (order === "desc" ? b.count - a.count : a.count - b.count));
  }, [periodClicks, products, search, storeId, categoryId, order]);

  const series = useMemo(() => {
    const byDay = new Map<string, number>();
    for (const event of periodClicks) byDay.set(dayKey(event.occurred_at), (byDay.get(dayKey(event.occurred_at)) ?? 0) + 1);
    return [...byDay.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([day, count]) => ({ day: day.slice(8) + "/" + day.slice(5, 7), cliques: count }));
  }, [periodClicks]);

  const detailRow = rows.find((row) => row.id === detail) ?? null;
  const detailSeries = useMemo(() => {
    if (!detail) return [];
    const byDay = new Map<string, number>();
    for (const event of periodClicks) {
      if (event.product_id !== detail) continue;
      byDay.set(dayKey(event.occurred_at), (byDay.get(dayKey(event.occurred_at)) ?? 0) + 1);
    }
    return [...byDay.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([day, count]) => ({ day: day.slice(8) + "/" + day.slice(5, 7), cliques: count }));
  }, [detail, periodClicks]);

  const cards = [
    { label: "Total de cliques externos", value: totals.all },
    { label: "Cliques hoje", value: totals.today },
    { label: "Últimos 7 dias", value: totals.week },
    { label: "Últimos 30 dias", value: totals.month },
  ];

  return (
    <div className="mt-4 space-y-5">
      <p className="rounded-lg border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
        Os cliques externos mostram quantas vezes os visitantes acessaram os links dos produtos. Cliques não representam vendas, pedidos ou
        comissões.
      </p>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cards.map((card) => (
          <Card key={card.label}>
            <CardContent className="p-5">
              <p className="text-2xl font-bold">{card.value}</p>
              <p className="text-xs text-muted-foreground">{card.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-3 rounded-lg border border-border bg-card p-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-2">
          <Label htmlFor="clicks-search">Pesquisar produto</Label>
          <Input id="clicks-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Nome do produto" />
        </div>
        <div className="space-y-2">
          <Label>Loja</Label>
          <Select value={storeId} onValueChange={setStoreId}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Todas</SelectItem>
              {stores.map((store) => (
                <SelectItem key={store.id} value={store.id}>
                  {store.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Categoria</Label>
          <Select value={categoryId} onValueChange={setCategoryId}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Todas</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Período</Label>
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PERIODS.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card p-5">
        <h3 className="font-display text-lg font-semibold">Evolução dos cliques</h3>
        {series.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">Nenhum clique registrado no período selecionado.</p>
        ) : (
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={series}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="day" fontSize={12} />
                <YAxis allowDecimals={false} fontSize={12} />
                <Tooltip />
                <Line type="monotone" dataKey="cliques" stroke="var(--color-primary)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="rounded-lg border border-border bg-card p-5">
        <h3 className="flex items-center gap-2 font-display text-lg font-semibold">
          <Flame className="size-5 text-primary" /> Produtos mais acessados
        </h3>
        <ol className="mt-3 space-y-2 text-sm">
          {rows.slice(0, 5).map((row, index) => (
            <li key={row.id} className="flex justify-between gap-3">
              <span className="truncate">
                {index + 1}. {row.title}
              </span>
              <span className="font-semibold">{row.count}</span>
            </li>
          ))}
          {rows.length === 0 ? <li className="text-muted-foreground">Sem cliques no período.</li> : null}
        </ol>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border bg-card">
        <div className="flex items-center justify-between gap-3 border-b border-border p-4">
          <h3 className="font-display text-lg font-semibold">Cliques por produto</h3>
          <Button size="sm" variant="outline" onClick={() => setOrder(order === "desc" ? "asc" : "desc")}>
            {order === "desc" ? "Maior número primeiro" : "Menor número primeiro"}
          </Button>
        </div>
        <table className="w-full min-w-[640px] text-sm">
          <thead className="text-left text-xs text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Produto</th>
              <th className="px-4 py-3">Loja</th>
              <th className="px-4 py-3">Categoria</th>
              <th className="px-4 py-3">Cliques</th>
              <th className="px-4 py-3">Último clique</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((row) => (
              <tr key={row.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setDetail(row.id)}>
                <td className="px-4 py-3 font-medium">{row.title}</td>
                <td className="px-4 py-3 text-muted-foreground">{row.store}</td>
                <td className="px-4 py-3 text-muted-foreground">{row.category}</td>
                <td className="px-4 py-3 font-semibold">{row.count}</td>
                <td className="px-4 py-3 text-muted-foreground">{new Date(row.last).toLocaleString("pt-BR")}</td>
              </tr>
            ))}
            {rows.length === 0 ? (
              <tr>
                <td className="px-4 py-8 text-muted-foreground" colSpan={5}>
                  Nenhum clique registrado com estes filtros.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <Dialog open={Boolean(detailRow)} onOpenChange={(value) => !value && setDetail(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{detailRow?.title}</DialogTitle>
          </DialogHeader>
          {detailRow ? (
            <div className="space-y-4 text-sm">
              <p>
                <strong>{detailRow.count}</strong> cliques no período selecionado.
              </p>
              <p className="text-muted-foreground">Último clique: {new Date(detailRow.last).toLocaleString("pt-BR")}</p>
              {detailRow.link ? (
                <p className="break-all text-muted-foreground">Link externo cadastrado: {detailRow.link}</p>
              ) : null}
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={detailSeries}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="day" fontSize={12} />
                    <YAxis allowDecimals={false} fontSize={12} />
                    <Tooltip />
                    <Line type="monotone" dataKey="cliques" stroke="var(--color-primary)" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
