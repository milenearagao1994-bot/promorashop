"use client";

import { ArrowDown, ArrowUp, ImageIcon, Plus, Star, Trash2, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { uploadManyMedia } from "@/lib/media-upload";

/**
 * Lista ordenável de endereços de imagem com miniaturas.
 * O valor final é enviado no formulário em um campo oculto (um link por linha).
 */
export function MediaListField({
  label,
  name,
  defaultValue = [],
  helper,
  onPromote,
  folder,
}: {
  label: string;
  name: string;
  defaultValue?: string[];
  helper?: string;
  onPromote?: (url: string) => void;
  folder?: string;
}) {
  const [items, setItems] = useState<string[]>(defaultValue);
  const [draft, setDraft] = useState("");
  const [progress, setProgress] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const addFiles = async (files: FileList | null) => {
    const list = files ? Array.from(files) : [];
    if (!list.length) return;
    setProgress(`Enviando 0 de ${list.length}…`);
    try {
      const urls = await uploadManyMedia(list, folder ?? "produtos", (done, total) => setProgress(`Enviando ${done} de ${total}…`));
      setItems((current) => [...current, ...urls]);
      toast.success(urls.length > 1 ? `${urls.length} imagens enviadas.` : "Imagem enviada.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível enviar as imagens.");
    } finally {
      setProgress(null);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const move = (index: number, direction: -1 | 1) => {
    setItems((current) => {
      const next = [...current];
      const target = index + direction;
      if (target < 0 || target >= next.length) return current;
      const a = next[index];
      const b = next[target];
      if (a === undefined || b === undefined) return current;
      next[index] = b;
      next[target] = a;
      return next;
    });
  };

  return (
    <div className="space-y-3">
      <Label>{label}</Label>
      {helper ? <p className="text-xs text-muted-foreground">{helper}</p> : null}
      <input type="hidden" name={name} value={items.join("\n")} />
      <div className="space-y-2">
        {items.length === 0 ? <p className="text-xs text-muted-foreground">Nenhuma imagem adicionada.</p> : null}
        {items.map((url, index) => (
          <div key={`${url}-${index}`} className="flex items-center gap-2 rounded-lg border border-border p-2">
            <div className="size-12 shrink-0 overflow-hidden rounded bg-muted">
              {url ? <img src={url} alt="" className="size-full object-cover" /> : <ImageIcon className="m-3 size-6 text-muted-foreground" />}
            </div>
            <Input
              value={url}
              aria-label={`Endereço da imagem ${index + 1}`}
              onChange={(event) =>
                setItems((current) => current.map((item, position) => (position === index ? event.target.value : item)))
              }
            />
            <div className="flex shrink-0 gap-1">
              {onPromote ? (
                <Button type="button" variant="ghost" size="icon-sm" title="Definir como imagem principal" aria-label="Definir como imagem principal" onClick={() => onPromote(url)}>
                  <Star />
                </Button>
              ) : null}
              <Button type="button" variant="ghost" size="icon-sm" title="Subir" aria-label="Subir" onClick={() => move(index, -1)}>
                <ArrowUp />
              </Button>
              <Button type="button" variant="ghost" size="icon-sm" title="Descer" aria-label="Descer" onClick={() => move(index, 1)}>
                <ArrowDown />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                title="Remover"
                aria-label="Remover"
                onClick={() => setItems((current) => current.filter((_, position) => position !== index))}
              >
                <Trash2 />
              </Button>
            </div>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          disabled={Boolean(progress)}
          onChange={(event) => void addFiles(event.target.files)}
          className="max-w-xs"
        />
        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
          <Upload className="size-3" />
          {progress ?? "Adicionar imagens do dispositivo"}
        </span>
      </div>
      <div className="flex gap-2">
        <Input
          value={draft}
          placeholder="Ou cole um endereço https://…"
          aria-label={`Adicionar imagem em ${label}`}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key !== "Enter") return;
            event.preventDefault();
            const value = draft.trim();
            if (!value) return;
            setItems((current) => [...current, value]);
            setDraft("");
          }}
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            const value = draft.trim();
            if (!value) return;
            setItems((current) => [...current, value]);
            setDraft("");
          }}
        >
          <Plus />
          Adicionar
        </Button>
      </div>
    </div>
  );
}
