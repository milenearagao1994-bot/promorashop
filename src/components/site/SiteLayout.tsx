import type { ReactNode } from "react";

import { MusicPlayer } from "@/components/site/MusicPlayer";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
import { FloatingActions } from "@/components/site/FloatingActions";

export function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
      <FloatingActions />
      <MusicPlayer />
    </div>
  );
}
