"use client";

import { useRouterState } from "@tanstack/react-router";

import { FloatingActions } from "@/components/site/FloatingActions";
import { MusicPlayer } from "@/components/site/MusicPlayer";

/**
 * Mounted once in the root route so the music player keeps playing while the
 * visitor navigates between pages (no remount = no restart).
 */
export function SiteChrome() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const isPrivate = /^\/admin/.test(pathname);
  if (isPrivate) return null;
  return (
    <>
      <FloatingActions hideVivi={pathname.startsWith("/vivi")} />
      <MusicPlayer />
    </>
  );
}
