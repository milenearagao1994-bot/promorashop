"use client";

import { ChevronDown, ChevronUp, Music2 } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";

const PLAYLIST_ID = "PLepg7gx3R7I0";

export function MusicPlayer() {
  const [expanded, setExpanded] = useState(false);

  return (
    <aside className="fixed bottom-4 left-4 z-40 w-[calc(100%-2rem)] max-w-sm overflow-hidden rounded-xl border border-border bg-card/95 shadow-card backdrop-blur md:left-auto md:right-4">
      <div className="flex h-14 items-center gap-3 px-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary">
          <Music2 className="size-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">Playlist PromoVip</p>
          <p className="truncate text-xs text-muted-foreground">Dê o play quando quiser</p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={expanded ? "Minimizar player" : "Expandir player"}
          onClick={() => setExpanded((value) => !value)}
        >
          {expanded ? <ChevronDown /> : <ChevronUp />}
        </Button>
      </div>
      {expanded ? (
        <div className="aspect-video border-t border-border bg-muted">
          <iframe
            className="size-full"
            src={`https://www.youtube-nocookie.com/embed/videoseries?list=${PLAYLIST_ID}`}
            title="Playlist PromoVip no YouTube"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      ) : null}
    </aside>
  );
}