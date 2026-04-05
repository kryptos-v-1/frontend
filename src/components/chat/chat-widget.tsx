"use client"

import { useMemo, useState, useEffect, useRef } from "react"
import { MessageCircle, X, Send, Loader2, Bot } from "lucide-react"
import { useSession } from "@/lib/session"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

type ChatRole = "user" | "assistant"

interface ChatMessage {
  role: ChatRole
  content: string
}

const STARTER_MESSAGE: ChatMessage = {
  role: "assistant",
  content:
    "Welcome to Kryptos AI. I can help you analyze wallet risks, provide real-time market data, and answer technical questions about 14+ EVM chains. How can I assist you today?",
}

export default function ChatWidget() {
  const { user, isAuthenticated } = useSession()
  const [isOpen, setIsOpen] = useState(false)
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([STARTER_MESSAGE])
  const [error, setError] = useState<string | null>(null)
  
  const scrollRef = useRef<HTMLDivElement>(null)

  const isPro = useMemo(() => {
    const tier = user?.premium_tier
    return tier === "pro" || tier === "enterprise"
  }, [user?.premium_tier])

  const usageCount = useMemo(
    () => messages.filter((m) => m.role === "user").length,
    [messages],
  )

  const freeLimitReached = !isPro && usageCount >= 10

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, isLoading])

  async function sendMessage() {
    const text = input.trim()
    if (!text || isLoading) return

    if (freeLimitReached) {
      setError("Free plan chat limit reached. Upgrade to continue with unlimited AI chat.")
      return
    }

    setError(null)

    const nextMessages: ChatMessage[] = [...messages, { role: "user", content: text }]
    setMessages(nextMessages)
    setInput("")
    setIsLoading(true)

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: nextMessages,
          chainId: 1,
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || "Failed to get chat response")
      }

      setMessages((prev) => [...prev, { role: "assistant", content: data.reply || "No response." }])
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to send message"
      setError(message)
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "I could not fetch a response right now. Please try again in a moment.",
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      void sendMessage()
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-60">
      {isOpen ? (
        <div className="w-90 max-w-[calc(100vw-2rem)] flex flex-col rounded-2xl border border-[#1A1A1A] bg-[#070707] shadow-2xl" style={{ maxHeight: "600px" }}>
          <div className="flex items-center justify-between border-b border-[#1A1A1A] bg-[#0E0E0E] px-4 py-3 shrink-0">
            <div className="flex items-center gap-2">
              <Bot className="h-4 w-4 text-[#00FF94]" />
              <div>
                <p className="text-sm font-semibold text-white">Kryptos AI</p>
                <p className="text-[11px] text-gray-500">
                  {isAuthenticated
                    ? isPro
                      ? "Pro: Unlimited chat"
                      : `Free: ${Math.max(0, 10 - usageCount)} messages left`
                    : "Guest mode"}
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="rounded-md p-1 text-gray-400 transition hover:bg-[#1A1A1A] hover:text-white shrink-0"
              aria-label="Close chat"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div 
            ref={scrollRef}
            className="chat-messages flex-1 space-y-3 overflow-y-auto p-4"
            style={{
              overflowY: "auto",
              WebkitOverflowScrolling: "touch",
              scrollBehavior: "smooth"
            }}
          >
            {messages.map((message, idx) => (
              <div
                key={`${message.role}-${idx}`}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                    message.role === "user"
                      ? "bg-[#00FF94] text-black shadow-[0_2px_10px_rgba(0,255,148,0.2)]"
                      : "border border-[#1A1A1A] bg-[#111111] text-gray-100"
                  }`}
                >
                  {message.role === "assistant" ? (
                    <div className="prose prose-invert prose-sm max-w-none">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {message.content}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    message.content
                  )}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="flex items-center gap-2 rounded-2xl border border-[#1A1A1A] bg-[#111111] px-3 py-2 text-sm text-gray-300">
                  <Loader2 className="h-4 w-4 animate-spin text-[#00FF94]" />
                  Thinking...
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-[#1A1A1A] p-3 shrink-0">
            {error && <p className="mb-2 text-xs text-[#FF6B6B]">{error}</p>}
            <div className="flex items-end gap-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about prices, wallet risks, or chains..."
                rows={2}
                className="min-h-11 flex-1 resize-none rounded-xl border border-[#1A1A1A] bg-[#0E0E0E] px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-[#00FF94] focus:outline-none"
              />
              <button
                onClick={() => void sendMessage()}
                disabled={isLoading || !input.trim()}
                className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[#00FF94] text-black transition hover:bg-[#00E086] disabled:cursor-not-allowed disabled:opacity-50 shrink-0"
                aria-label="Send"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="group flex items-center gap-2 rounded-full border border-[#1A1A1A] bg-[#0C0C0C] px-5 py-3.5 text-sm font-medium text-white shadow-2xl transition hover:border-[#00FF94]/50 hover:bg-[#111111]"
        >
          <div className="relative">
            <MessageCircle className="h-5 w-5 text-[#00FF94]" />
            <span className="absolute -top-1 -right-1 h-2 w-2 animate-pulse rounded-full bg-[#00FF94]" />
          </div>
          Ask Kryptos AI
        </button>
      )}
    </div>
  )
}
