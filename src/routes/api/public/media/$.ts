import { createFileRoute } from "@tanstack/react-router";

/**
 * Serves files stored in the private "media" bucket through a stable public URL.
 * The handler only redirects to a short-lived signed URL; nothing is written here.
 */
export const Route = createFileRoute("/api/public/media/$")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const path = (params as { _splat?: string })._splat ?? "";
        if (!path || path.includes("..")) return new Response("Not found", { status: 404 });
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data, error } = await supabaseAdmin.storage.from("media").createSignedUrl(path, 3600);
        if (error || !data?.signedUrl) return new Response("Not found", { status: 404 });
        return new Response(null, {
          status: 302,
          headers: { Location: data.signedUrl, "Cache-Control": "public, max-age=1800" },
        });
      },
    },
  },
});
