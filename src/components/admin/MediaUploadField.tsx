"use client";

import { Trash2, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { uploadMedia } from "@/lib/media-upload";

/**
 * Single image or video field. The administrator picks a file from the device
 * (gallery on mobile, file explorer on desktop) and the stored address goes to
 * the form through a hidden input.
 */
export function MediaUploadField({
  label,
  name,
  kind,
  folder,
  defaultValue = null,
  helper,
}: {
  label: string;
  name: string;
  kind: "image" | "video";
  folder: string;
  defaultValue?: string | null;
  helper?: string;
}) {
  const [value, setValue] = useState<string>(defaultValue ?? "");
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function pick(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      setValue(await uploadMedia(file, folder));
      toast.success("Arquivo enviado.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível enviar o arquivo.");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {helper ? <p className="text-xs text-muted-foreground">{helper}</p> : null}
      <input type="hidden" name={name} value={value} />
      {value ? (
        <div className="flex items-center gap-3 rounded-lg border border-border p-2">
          {kind === "image" ? (
            <img src={value} alt="" className="size-16 rounded object-cover" />
          ) : (
            <video src={value} className="size-16 rounded object-cover" muted playsInline />
          )}
          <p className="min-w-0 flex-1 truncate text-xs text-muted-foreground">{value}</p>
          <Button type="button" variant="ghost" size="icon-sm" aria-label="Remover" onClick={() => setValue("")}>
            <Trash2 />
          </Button>
        </div>
      ) : null}
      <div className="flex flex-wrap items-center gap-2">
        <Input
          ref={inputRef}
          type="file"
          accept={kind === "image" ? "image/*" : "video/*"}
          disabled={busy}
          onChange={(event) => void pick(event.target.files)}
          className="max-w-xs"
        />
        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
          <Upload className="size-3" />
          {busy ? "Enviando…" : kind === "image" ? "Imagem do dispositivo" : "Vídeo do dispositivo"}
        </span>
      </div>
      <Input
        value={value}
        placeholder="Ou cole um endereço https://…"
        aria-label={`Endereço em ${label}`}
        onChange={(event) => setValue(event.target.value)}
      />
    </div>
  );
}
