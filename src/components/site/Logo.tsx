import { Link } from "@tanstack/react-router";

import logo from "@/assets/promovip-logo.png.asset.json";
import { cn } from "@/lib/utils";

export function Logo({ className, size = "md" }: { className?: string; size?: "sm" | "md" | "lg" }) {
  const heights = { sm: "h-8", md: "h-10", lg: "h-16" };
  return (
    <Link to="/" className={cn("inline-flex items-center", className)} aria-label="PromoVip">
      <img src={logo.url} alt="PromoVip" className={cn(heights[size], "w-auto")} />
    </Link>
  );
}
