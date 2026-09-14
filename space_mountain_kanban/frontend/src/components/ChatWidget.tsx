"use client";

import { useEffect, useRef, useState } from "react";
import { MessageCircle, Send, X } from "lucide-react";
import { useBoard } from "@/lib/board-context";
import type { ChatApiResponse, ChatMessage } from "@/lib/chat-types";

const GREETING: ChatMessage = {
  role: "assistant",
  content:
    "Woooo! I'm the stylin' and profilin' limosine riding kiss-stealing digital assistant. Ask me to add, update, move, or delete a card, or ask me about a task.",
};

export function ChatWidget() {
  const { dispatch } = useBoard();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([GREETING]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, isOpen]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || isSending) return;

    const userMessage: ChatMessage = { role: "user", content: text };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput("");
    setIsSending(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ messages: nextMessages }),
      });
      const data = (await res.json()) as ChatApiResponse;

      if (!res.ok || "error" in data) {
        const errorText = "error" in data ? data.error : "The assistant is unavailable right now.";
        setMessages((prev) => [...prev, { role: "assistant", content: `Sorry — ${errorText}` }]);
        return;
      }

      dispatch({ type: "HYDRATE_BOARD", board: data.board });
      setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry — I couldn't reach the assistant. Please try again." },
      ]);
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3">
      {isOpen && (
        <div className="flex w-80 h-96 flex-col rounded-2xl border-2 border-accent-yellow bg-black/90 backdrop-blur-md shadow-[0_0_30px_rgba(236,173,10,0.35)]">
          <div className="flex items-center justify-between px-4 py-3 border-b border-accent-yellow/40">
            <h2 className="text-sm font-bold uppercase tracking-wide text-accent-yellow">
              Digital Assistant
            </h2>
            <button
              type="button"
              aria-label="Close chat"
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-white"
            >
              <X size={16} />
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-2">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${
                  m.role === "user"
                    ? "self-end bg-purple-secondary text-white"
                    : "self-start bg-white/10 text-yellow-50 border border-accent-yellow/30"
                }`}
              >
                {m.content}
              </div>
            ))}
            {isSending && (
              <div className="self-start rounded-xl px-3 py-2 text-sm bg-white/10 text-yellow-50 border border-accent-yellow/30">
                Thinking…
              </div>
            )}
          </div>

          <form onSubmit={handleSend} className="flex items-center gap-2 p-3 border-t border-accent-yellow/40">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask the assistant…"
              className="flex-1 text-sm text-white bg-white/10 rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-accent-yellow placeholder:text-gray-400"
            />
            <button
              type="submit"
              disabled={!input.trim() || isSending}
              aria-label="Send message"
              className="shrink-0 bg-purple-secondary text-white rounded-lg p-2 hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      )}

      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        aria-label={isOpen ? "Close digital assistant" : "Open digital assistant"}
        className="h-14 w-14 rounded-full bg-gradient-to-br from-purple-secondary to-dark-navy border-2 border-accent-yellow shadow-[0_0_18px_rgba(236,173,10,0.6)] flex items-center justify-center text-accent-yellow hover:scale-105 transition-transform"
      >
        <MessageCircle size={24} />
      </button>
    </div>
  );
}
