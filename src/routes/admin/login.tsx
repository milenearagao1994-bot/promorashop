import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { LockKeyhole } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Logo } from "@/components/site/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

const description = "Acesso restrito à administração da PromoraShop.";

export const Route = createFileRoute("/admin/login")({
  head: () => ({
    meta: [
      { title: "Administrador — PromoraShop" },
      { name: "description", content: description },
      { property: "og:title", content: "Administrador — PromoraShop" },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: Page,
});

function Page() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    const data = new FormData(event.currentTarget);
    const { error } = await supabase.auth.signInWithPassword({
      email: String(data.get("email") ?? "").trim(),
      password: String(data.get("password") ?? ""),
    });
    setLoading(false);
    if (error) {
      toast.error("E-mail ou senha incorretos.");
      return;
    }
    await navigate({ to: "/admin" });
  }

  return (
    <main className="grid min-h-screen place-items-center bg-soft-gradient px-4 py-10">
      <div className="w-full max-w-md rounded-3xl border border-primary/15 bg-card p-8 shadow-card">
        <Logo />
        <div className="mt-8 flex size-11 items-center justify-center rounded-xl bg-secondary text-primary">
          <LockKeyhole />
        </div>
        <h1 className="mt-4 font-display text-2xl font-bold tracking-tight">ADMINISTRADOR</h1>
        <form onSubmit={submit} className="mt-8 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" name="email" type="email" autoComplete="email" className="rounded-xl" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <Input id="password" name="password" type="password" autoComplete="current-password" className="rounded-xl" required />
          </div>
          <Button className="w-full rounded-xl" size="lg" disabled={loading}>
            {loading ? "Aguarde…" : "🔐 ENTRAR COM SEGURANÇA"}
          </Button>
        </form>
      </div>
    </main>
  );
}
