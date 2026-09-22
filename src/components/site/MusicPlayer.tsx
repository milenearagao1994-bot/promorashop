"use client";

import { ChevronDown, ChevronUp, Music2, Pause, Play, SkipBack, SkipForward, Volume2, VolumeX } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";

const PLAYLIST_ID = "PLepg7gx3R7I0";

export function MusicPlayer() {
  const [expanded, setExpanded] = useState(false);
  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [title, setTitle] = useState("Playlist PromoraShop");
  const player = useRef<{ playVideo:()=>void; pauseVideo:()=>void; nextVideo:()=>void; previousVideo:()=>void; mute:()=>void; unMute:()=>void; getVideoData:()=>{title?:string} } | null>(null);
  useEffect(() => {
    const create = () => {
      const YT = (window as unknown as {YT?:{Player:new(id:string,options:unknown)=>typeof player.current}}).YT;
      if (!YT || player.current) return;
      player.current = new YT.Player("promorashop-youtube-player", { height:"200", width:"356", playerVars:{listType:"playlist",list:PLAYLIST_ID,playsinline:1}, events:{ onReady:()=>setReady(true), onStateChange:(event:{data:number})=>{setPlaying(event.data===1); const name=player.current?.getVideoData().title; if(name)setTitle(name);} } });
    };
    const win=window as unknown as {YT?:unknown;onYouTubeIframeAPIReady?:()=>void};
    if(win.YT) create(); else { const script=document.createElement("script"); script.src="https://www.youtube.com/iframe_api"; document.head.appendChild(script); win.onYouTubeIframeAPIReady=create; }
  }, []);

  return (
    <aside className="fixed bottom-3 left-3 z-40 w-[calc(100%-6.5rem)] max-w-sm overflow-hidden rounded-xl border border-border bg-card/95 shadow-card backdrop-blur md:bottom-5 md:left-5 md:w-96">
      <div className="flex h-14 items-center gap-3 px-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary">
          <Music2 className="size-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">{title}</p>
          <p className="truncate text-xs text-muted-foreground">Playlist oficial · YouTube</p>
        </div>
        <Button type="button" variant="ghost" size="icon-sm" disabled={!ready} aria-label="Faixa anterior" onClick={()=>player.current?.previousVideo()}><SkipBack /></Button>
        <Button type="button" variant="ghost" size="icon-sm" disabled={!ready} aria-label={playing?"Pausar":"Reproduzir"} onClick={()=>playing?player.current?.pauseVideo():player.current?.playVideo()}>{playing?<Pause/>:<Play/>}</Button>
        <Button type="button" variant="ghost" size="icon-sm" disabled={!ready} aria-label="Próxima faixa" onClick={()=>player.current?.nextVideo()}><SkipForward /></Button>
        <Button type="button" variant="ghost" size="icon-sm" disabled={!ready} aria-label={muted?"Ativar som":"Silenciar"} onClick={()=>{if(muted)player.current?.unMute();else player.current?.mute();setMuted(!muted)}}>{muted?<VolumeX/>:<Volume2/>}</Button>
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
      <div className={`${expanded ? "aspect-video" : "h-px overflow-hidden opacity-0"} border-t border-border bg-muted`}><div id="promorashop-youtube-player" className="size-full" /></div>
    </aside>
  );
}