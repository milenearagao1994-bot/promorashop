import { Link } from "@tanstack/react-router";

import logo from "@/assets/promorashop-logo.png.asset.json";
import { cn } from "@/lib/utils";

export function Logo({ className, size = "md" }: { className?: string; size?: "sm" | "md" | "lg" }) {
  const heights = { sm: "h-8", md: "h-10", lg: "h-16" };
  return (
    <Link to="/" className={cn("inline-flex items-center", className)} aria-label="PromoraShop">
      <img src={logo.url} alt="PromoraShop" className={cn(heights[size], "w-auto object-contain")} />
    </Link>
  );
}
