import { Star } from "lucide-react";

export function ReviewStars({ value, size = "sm" }: { value: number; size?: "sm" | "md" }) {
  const dimension = size === "md" ? "size-5" : "size-4";
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${value} de 5 estrelas`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`${dimension} ${star <= Math.round(value) ? "fill-primary text-primary" : "text-muted-foreground/40"}`}
        />
      ))}
    </span>
  );
}
