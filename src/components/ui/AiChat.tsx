"use client";

import { useState, useRef, useEffect } from "react";
import { useCartStore } from "../../store/cartStore";
import { MessageCircle, X, Send, ShoppingCart, ChefHat } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
  cartAction?: {
    action: string;
    product_id: string;
    product_name: string;
    price: number;
  } | null;
}

interface AiChatProps {
  locale: string;
}

const WELCOME: Record<string, string> = {
  it: "Ciao! 👋 Sono Maia, l'assistente di MA'N'GIA. Posso aiutarti a scoprire il menù, suggerire abbinamenti o aggiungere qualcosa al carrello. Come posso aiutarti?",
  es: "¡Hola! 👋 Soy Maia, la asistente de MA'N'GIA. Puedo ayudarte a descubrir el menú, sugerir combinaciones o agregar algo al carrito. ¿Cómo puedo ayudarte?",
  en: "Hi! 👋 I'm Maia, the MA'N'GIA assistant. I can help you explore the menu, suggest pairings or add something to your cart. How can I help you?",
};

const PLACEHOLDER: Record<string, string> = {
  it: "Scrivi un messaggio…",
  es: "Escribe un mensaje…",
  en: "Type a message…",
};

const ADD_LABEL: Record<string, string> = {
  it: "Aggiungi al carrello",
  es: "Agregar al carrito",
  en: "Add to cart",
};

const ADDED_LABEL: Record<string, string> = {
  it: "Aggiunto! ✓",
  es: "¡Agregado! ✓",
  en: "Added! ✓",
};

export function AiChat({ locale }: AiChatProps) {
  const [open, setOpen]         = useState(false);
  const [input, setInput]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [added, setAdded]       = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: WELCOME[locale] ?? WELCOME.it },
  ]);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLInputElement>(null);
  const addItem   = useCartStore((s) => s.addItem);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  async function send() {
    if (!input.trim() || loading) return;
    const userMsg: Message = { role: "user", content: input.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          locale,
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.text, cartAction: data.cartAction },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Mi dispiace, si è verificato un errore. Riprova!" },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleAddToCart(msg: Message) {
    if (!msg.cartAction) return;
    addItem({
      id:    msg.cartAction.product_id,
      name:  msg.cartAction.product_name,
      price: msg.cartAction.price,
    });
    setAdded(msg.cartAction.product_id);
    setTimeout(() => setAdded(null), 2000);
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-24 right-4 z-50 w-14 h-14 rounded-full bg-terracotta-500 text-white shadow-warm-lg flex items-center justify-center transition-transform hover:scale-105 active:scale-95"
        aria-label="AI Chat"
      >
        {open ? <X size={22} /> : <MessageCircle size={22} />}
      </button>

      {/* Chat panel */}
      {open && (
        <div
          className="fixed bottom-40 right-4 z-50 w-[calc(100vw-2rem)] max-w-sm bg-cream-100 rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-graphite-100"
          style={{ height: "420px" }}
        >
          {/* Header */}
          <div className="bg-terracotta-500 px-4 py-3 flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <ChefHat size={16} className="text-white" />
            </div>
            <div>
              <p className="text-white font-display font-semibold text-sm leading-tight">Maia</p>
              <p className="text-white/70 text-[10px]">AI · MA'N'GIA · sempre disponibile</p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-2">
            {messages.map((msg, i) => (
              <div key={i} className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}>
                <div
                  className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-terracotta-500 text-white rounded-br-sm"
                      : "bg-white text-graphite-800 shadow-sm rounded-bl-sm"
                  }`}
                >
                  {msg.content.replace(/\*\*(.*?)\*\*/g, '$1')}
                </div>
                {msg.cartAction && (
                  <button
                    onClick={() => handleAddToCart(msg)}
                    className={`mt-1.5 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                      added === msg.cartAction.product_id
                        ? "bg-olive-500 text-white"
                        : "bg-terracotta-100 text-terracotta-700 hover:bg-terracotta-200"
                    }`}
                  >
                    <ShoppingCart size={12} />
                    {added === msg.cartAction.product_id
                      ? ADDED_LABEL[locale] ?? ADDED_LABEL.it
                      : `${ADD_LABEL[locale] ?? ADD_LABEL.it} — €${msg.cartAction.price}`}
                  </button>
                )}
              </div>
            ))}
            {loading && (
              <div className="flex items-start">
                <div className="bg-white shadow-sm rounded-2xl rounded-bl-sm px-3 py-2">
                  <div className="flex gap-1 items-center h-4">
                    <span className="w-1.5 h-1.5 bg-terracotta-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-1.5 h-1.5 bg-terracotta-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-1.5 h-1.5 bg-terracotta-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="px-3 py-2 border-t border-graphite-100 flex gap-2 bg-white">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder={PLACEHOLDER[locale] ?? PLACEHOLDER.it}
              className="flex-1 text-sm bg-graphite-50 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-terracotta-300 text-graphite-800 placeholder:text-graphite-400"
            />
            <button
              onClick={send}
              disabled={!input.trim() || loading}
              className="w-9 h-9 rounded-xl bg-terracotta-500 text-white flex items-center justify-center disabled:opacity-40 transition-opacity"
            >
              <Send size={15} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}