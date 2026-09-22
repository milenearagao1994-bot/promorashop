"use client";

import { useNavigate } from "@tanstack/react-router";
import { MessageCircle, X } from "lucide-react";
import { useEffect, useState } from "react";

import viviAvatar from "@/assets/vivi-avatar.png.asset.json";

const HIDDEN_KEY = "promorashop:vivi:hidden";

export function FloatingActions({ hideVivi = false }: { hideVivi?: boolean }) {
  const navigate = useNavigate();
  const [closed, setClosed] = useState(false);

  useEffect(() => {
    try {
      setClosed(localStorage.getItem(HIDDEN_KEY) === "1");
    } catch {
      /* storage indisponível */
    }
  }, []);

  function close() {
    setClosed(true);
    try {
      localStorage.setItem(HIDDEN_KEY, "1");
    } catch {
      /* storage indisponível */
    }
  }

  async function reopen() {
    setClosed(false);
    try {
      localStorage.removeItem(HIDDEN_KEY);
    } catch {
      /* storage indisponível */
    }
    await navigate({ to: "/vivi" });
  }

  if (hideVivi) return null;

  if (closed) {
    return (
      <button
        type="button"
        onClick={reopen}
        className="fixed bottom-20 right-3 z-40 animate-in fade-in zoom-in-95 rounded-full border border-primary/20 bg-card px-4 py-2.5 text-sm font-semibold text-primary shadow-card transition duration-300 hover:-translate-y-0.5 hover:border-primary md:bottom-24 md:right-5"
      >
        <MessageCircle className="mr-2 inline size-4" aria-hidden="true" />
        Falar com a Vivi
      </button>
    );
  }

  return (
    <div className="fixed bottom-20 right-3 z-40 animate-in fade-in zoom-in-95 duration-300 md:bottom-24 md:right-5">
      <button
        type="button"
        onClick={() => void navigate({ to: "/vivi" })}
        aria-label="Conversar com a Vivi"
        title="Falar com a Vivi"
        className="relative block size-16 overflow-hidden rounded-full bg-secondary shadow-glow ring-2 ring-background transition duration-300 hover:-translate-y-1"
      >
        <img src={viviAvatar.url} alt="Vivi, assistente virtual da PromoraShop" className="size-full object-cover" />
        <span className="absolute bottom-1 right-1 size-3 rounded-full bg-primary ring-2 ring-background" />
      </button>
      <button
        type="button"
        onClick={close}
        aria-label="Fechar a Vivi"
        title="Fechar"
        className="absolute -left-1 -top-1 flex size-6 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-soft transition hover:text-foreground"
      >
        <X className="size-3.5" aria-hidden="true" />
      </button>
    </div>
  );
}
