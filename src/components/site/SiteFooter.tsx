import { Link } from "@tanstack/react-router";
import { Heart } from "lucide-react";

import { Logo } from "@/components/site/Logo";

export function SiteFooter() {
  return (
    <footer className="mt-20 bg-night-gradient text-primary-foreground">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-12 md:flex-row md:items-center md:justify-between">
        <div className="max-w-sm space-y-3">
          <div className="rounded-2xl bg-white/10 p-3 w-fit backdrop-blur">
            <Logo size="sm" />
          </div>
          <p className="text-sm text-primary-foreground/80">
            Sua plataforma de ofertas, descobertas e compras inteligentes. A PromoVip não vende nem
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
          <Link to="/auth" className="text-primary-foreground/60 transition hover:text-primary-foreground">
            Acesso da administradora
          </Link>
        </div>
      </div>

      <div className="border-t border-white/10 px-4 py-5 text-center text-xs text-primary-foreground/70">
        <span className="inline-flex items-center gap-1.5">
          PromoVip © {new Date().getFullYear()} · feito com <Heart className="size-3.5" /> para quem
          ama um achadinho
        </span>
      </div>
    </footer>
  );
}
