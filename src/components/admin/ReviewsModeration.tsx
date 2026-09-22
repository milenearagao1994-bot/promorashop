"use client";

import { Check, Trash2, X } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { ReviewStars } from "@/components/site/ReviewStars";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import type { Product, ProductReview, ReviewStatus } from "@/lib/promovip";

const ALL = "__all__";
const LABEL: Record<ReviewStatus, string> = { pending: "Pendentes", approved: "Aprovadas", rejected: "Rejeitadas" };

export function ReviewsModeration({
  reviews,
  products,
  onChanged,
}: {
  reviews: ProductReview[];
  products: Product[];
  onChanged: () => Promise<unknown>;
}) {
  const [status, setStatus] = useState<ReviewStatus>("pending");
  const [productId, setProductId] = useState<string>(ALL);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const filtered = useMemo(
    () =>
      reviews.filter((review) => {
        if (review.status !== status) return false;
        if (productId !== ALL && review.product_id !== productId) return false;
        const date = review.created_at.slice(0, 10);
        if (from && date < from) return false;
        if (to && date > to) return false;
        return true;
      }),
    [reviews, status, productId, from, to],
  );

  async function setReviewStatus(id: string, next: ReviewStatus) {
    const { error } = await supabase.from("product_reviews").update({ status: next }).eq("id", id);
    if (error) {
      toast.error("Não foi possível atualizar a avaliação.");
      return;
    }
    toast.success(next === "approved" ? "Avaliação aprovada." : "Avaliação rejeitada.");
    await onChanged();
  }

  async function remove(id: string) {
    if (!window.confirm("Excluir esta avaliação permanentemente?")) return;
    const { error } = await supabase.from("product_reviews").delete().eq("id", id);
    if (error) {
      toast.error("Não foi possível excluir a avaliação.");
      return;
    }
    toast.success("Avaliação excluída.");
    await onChanged();
  }

  const counts = {
    pending: reviews.filter((review) => review.status === "pending").length,
    approved: reviews.filter((review) => review.status === "approved").length,
    rejected: reviews.filter((review) => review.status === "rejected").length,
  };

  return (
    <div className="mt-4 space-y-4 rounded-lg border border-border bg-card p-5">
      <div className="flex flex-wrap gap-2">
        {(Object.keys(LABEL) as ReviewStatus[]).map((key) => (
          <Button key={key} size="sm" variant={status === key ? "default" : "outline"} onClick={() => setStatus(key)}>
            {LABEL[key]} ({counts[key]})
          </Button>
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="space-y-2">
          <Label>Produto</Label>
          <Select value={productId} onValueChange={setProductId}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Todos os produtos</SelectItem>
              {products.map((product) => (
                <SelectItem key={product.id} value={product.id}>
                  {product.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="review-from">De</Label>
          <Input id="review-from" type="date" value={from} onChange={(event) => setFrom(event.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="review-to">Até</Label>
          <Input id="review-to" type="date" value={to} onChange={(event) => setTo(event.target.value)} />
        </div>
      </div>

      <div className="divide-y divide-border">
        {filtered.length === 0 ? <p className="py-8 text-sm text-muted-foreground">Nenhuma avaliação nesta situação.</p> : null}
        {filtered.map((review) => (
          <div key={review.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 space-y-1">
              <p className="text-xs text-muted-foreground">
                {products.find((product) => product.id === review.product_id)?.title ?? "Produto"} ·{" "}
                {new Date(review.created_at).toLocaleString("pt-BR")} ·{" "}
                {review.source === "admin" ? "Adicionada pela administradora" : "Enviada por visitante"}
              </p>
              <p className="font-medium">{review.author_name}</p>
              <ReviewStars value={review.rating} />
              <p className="whitespace-pre-line text-sm text-muted-foreground">{review.body}</p>
              {review.photo_url ? (
                <a href={review.photo_url} target="_blank" rel="noopener noreferrer">
                  <img src={review.photo_url} alt="Foto da avaliação" className="mt-2 max-h-32 rounded-lg border border-border object-cover" />
                </a>
              ) : null}
            </div>
            <div className="flex shrink-0 gap-1">
              {review.status !== "approved" ? (
                <Button variant="ghost" size="icon-sm" aria-label="Aprovar" title="Aprovar" onClick={() => void setReviewStatus(review.id, "approved")}>
                  <Check />
                </Button>
              ) : null}
              {review.status !== "rejected" ? (
                <Button variant="ghost" size="icon-sm" aria-label="Rejeitar" title="Rejeitar" onClick={() => void setReviewStatus(review.id, "rejected")}>
                  <X />
                </Button>
              ) : null}
              <Button variant="ghost" size="icon-sm" aria-label="Excluir" title="Excluir" onClick={() => void remove(review.id)}>
                <Trash2 />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
