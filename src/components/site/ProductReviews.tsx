"use client";

import { useQuery } from "@tanstack/react-query";
import { ImagePlus, MessageCircleHeart, Star } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { ReviewStars } from "@/components/site/ReviewStars";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { uploadMedia } from "@/lib/media-upload";
import { productReviewsQuery, reviewAverage, type ProductReview } from "@/lib/promovip";

const SENT_KEY = "promorashop:reviews:sent";

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("pt-BR", { day: "numeric", month: "long" });
}

export function ProductReviews({ productId, productTitle }: { productId: string; productTitle: string }) {
  const reviews = useQuery(productReviewsQuery(productId));
  const [open, setOpen] = useState(false);
  const [zoom, setZoom] = useState<string | null>(null);
  const list = reviews.data ?? [];
  const average = reviewAverage(list);

  return (
    <section className="mt-14">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold">💬 O que estão falando</h2>
          {average === null ? (
            <p className="mt-2 text-sm text-muted-foreground">Ainda não há avaliações aprovadas para este achadinho.</p>
          ) : (
            <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
              <ReviewStars value={average} size="md" />
              <span className="font-semibold text-foreground">{average.toFixed(1).replace(".", ",")}</span>
              <span>
                · {list.length} {list.length === 1 ? "avaliação" : "avaliações"}
              </span>
            </div>
          )}
        </div>
        <Button variant="outline" className="rounded-full" onClick={() => setOpen(true)}>
          <MessageCircleHeart /> Deixar minha avaliação
        </Button>
      </div>

      <div className="mt-8 space-y-4">
        {list.map((review, index) => (
          <Bubble key={review.id} review={review} align={index % 2 === 0 ? "start" : "end"} onZoom={setZoom} />
        ))}
      </div>

      <ReviewDialog
        open={open}
        productId={productId}
        productTitle={productTitle}
        onClose={() => setOpen(false)}
      />

      <Dialog open={Boolean(zoom)} onOpenChange={(value) => !value && setZoom(null)}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Foto da avaliação</DialogTitle>
          </DialogHeader>
          {zoom ? <img src={zoom} alt="Foto enviada na avaliação" className="max-h-[70vh] w-full rounded-xl object-contain" /> : null}
        </DialogContent>
      </Dialog>
    </section>
  );
}

function Bubble({
  review,
  align,
  onZoom,
}: {
  review: ProductReview;
  align: "start" | "end";
  onZoom: (url: string) => void;
}) {
  const isEnd = align === "end";
  return (
    <div className={`flex ${isEnd ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[min(32rem,100%)] rounded-3xl border px-5 py-4 shadow-soft ${
          isEnd ? "rounded-tr-md border-primary/20 bg-secondary/70" : "rounded-tl-md border-border bg-card"
        }`}
      >
        <div className="flex items-center gap-2">
          <span className="grid size-8 place-items-center rounded-full bg-brand-gradient text-xs font-semibold text-primary-foreground">
            {review.author_name.slice(0, 1).toUpperCase()}
          </span>
          <p className="font-medium">{review.author_name}</p>
        </div>
        <div className="mt-2">
          <ReviewStars value={review.rating} />
        </div>
        <p className="mt-3 whitespace-pre-line text-sm leading-6 text-foreground/90">{review.body}</p>
        {review.photo_url ? (
          <button
            type="button"
            onClick={() => onZoom(review.photo_url as string)}
            className="mt-3 block overflow-hidden rounded-xl border border-border"
          >
            <img src={review.photo_url} alt="Foto da avaliação" className="max-h-52 w-full object-cover" loading="lazy" />
          </button>
        ) : null}
        <p className="mt-3 text-xs text-muted-foreground">{formatDate(review.created_at)}</p>
      </div>
    </div>
  );
}

function ReviewDialog({
  open,
  productId,
  productTitle,
  onClose,
}: {
  open: boolean;
  productId: string;
  productTitle: string;
  onClose: () => void;
}) {
  const [rating, setRating] = useState(5);
  const [photo, setPhoto] = useState<File | null>(null);
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get("author_name") ?? "").trim().slice(0, 60);
    const body = String(form.get("body") ?? "").trim().slice(0, 1200);
    if (name.length < 2 || body.length < 3) {
      toast.error("Informe seu nome e escreva sua avaliação.");
      return;
    }
    if (typeof window !== "undefined") {
      const last = Number(window.localStorage.getItem(`${SENT_KEY}:${productId}`) ?? 0);
      if (Date.now() - last < 60_000) {
        toast.error("Aguarde um instante antes de enviar outra avaliação.");
        return;
      }
    }
    setSending(true);
    try {
      let photoUrl: string | null = null;
      if (photo) photoUrl = await uploadMedia(photo, "avaliacoes");
      const { error } = await supabase.from("product_reviews").insert({
        product_id: productId,
        author_name: name,
        body,
        rating,
        photo_url: photoUrl,
        source: "visitor",
        status: "pending",
      });
      if (error) throw error;
      if (typeof window !== "undefined") window.localStorage.setItem(`${SENT_KEY}:${productId}`, String(Date.now()));
      setDone(true);
    } catch {
      toast.error("Não foi possível enviar sua avaliação agora. Tente novamente.");
    } finally {
      setSending(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!value) {
          onClose();
          setDone(false);
          setPhoto(null);
          setRating(5);
        }
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{done ? "Avaliação enviada" : "Deixe sua avaliação"}</DialogTitle>
        </DialogHeader>
        {done ? (
          <div className="space-y-5">
            <p className="rounded-2xl bg-secondary/70 p-5 text-sm leading-6">
              Obrigada pela sua avaliação! 💜
              <br />
              Ela será analisada pela nossa equipe e, se aprovada, aparecerá na página do produto.
            </p>
            <Button className="w-full" onClick={onClose}>
              Fechar
            </Button>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <p className="text-sm text-muted-foreground">Sobre {productTitle}</p>
            <div className="space-y-2">
              <Label htmlFor="author_name">Seu nome</Label>
              <Input id="author_name" name="author_name" maxLength={60} required />
            </div>
            <div className="space-y-2">
              <Label>Sua nota</Label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button key={star} type="button" onClick={() => setRating(star)} aria-label={`${star} estrelas`}>
                    <Star className={`size-7 ${star <= rating ? "fill-primary text-primary" : "text-muted-foreground/40"}`} />
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="body">Sua avaliação</Label>
              <Textarea id="body" name="body" maxLength={1200} rows={4} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="review-photo" className="flex items-center gap-2">
                <ImagePlus className="size-4 text-primary" /> Foto (opcional)
              </Label>
              <Input
                id="review-photo"
                type="file"
                accept="image/*"
                onChange={(event) => setPhoto(event.target.files?.[0] ?? null)}
              />
            </div>
            <Button className="w-full" disabled={sending}>
              {sending ? "Enviando…" : "Enviar avaliação"}
            </Button>
            <p className="text-xs text-muted-foreground">
              Sua avaliação passa por análise antes de aparecer na página.
            </p>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
