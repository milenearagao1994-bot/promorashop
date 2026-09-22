import { supabase } from "@/integrations/supabase/client";

const MAX_EDGE = 1800;
const IMAGE_QUALITY = 0.86;

/** Reduces very large photos in the browser before upload, keeping good quality. */
async function compressImage(file: File): Promise<Blob> {
  if (!file.type.startsWith("image/") || file.type === "image/gif") return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
    if (scale === 1 && file.size < 900_000) return file;
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const context = canvas.getContext("2d");
    if (!context) return file;
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", IMAGE_QUALITY));
    bitmap.close();
    if (!blob || blob.size >= file.size) return file;
    return blob;
  } catch {
    return file;
  }
}

function safeName(name: string, type: string) {
  const base = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9.-]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60);
  const extension = type === "image/webp" && !base.endsWith(".webp") ? ".webp" : "";
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${base || "arquivo"}${extension}`;
}

/** Uploads one file to the media bucket and returns the public address to store. */
export async function uploadMedia(file: File, folder: string): Promise<string> {
  const payload = await compressImage(file);
  const path = `${folder}/${safeName(file.name, payload.type)}`;
  const { error } = await supabase.storage.from("media").upload(path, payload, {
    contentType: payload.type || file.type || "application/octet-stream",
    cacheControl: "3600",
    upsert: false,
  });
  if (error) throw new Error("Não foi possível enviar o arquivo. Tente novamente.");
  return `/api/public/media/${path}`;
}

export async function uploadManyMedia(files: File[], folder: string, onEach?: (done: number, total: number) => void) {
  const urls: string[] = [];
  for (const [index, file] of files.entries()) {
    urls.push(await uploadMedia(file, folder));
    onEach?.(index + 1, files.length);
  }
  return urls;
}
