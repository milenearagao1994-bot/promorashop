import { Link, useNavigate } from "@tanstack/react-router";
import { Menu, MessageCircleHeart, Search, TicketPercent } from "lucide-react";
import { useState, type FormEvent } from "react";

import { Logo } from "@/components/site/Logo";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const links = [
  { to: "/produtos", label: "Achadinhos" },
  { to: "/cupons", label: "Cupons" },
  { to: "/vivi", label: "Vivi" },
  { to: "/sobre", label: "Sobre" },
] as const;

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [term, setTerm] = useState("");
  const navigate = useNavigate();

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const q = term.trim();
    navigate({ to: "/produtos", search: q ? { q } : {} });
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/90 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-x-3 gap-y-2 px-4 py-2.5 md:flex-nowrap md:py-3">
        <Logo size="sm" className="shrink-0 md:[&_img]:h-10" />

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="ml-auto md:hidden" aria-label="Abrir menu">
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

        <div className="order-last flex w-full items-center gap-2 md:order-none md:ml-4 md:flex-1">
          <form onSubmit={submit} role="search" className="flex h-11 flex-1 items-center rounded-full border-2 border-primary/40 bg-card pl-4 pr-1 shadow-soft transition focus-within:border-primary">
            <input
              value={term}
              onChange={(event) => setTerm(event.target.value)}
              placeholder="Buscar na PromoraShop"
              aria-label="Buscar na PromoraShop"
              maxLength={120}
              className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
            <button type="submit" aria-label="Pesquisar" className="flex h-8 w-11 items-center justify-center rounded-full bg-primary text-primary-foreground transition hover:opacity-90">
              <Search className="size-4" />
            </button>
          </form>
          <Link to="/cupons" aria-label="Cupons" className="flex size-11 shrink-0 flex-col items-center justify-center rounded-2xl text-primary transition hover:bg-secondary">
            <TicketPercent className="size-5" />
            <span className="text-[10px] font-semibold leading-none">Cupons</span>
          </Link>
          <Link to="/vivi" aria-label="Conversar com a Vivi" className="flex size-11 shrink-0 flex-col items-center justify-center rounded-2xl text-primary transition hover:bg-secondary">
            <MessageCircleHeart className="size-5" />
            <span className="text-[10px] font-semibold leading-none">Vivi</span>
          </Link>
        </div>

        <nav className="hidden items-center gap-1 lg:flex">
          {links.slice(0, 1).concat(links.slice(3)).map((link) => (
            <Link key={link.to} to={link.to} className="rounded-full px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-secondary hover:text-secondary-foreground" activeProps={{ className: "bg-secondary text-secondary-foreground" }}>
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
