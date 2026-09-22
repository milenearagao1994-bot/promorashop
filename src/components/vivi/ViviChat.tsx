"use client";

import { useChat } from "@ai-sdk/react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { DefaultChatTransport, type UIMessage } from "ai";
import { Search, Sparkles, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import vivi from "@/assets/vivi-avatar.png.asset.json";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
} from "@/components/ai-elements/prompt-input";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { Button } from "@/components/ui/button";
import { formatPrice, productsQuery, type Product } from "@/lib/promovip";

const STORAGE_KEY = "promorashop:vivi:v2";

const QUICK_PROMPTS = [
  "🛍️ Encontrar um produto",
  "🔥 Ver ofertas",
  "💰 Procurar por preço",
  "🎁 Sugestão de presente",
  "✨ O que está em alta?",
];

function messageText(message: UIMessage) {
  return message.parts.map((part) => (part.type === "text" ? part.text : "")).join("");
}

function parseAnswer(text: string) {
  const slugMatch = text.match(/PRODUTOS:\s*(.+)$/im);
  const slugs = slugMatch?.[1]?.split(",").map((value) => value.trim()).filter(Boolean) ?? [];
  const showHunt = text.includes("[[CACA]]");
  const clean = text.replace(/PRODUTOS:\s*.+$/im, "").replace(/\[\[CACA\]\]/g, "").trim();
  return { clean, slugs, showHunt };
}

export function ViviChat() {
  const { data: products = [] } = useQuery(productsQuery);
  const [initial, setInitial] = useState<UIMessage[] | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      setInitial(saved ? (JSON.parse(saved) as UIMessage[]) : []);
    } catch {
      setInitial([]);
    }
  }, []);

  if (!initial) return <div className="px-4 py-16 text-center text-muted-foreground">Carregando a Vivi…</div>;
  return <Chat initialMessages={initial} products={products} />;
}

function Chat({ initialMessages, products }: { initialMessages: UIMessage[]; products: Product[] }) {
  const [input, setInput] = useState("");
  const { messages, sendMessage, setMessages, status } = useChat({
    messages: initialMessages,
    transport: new DefaultChatTransport({ api: "/api/vivi" }),
    onError: () => toast.error("A Vivi não conseguiu responder agora. Tente novamente em instantes."),
  });
  const busy = status === "submitted" || status === "streaming";

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch {
      /* armazenamento indisponível */
    }
  }, [messages]);

  const send = (text: string) => {
    const value = text.trim();
    if (!value || busy) return;
    void sendMessage({ text: value });
    setInput("");
  };

  return (
    <div className="grid min-h-[calc(100vh-8rem)] lg:grid-cols-[260px_1fr]">
      <aside className="hidden border-r border-border bg-card p-5 lg:block">
        <Button variant="outline" className="w-full" onClick={() => setMessages([])}>
          <Trash2 />
          Limpar conversa
        </Button>
        <Button asChild variant="ghost" className="mt-2 w-full">
          <Link to="/caca-ao-desconto" search={{}}>
            <Search />
            Procurar desconto
          </Link>
        </Button>
        <p className="mt-6 text-xs leading-5 text-muted-foreground">
          A conversa fica somente neste navegador. Sobre produtos, preços e cupons, a Vivi usa apenas o catálogo real da PromoraShop.
        </p>
      </aside>

      <section className="flex min-h-0 flex-col">
        <header className="border-b border-border bg-card/80 px-4 py-3">
          <div className="mx-auto flex max-w-3xl items-center gap-3">
            <img src={vivi.url} alt="Vivi, assistente virtual" className="size-12 rounded-full bg-secondary object-cover object-top" />
            <div>
              <h1 className="font-display font-semibold">Vivi</h1>
              <p className="text-xs text-muted-foreground">Assistente virtual da PromoraShop</p>
            </div>
          </div>
        </header>

        <Conversation className="flex-1">
          <ConversationContent className="mx-auto w-full max-w-3xl">
            {messages.length === 0 ? (
              <div className="py-8 text-center">
                <img src={vivi.url} alt="Vivi" className="mx-auto h-40 w-40 rounded-full object-cover object-top" />
                <h2 className="mt-4 font-display text-2xl font-bold">Oi, eu sou a Vivi! 💜</h2>
                <p className="mt-2 text-muted-foreground">Podemos conversar, escolher um presente ou procurar um achadinho.</p>
                <div className="mt-6 flex flex-wrap justify-center gap-2">
                  {QUICK_PROMPTS.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => send(item)}
                      className="rounded-full border border-border bg-card px-4 py-2 text-sm transition hover:border-primary hover:text-primary"
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((message) => {
                if (message.role === "user") {
                  return (
                    <Message from="user" key={message.id}>
                      <MessageContent>{messageText(message)}</MessageContent>
                    </Message>
                  );
                }
                const { clean, slugs, showHunt } = parseAnswer(messageText(message));
                const suggested = slugs
                  .map((slug) => products.find((product) => product.slug === slug))
                  .filter((product): product is Product => Boolean(product))
                  .slice(0, 3);
                return (
                  <Message from="assistant" key={message.id}>
                    <MessageContent className="bg-transparent p-0">
                      <MessageResponse>{clean}</MessageResponse>
                      {suggested.length ? (
                        <div className="mt-3 grid gap-2 sm:grid-cols-3">
                          {suggested.map((product) => (
                            <Link
                              key={product.id}
                              to="/produto/$slug"
                              params={{ slug: product.slug }}
                              className="rounded-lg border border-border bg-card p-3 transition hover:border-primary"
                            >
                              {product.image_url ? (
                                <img src={product.image_url} alt="" className="mb-2 aspect-square w-full rounded object-cover" />
                              ) : null}
                              <p className="line-clamp-2 text-sm font-semibold">{product.title}</p>
                              <p className="mt-1 text-xs text-muted-foreground">{product.stores?.name ?? "Loja parceira"}</p>
                              <p className="mt-1 text-xs font-semibold text-primary">
                                {product.price === null ? "Ver na loja" : formatPrice(product.price, product.currency)}
                              </p>
                              <span className="mt-2 inline-block text-xs font-semibold text-primary">Ver produto →</span>
                            </Link>
                          ))}
                        </div>
                      ) : null}
                      {showHunt ? (
                        <Button asChild size="sm" className="mt-3">
                          <Link to="/caca-ao-desconto" search={{}}>
                            <Search /> 🔎 Procurar desconto
                          </Link>
                        </Button>
                      ) : null}
                    </MessageContent>
                  </Message>
                );
              })
            )}
            {status === "submitted" ? <Shimmer>Pensando…</Shimmer> : null}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>

        <footer className="border-t border-border bg-background/95 p-4">
          <div className="mx-auto max-w-3xl">
            <PromptInput
              onSubmit={(_message, event) => {
                event.preventDefault();
                send(input);
              }}
            >
              <PromptInputTextarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Conte o que você procura ou só diga oi 💜"
              />
              <PromptInputFooter className="justify-end">
                <PromptInputSubmit status={status} disabled={busy || input.trim().length === 0} />
              </PromptInputFooter>
            </PromptInput>
            <p className="mt-2 text-center text-[11px] text-muted-foreground">
              <Sparkles className="mr-1 inline size-3" />
              Confirme preço e disponibilidade na loja parceira.
            </p>
          </div>
        </footer>
      </section>
    </div>
  );
}
