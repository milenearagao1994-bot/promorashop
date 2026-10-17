import { Link, useNavigate, useRouter, useRouterState } from "@tanstack/react-router";
import { ArrowLeft, Menu, MessageCircleHeart, Search, TicketPercent, Video, Users } from "lucide-react";
import { useState, type FormEvent } from "react";

import { Logo } from "@/components/site/Logo";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const links = [
  { to: "/produtos", label: "Achadinhos" },
  { to: "/cupons", label: "Cupons" },
  { to: "/promoravideos", label: "PromoraVídeos" },
  { to: "/vivi", label: "Vivi" },
  { to: "/afiliados", label: "Afiliados" },
  { to: "/sobre", label: "Sobre" },
] as const;

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [term, setTerm] = useState("");
  const navigate = useNavigate();
  const router = useRouter();
  const pathname = useRouterState({ select: (st) => st.location.pathname });
  const isHome = pathname === "/";
  function goBack() {
    if (typeof window !== "undefined" && window.history.length > 1 && document.referrer.startsWith(window.location.origin)) router.history.back();
    else if (typeof window !== "undefined" && (window.history.state as { idx?: number } | null)?.idx) router.history.back();
    else navigate({ to: "/" });
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const q = term.trim();
    navigate({ to: "/produtos", search: q ? { q } : {} });
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/90 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-x-3 gap-y-2 px-4 py-2.5 md:flex-nowrap md:py-3">
        {isHome ? null : (
          <>
            <Button variant="ghost" size="icon" onClick={goBack} aria-label="Voltar" className="shrink-0"><ArrowLeft /></Button>
            <Logo size="sm" className="shrink-0 md:[&_img]:h-10" />
          </>
        )}

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="ml-auto lg:hidden" aria-label="Abrir menu">
              <Menu />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-72">
            <div className="mt-8 flex flex-col gap-2">
              {links.map((link) => (
                <Link key={link.to} to={link.to} onClick={() => setOpen(false)} className="rounded-2xl px-4 py-3 text-base font-medium text-foreground transition hover:bg-secondary">
                  {link.label}
                </Link>
              ))}
            </div>
          </SheetContent>
        </Sheet>

        <div className="order-last flex w-full flex-wrap items-center justify-end gap-2 md:order-none md:ml-4 md:min-w-0 md:flex-1">
          <form onSubmit={submit} role="search" className="flex h-11 min-w-52 flex-1 items-center rounded-full border-2 border-primary/40 bg-card pl-4 pr-1 shadow-soft transition focus-within:border-primary">
            <input
              value={term}
              onChange={(event) => setTerm(event.target.value)}
              placeholder="Buscar na PromoraShop"
              aria-label="Buscar na PromoraShop"
              maxLength={120}
              className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
            <Button type="submit" aria-label="Pesquisar" size="icon" className="h-8 w-11 shrink-0 rounded-full">
              <Search className="size-4" />
            </Button>
          </form>
          <div className="grid w-full grid-cols-4 gap-2 md:flex md:w-auto md:shrink-0 md:gap-1" aria-label="Atalhos">
            {([
              { to: "/promoravideos", label: "PromoraVídeos", hint: "Produtos em vídeo", Icon: Video },
              { to: "/cupons", label: "Cupons", hint: "Descontos ativos", Icon: TicketPercent },
              { to: "/vivi", label: "Vivi", hint: "Sua assistente", Icon: MessageCircleHeart },
              { to: "/afiliados", label: "Afiliados", hint: "Exclusivo para afiliados", Icon: Users },
            ] as const).map(({ to, label, hint, Icon }) => (
              <Link key={to} to={to} aria-label={label} className="flex min-w-0 flex-col items-center gap-1 rounded-xl border border-primary/15 bg-card px-1 py-2 text-center text-primary shadow-soft transition hover:border-primary md:h-11 md:flex-col md:justify-center md:gap-1 md:border-0 md:bg-transparent md:px-2 md:py-0 md:shadow-none">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 md:size-auto md:bg-transparent"><Icon className="size-4 md:size-5" /></span>
                <span className="min-w-0">
                  <span className="block truncate text-[11px] font-bold leading-tight md:text-[10px] md:font-semibold md:leading-none">{label}</span>
                  <span className="hidden">{hint}</span>
                </span>
              </Link>
            ))}
          </div>
        </div>

        <nav className="hidden items-center gap-1 lg:flex">
          {links.filter((link) => link.to === "/produtos" || link.to === "/sobre").map((link) => (
            <Link key={link.to} to={link.to} className="rounded-full px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-secondary hover:text-secondary-foreground" activeProps={{ className: "bg-secondary text-secondary-foreground" }}>
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
