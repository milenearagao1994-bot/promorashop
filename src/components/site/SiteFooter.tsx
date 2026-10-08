import { Link } from "@tanstack/react-router";
import { Facebook, Heart, MessageCircle } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="mt-20 bg-night-gradient text-primary-foreground">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-8 md:flex-row md:items-center md:justify-between">
        <div className="max-w-sm space-y-3">
          <p className="text-sm text-primary-foreground/80">
            Sua plataforma de ofertas, descobertas e compras inteligentes. A PromoraShop não vende nem
            processa pagamentos: indicamos e você finaliza na loja parceira.
          </p>
        </div>

        <div className="flex flex-col gap-2 text-sm">
          <Link to="/produtos" className="text-primary-foreground/80 transition hover:text-primary-foreground">
            Achadinhos
          </Link>
          <Link to="/cupons" className="text-primary-foreground/80 transition hover:text-primary-foreground">
            Cupons
          </Link>
          <Link to="/vivi" className="text-primary-foreground/80 transition hover:text-primary-foreground">
            Assistente Vivi
          </Link>
          <Link to="/sobre" className="text-primary-foreground/80 transition hover:text-primary-foreground">
            Sobre e transparência
          </Link>
          <div className="flex gap-4">
            <Link to="/privacidade" className="text-primary-foreground/70 transition hover:text-primary-foreground">Privacidade</Link>
            <Link to="/termos" className="text-primary-foreground/70 transition hover:text-primary-foreground">Termos</Link>
          </div>
          <Link to="/admin/login" className="text-primary-foreground/60 transition hover:text-primary-foreground">
            Acesso da administradora
          </Link>
          <div className="mt-2 flex gap-3">
            <a href="https://wa.me/5571992600863" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp da PromoraShop" className="text-primary-foreground/80 transition hover:text-primary-foreground"><MessageCircle className="size-5" /></a>
            <a href="https://www.facebook.com/PromoraShop.ofc?mibextid=wwXIfr" target="_blank" rel="noopener noreferrer" aria-label="Facebook da PromoraShop" className="text-primary-foreground/80 transition hover:text-primary-foreground"><Facebook className="size-5" /></a>
          </div>
        </div>
      </div>

      <div className="border-t border-primary-foreground/10 px-4 py-3 text-center text-xs text-primary-foreground/70">
        <span className="inline-flex items-center gap-1.5">
          PromoraShop © {new Date().getFullYear()} · feito com <Heart className="size-3.5" aria-hidden="true" /> para quem
          ama um achadinho
        </span>
      </div>
    </footer>
  );
}
