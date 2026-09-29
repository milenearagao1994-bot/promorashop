import { useState } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { autoDiscount } from "@/lib/promovip";

export function PriceDiscountFields({ price, original, mode, percent }: { price?: number | null; original?: number | null; mode?: "auto" | "manual"; percent?: number | null }) {
  const [p, setP] = useState(price == null ? "" : String(price));
  const [o, setO] = useState(original == null ? "" : String(original));
  const [m, setM] = useState<"auto" | "manual">(mode ?? "auto");
  const [manual, setManual] = useState(percent == null ? "" : String(percent));
  const auto = autoDiscount(p === "" ? null : Number(p), o === "" ? null : Number(o));

  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="price">Preço final · Obrigatório</Label>
        <Input id="price" name="price" type="number" step="0.01" min="0" value={p} onChange={(e) => setP(e.target.value)} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="original_price">Preço anterior · Opcional</Label>
        <Input id="original_price" name="original_price" type="number" step="0.01" min="0" value={o} onChange={(e) => setO(e.target.value)} />
      </div>
      <fieldset className="space-y-2 rounded-lg border border-border p-3 sm:col-span-2">
        <legend className="px-1 text-sm font-medium">Percentual de desconto · Opcional</legend>
        <input type="hidden" name="discount_mode" value={m} />
        <label className="flex items-center gap-2 text-sm">
          <input type="radio" checked={m === "auto"} onChange={() => setM("auto")} /> Automático — calcular pelo preço anterior e preço final
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="radio" checked={m === "manual"} onChange={() => { if (manual === "" && auto != null) setManual(String(auto)); setM("manual"); }} /> Manual — informar o percentual
        </label>
        {m === "auto" ? (
          <p className="text-sm text-muted-foreground">{auto == null ? "Sem desconto (preencha um preço anterior maior que o preço final)." : `Desconto calculado: ${auto}% OFF`}</p>
        ) : (
          <div className="flex items-center gap-2">
            <Input name="discount_percent" type="number" step="0.01" min="0.01" max="99.99" value={manual} onChange={(e) => setManual(e.target.value)} className="w-32" aria-label="Percentual manual" />
            <span className="text-sm">% OFF</span>
          </div>
        )}
      </fieldset>
    </>
  );
}
