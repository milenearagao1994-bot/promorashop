import { createOpenAI } from "@ai-sdk/openai";
import { createClient } from "@supabase/supabase-js";
import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";

import {
  createLovableAiGatewayRunIdFetch,
  getLovableAiGatewayRunId,
  withLovableAiGatewayRunIdHeader,
} from "@/lib/ai-gateway.server";

type Body = { messages?: unknown };

function publicClient() {
  const url = process.env["SUPABASE_URL"];
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false },
    global: {
      fetch: (input: RequestInfo | URL, init?: RequestInit) => {
        const headers = new Headers(init?.headers);
        if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) headers.delete("Authorization");
        headers.set("apikey", key);
        return fetch(input, { ...init, headers });
      },
    },
  });
}

async function catalogContext() {
  const supabase = publicClient();
  if (!supabase) return "Catálogo indisponível neste momento.";
  const [products, coupons] = await Promise.all([
    supabase
      .from("products")
      .select("title,slug,short_description,price,original_price,currency,coupon_code,tags,editorial_rating,stores(name),categories(name)")
      .eq("active", true)
      .order("sort_order")
      .limit(200),
    supabase.from("coupons").select("title,code,discount_label,conditions,expires_at,stores(name)").eq("active", true).limit(60),
  ]);

  const productLines = (products.data ?? []).map((item) => {
    const row = item as Record<string, unknown> & { stores?: { name?: string } | null; categories?: { name?: string } | null };
    const price = typeof row["price"] === "number" ? `${row["price"]} ${String(row["currency"] ?? "BRL")}` : "preço não informado";
    const tags = Array.isArray(row["tags"]) ? (row["tags"] as string[]).join("/") : "";
    return `- slug:${String(row["slug"])} | ${String(row["title"])} | ${price} | loja:${row.stores?.name ?? "não informada"} | categoria:${row.categories?.name ?? "não informada"} | tags:${tags} | cupom:${row["coupon_code"] ?? "nenhum"} | ${String(row["short_description"] ?? "")}`;
  });

  const couponLines = (coupons.data ?? []).map((item) => {
    const row = item as Record<string, unknown> & { stores?: { name?: string } | null };
    return `- ${String(row["title"])} | código:${row["code"] ?? "sem código"} | ${row["discount_label"] ?? ""} | loja:${row.stores?.name ?? "não informada"} | validade:${row["expires_at"] ?? "não informada"} | condições:${row["conditions"] ?? "não informadas"}`;
  });

  return [
    productLines.length ? `PRODUTOS ATIVOS (${productLines.length}):\n${productLines.join("\n")}` : "PRODUTOS ATIVOS: nenhum cadastrado.",
    couponLines.length ? `CUPONS ATIVOS:\n${couponLines.join("\n")}` : "CUPONS ATIVOS: nenhum cadastrado.",
  ].join("\n\n");
}

export const Route = createFileRoute("/api/vivi")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { messages } = (await request.json()) as Body;
        if (!Array.isArray(messages)) return new Response("Mensagens obrigatórias", { status: 400 });

        const key = process.env["LOVABLE_API_KEY"];
        if (!key) return new Response("Assistente não configurada", { status: 500 });

        const catalog = await catalogContext();
        const initialRunId = getLovableAiGatewayRunId(request);
        const runIdFetch = createLovableAiGatewayRunIdFetch(initialRunId);
        const lovable = createOpenAI({
          baseURL: "https://ai.gateway.lovable.dev/v1",
          apiKey: key,
          headers: { "Lovable-API-Key": key, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
          fetch: runIdFetch.fetch,
        });

        const system = `Você é a Vivi, assistente virtual da PromoraShop — uma plataforma que reúne achadinhos, ofertas e cupons. A compra sempre acontece na loja parceira; a PromoraShop não vende nem processa pagamentos.

PERSONALIDADE: natural, simpática, acolhedora, divertida quando cabe, feminina e moderna. Use emojis com moderação (💜 ✨ 🛍️). Converse de verdade: se a pessoa disser "oi", "bom dia" ou "tudo bem?", responda como uma amiga, sem virar propaganda. Você pode conversar sobre assuntos gerais e trazer a PromoraShop de forma sutil e natural.

RECOMENDAÇÕES: pergunte apenas o que for necessário (orçamento, estilo, cor, se é presente). Se já houver informação suficiente, mostre as opções. Lembre-se do contexto da conversa (ex.: "bolsa" + "preta" + "até R$ 100" se combinam).

REGRA ABSOLUTA: ao falar de produtos, preços, cupons, descontos, disponibilidade, avaliações ou links da PromoraShop, use SOMENTE o catálogo abaixo. Nunca invente preço, cupom, desconto, disponibilidade, avaliação, característica, link ou promoção. Se não encontrar, diga: "Não encontrei essa informação no catálogo agora, mas posso procurar outras opções para você."

CAÇA AO DESCONTO: se a pessoa encontrou um produto fora da PromoraShop e quer saber de desconto, explique que ela pode enviar foto ou link pela Caça ao Desconto e inclua na resposta a marca [[CACA]] (uma vez).

SUGESTÕES DE PRODUTO: quando indicar produtos do catálogo, termine a mensagem com uma última linha exatamente no formato PRODUTOS: slug1, slug2 (até 3 slugs existentes no catálogo). Não escreva essa linha quando não estiver sugerindo produtos e nunca invente slugs.

CATÁLOGO REAL:
${catalog}`;

        const result = streamText({
          model: lovable.responses("openai/gpt-6-astra"),
          system,
          messages: await convertToModelMessages(messages as UIMessage[]),
          providerOptions: {
            openai: {
              forceReasoning: true,
              reasoningEffort: "low",
              reasoningSummary: "auto",
              store: false,
              include: ["reasoning.encrypted_content"],
            },
          },
        });

        return withLovableAiGatewayRunIdHeader(
          result.toUIMessageStreamResponse({ originalMessages: messages as UIMessage[] }),
          runIdFetch,
        );
      },
    },
  },
});
