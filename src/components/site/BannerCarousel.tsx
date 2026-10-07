"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { bannerImages, youtubeEmbedUrl, type Banner } from "@/lib/promovip";

export function BannerCarousel({ banner, aspect }: { banner: Banner; aspect?: string }) {
  const images = bannerImages(banner);
  const video = banner.video_url ?? null;
  const embed = youtubeEmbedUrl(video);
  const isFileVideo = Boolean(video && !embed);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchStart = useRef<number | null>(null);
  const total = images.length;

  useEffect(() => {
    if (!banner.autoplay || total < 2 || paused) return;
    const timer = window.setInterval(() => setIndex((value) => (value + 1) % total), 5000);
    return () => window.clearInterval(timer);
  }, [banner.autoplay, total, paused]);

  return (
    <article
      className={`relative flex overflow-hidden rounded-2xl bg-night-gradient p-5 text-primary-foreground shadow-soft md:p-8 ${aspect ? "" : "min-h-52"}`}
      style={aspect ? { aspectRatio: aspect } : undefined}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={(event) => { touchStart.current = event.touches[0]?.clientX ?? null; }}
      onTouchEnd={(event) => {
        const start = touchStart.current;
        const end = event.changedTouches[0]?.clientX;
        touchStart.current = null;
        if (start === null || end === undefined || total < 2 || Math.abs(end - start) < 40) return;
        setIndex((value) => (value + (end < start ? 1 : total - 1)) % total);
      }}
    >
      {embed ? (
        <iframe className="absolute inset-0 size-full opacity-40" src={`${embed}?autoplay=${banner.autoplay ? 1 : 0}&mute=1&loop=1&playsinline=1`} title={banner.title} allow="autoplay; encrypted-media" />
      ) : isFileVideo ? (
        <video className="absolute inset-0 size-full object-cover opacity-40" src={video ?? undefined} muted playsInline loop autoPlay={banner.autoplay} preload="metadata" controls={!banner.autoplay} />
      ) : total ? (
        images.map((url, position) => (
          <img key={url} src={url} alt="" className={`absolute inset-0 size-full object-cover transition-opacity duration-500 ${position === index ? "opacity-30" : "opacity-0"}`} />
        ))
      ) : null}

      <div className="relative mt-auto max-w-md">
        {banner.title ? <h2 className="font-display text-xl font-bold drop-shadow md:text-3xl">{banner.title}</h2> : null}
        {banner.subtitle ? <p className="mt-2 text-sm text-primary-foreground/80">{banner.subtitle}</p> : null}
        {banner.link_url ? (
          <Button asChild variant="vip" className="mt-5">
            <a href={banner.link_url} target="_blank" rel="noopener noreferrer">{banner.link_label ?? "Saiba mais"}</a>
          </Button>
        ) : null}
      </div>

      {!embed && !isFileVideo && total > 1 ? (
        <>
          <button type="button" aria-label="Imagem anterior" onClick={() => setIndex((value) => (value + total - 1) % total)} className="absolute left-2 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-background/30 text-primary-foreground backdrop-blur transition hover:bg-background/50">
            <ChevronLeft className="size-4" />
          </button>
          <button type="button" aria-label="Próxima imagem" onClick={() => setIndex((value) => (value + 1) % total)} className="absolute right-2 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-background/30 text-primary-foreground backdrop-blur transition hover:bg-background/50">
            <ChevronRight className="size-4" />
          </button>
          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
            {images.map((url, position) => (
              <button key={url} type="button" aria-label={`Ir para imagem ${position + 1}`} onClick={() => setIndex(position)} className={`size-2 rounded-full transition ${position === index ? "bg-primary-foreground" : "bg-primary-foreground/40"}`} />
            ))}
          </div>
        </>
      ) : null}
    </article>
  );
}
