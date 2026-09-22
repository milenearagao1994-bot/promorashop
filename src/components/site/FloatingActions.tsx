import { Link } from "@tanstack/react-router";
import { MessageCircle } from "lucide-react";

import viviAvatar from "@/assets/vivi-avatar.png.asset.json";

export function FloatingActions() {
  return (
    <div className="fixed bottom-20 right-3 z-40 flex flex-col items-center gap-3 md:bottom-24 md:right-5">
      <a href="https://wa.me/5571992600863" target="_blank" rel="noopener noreferrer" aria-label="Conversar pelo WhatsApp" title="WhatsApp" className="flex size-12 items-center justify-center rounded-full bg-card text-primary shadow-card ring-1 ring-border transition hover:-translate-y-0.5 hover:text-primary-glow">
        <MessageCircle className="size-6" />
      </a>
      <Link to="/vivi" aria-label="Conversar com a Vivi" title="Vivi" className="relative size-16 overflow-hidden rounded-full bg-secondary shadow-glow ring-2 ring-background transition hover:-translate-y-1">
        <img src={viviAvatar.url} alt="Vivi, assistente virtual da PromoraShop" className="size-full object-cover" />
        <span className="absolute bottom-1 right-1 size-3 rounded-full bg-primary ring-2 ring-background" />
      </Link>
    </div>
  );
}