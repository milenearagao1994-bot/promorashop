"use client";

import { ChevronLeft, ChevronRight, ImageIcon, Play, ZoomIn } from "lucide-react";
import { useRef, useState } from "react";

type Slide = { kind: "image"; url: string } | { kind: "video"; url: string; embedded: boolean };

export function ProductGallery({ images, videoUrl, title }: { images: string[]; videoUrl?: string | null; title: string }) {
  const slides: Slide[] = [
    ...images.map((url) => ({ kind: "image" as const, url })),
    ...(videoUrl ? [{ kind: "video" as const, url: videoUrl, embedded: videoUrl.includes("youtube-nocookie.com/embed/") }] : []),
  ];
  const [index, setIndex] = useState(0);
  const [zoom, setZoom] = useState(false);
  const touchStart = useRef<number | null>(null);
  const current = slides[index];

  if (slides.length === 0) {
    return (
      <div className="flex aspect-[4/3] items-center justify-center rounded-xl bg-muted">
        <ImageIcon className="size-10 text-muted-foreground" aria-hidden="true" />
      </div>
    );
  }

  const go = (next: number) => { setZoom(false); setIndex((next + slides.length) % slides.length); };

  return (
    <div className="space-y-3">
      <div
        className="relative overflow-hidden rounded-xl bg-muted"
        onTouchStart={(event) => { touchStart.current = event.touches[0]?.clientX ?? null; }}
        onTouchEnd={(event) => {
          const start = touchStart.current;
          const end = event.changedTouches[0]?.clientX;
          touchStart.current = null;
          if (start === null || end === undefined || Math.abs(end - start) < 40) return;
          go(end < start ? index + 1 : index - 1);
        }}
      >
        {current?.kind === "video" ? current.embedded ? (
          <iframe
            className="aspect-video w-full"
            src={current.url}
            title={`Vídeo de ${title}`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        ) : (
          <video className="aspect-video w-full object-contain" src={current.url} controls playsInline preload="metadata">
            Seu navegador não conseguiu reproduzir este vídeo.
          </video>
        ) : current ? (
          <button
            type="button"
            onClick={() => setZoom((value) => !value)}
            aria-label={zoom ? "Reduzir imagem" : "Ampliar imagem"}
            className="block w-full cursor-zoom-in"
          >
            <img
              src={current.url}
              alt={`${title} — imagem ${index + 1}`}
              className={`aspect-[4/3] w-full object-contain transition duration-300 ${zoom ? "scale-150" : "scale-100"}`}
            />
          </button>
        ) : null}

        {slides.length > 1 ? (
          <>
            <button type="button" onClick={() => go(index - 1)} aria-label="Imagem anterior" className="absolute left-2 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-card/90 text-foreground shadow-soft transition hover:bg-card">
              <ChevronLeft className="size-4" />
            </button>
            <button type="button" onClick={() => go(index + 1)} aria-label="Próxima imagem" className="absolute right-2 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-card/90 text-foreground shadow-soft transition hover:bg-card">
              <ChevronRight className="size-4" />
            </button>
          </>
        ) : null}
        {current?.kind === "image" ? (
          <span className="pointer-events-none absolute bottom-2 right-2 flex items-center gap-1 rounded-full bg-card/85 px-2 py-1 text-[11px] text-muted-foreground">
            <ZoomIn className="size-3" /> Toque para ampliar
          </span>
        ) : null}
      </div>

      {slides.length > 1 ? (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {slides.map((slide, position) => (
            <button
              key={`${slide.kind}-${slide.url}`}
              type="button"
              onClick={() => go(position)}
              aria-label={slide.kind === "video" ? "Ver vídeo" : `Ver imagem ${position + 1}`}
              className={`relative size-16 shrink-0 overflow-hidden rounded-lg border bg-muted transition ${position === index ? "border-primary ring-2 ring-primary/30" : "border-border hover:border-primary/50"}`}
            >
              {slide.kind === "video" ? (
                <span className="flex size-full flex-col items-center justify-center gap-1 text-[10px] font-semibold text-primary">
                  <Play className="size-4" /> Vídeo
                </span>
              ) : (
                <img src={slide.url} alt="" className="size-full object-cover" />
              )}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
