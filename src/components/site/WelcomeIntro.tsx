"use client";

import { Music2 } from "lucide-react";
import { useEffect, useState } from "react";

const KEY = "promorashop:welcome:date";
export const INTRO_DONE_EVENT = "promorashop:intro-done";

function today() { const d = new Date(); return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`; }

/** Boas-vindas curta, no máximo uma vez por dia por dispositivo. */
export function WelcomeIntro() {
  const [show, setShow] = useState(false);
  const [step, setStep] = useState(0);
  const [leaving, setLeaving] = useState(false);
  useEffect(() => {
    let seen = false;
    try { seen = localStorage.getItem(KEY) === today(); localStorage.setItem(KEY, today()); } catch { seen = true; }
    if (seen) return;
    setShow(true);
    const timers = [setTimeout(() => setStep(1), 1300), setTimeout(() => setStep(2), 2600), setTimeout(() => setLeaving(true), 4000), setTimeout(() => { setShow(false); window.dispatchEvent(new Event(INTRO_DONE_EVENT)); }, 4500)];
    return () => timers.forEach(clearTimeout);
  }, []);
  if (!show) return null;
  const lines = ["✨ Seja muito bem-vindo(a) à PromoraShop", "Cupons • Promoções • Achadinhos • Um cantinho só seu 💜", "Solta o play 🎵\nBoas compras!"];
  return (
    <div role="status" aria-live="polite" className={`fixed inset-0 z-[60] flex flex-col items-center justify-center bg-soft-gradient px-6 text-center transition-opacity duration-500 ${leaving ? "opacity-0" : "opacity-100"}`}>
      <p key={step} className="animate-fade-in whitespace-pre-line font-display text-2xl font-bold leading-snug text-foreground md:text-4xl">
        {step === 0 ? <span className="text-brand-gradient">{lines[0]}</span> : lines[step]}
      </p>
      <div className="absolute bottom-10 flex size-11 items-center justify-center rounded-full bg-secondary text-primary shadow-card pulse"><Music2 className="size-5" aria-hidden="true" /></div>
    </div>
  );
}
