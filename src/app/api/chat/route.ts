import { NextRequest, NextResponse } from "next/server"

const GEMINI_API_KEY = process.env.GEMINI_API_KEY?.trim()
const KRYPTOS_API_URL = (process.env.KRYPTOS_API_URL || process.env.NEXT_PUBLIC_API_URL || "https://kryptos-backend-uq36.onrender.com").trim()

type Role = "user" | "model" | "system"

interface ChatMessage {
  role: Role
  content: string
}

interface ChatRequest {
  messages: { role: string; content: string }[]
  chainId?: number
}

function extractLatestUserMessage(messages: { role: string; content: string }[]): string {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === "user") return messages[i].content
  }
  return ""
}

function extractWalletAddress(text: string): string | null {
  const match = text.match(/0x[a-fA-F0-9]{40}/)
  return match ? match[0] : null
}

function inferSymbols(text: string): string[] {
  const knownMap: Record<string, string> = {
    bitcoin: "btc",
    btc: "btc",
    ethereum: "eth",
    eth: "eth",
    solana: "sol",
    sol: "sol",
    algorand: "algo",
    algo: "algo",
    bnb: "bnb",
    dogecoin: "doge",
    doge: "doge",
    ripple: "xrp",
    xrp: "xrp",
    cardano: "ada",
    ada: "ada",
  }

  const lower = text.toLowerCase()
  const set = new Set<string>()

  for (const key of Object.keys(knownMap)) {
    if (lower.includes(key)) {
      set.add(knownMap[key])
    }
  }

  if (set.size === 0) {
    set.add("btc")
    set.add("eth")
  }

  return Array.from(set)
}

async function getPriceContext(question: string): Promise<string> {
  try {
    const symbols = inferSymbols(question)
    const idsMap: Record<string, string> = {
      btc: "bitcoin",
      eth: "ethereum",
      sol: "solana",
      algo: "algorand",
      bnb: "binancecoin",
      doge: "dogecoin",
      xrp: "ripple",
      ada: "cardano",
    }

    const ids = symbols
      .map((s) => idsMap[s])
      .filter(Boolean)
      .join(",")

    if (!ids) return ""

    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${encodeURIComponent(ids)}&vs_currencies=usd&include_24hr_change=true&include_market_cap=true`
    const res = await fetch(url, { next: { revalidate: 300 } })

    if (!res.ok) return "Live pricing data is currently unavailable."

    const data = await res.json()
    const rows = Object.entries(data)
      .map(([id, value]) => {
        const v = value as { usd?: number; usd_24h_change?: number; usd_market_cap?: number }
        const price = v.usd ? `$${v.usd.toLocaleString()}` : "N/A"
        const change = v.usd_24h_change ? `${v.usd_24h_change.toFixed(2)}%` : "N/A"
        const mcap = v.usd_market_cap ? `$${Math.round(v.usd_market_cap).toLocaleString()}` : "N/A"
        return `${id.toUpperCase()}: Price ${price}, 24h Change ${change}, Market Cap ${mcap}`
      })
      .join("\n")

    return rows || "No pricing data found."
  } catch (err) {
    console.error("Coingecko error:", err)
    return "Failed to fetch live prices."
  }
}

async function getWalletRiskContext(walletAddress: string, chainId: number): Promise<string> {
  try {
    const url = `${KRYPTOS_API_URL}/analyze/${walletAddress}?chain_id=${chainId}`
    const res = await fetch(url, {
      headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(3000)
    })

    if (!res.ok) return `Wallet intelligence for ${walletAddress} is currently unavailable.`

    const data = await res.json()
    return [
      `Analysis for ${data.address}:`,
      `• Risk Score: ${data.risk_score}/100 (${data.risk_label})`,
      `• Activity: ${data.tx_count} transactions, ${data.token_transfers} transfers`,
      `• Known Flags: ${Array.isArray(data.flags) && data.flags.length ? data.flags.join(", ") : "None detected"}`
    ].join("\n")
  } catch (err) {
    return `Could not perform real-time risk analysis for ${walletAddress}.`
  }
}

async function buildToolContext(question: string, chainId: number): Promise<string> {
  const sections: string[] = []

  if (/price|market cap|stats|change|coin|token|value|trading/i.test(question)) {
    const priceContext = await getPriceContext(question)
    if (priceContext) sections.push(`[Market Data]\n${priceContext}`)
  }

  const wallet = extractWalletAddress(question)
  if (wallet) {
    const walletContext = await getWalletRiskContext(wallet, chainId)
    if (walletContext) sections.push(`[Wallet Intelligence]\n${walletContext}`)
  }

  return sections.join("\n\n")
}

async function callGemini(messages: { role: string; content: string }[], toolContext: string): Promise<string> {
  if (!GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not configured")
  }

  const systemPrompt = `You are Kryptos AI, a professional on-chain intelligence assistant.
Your goal is to help users understand crypto markets and evaluate wallet risks.
Be expert, concise, and objective. 
If live data is provided in the context, use it. If not available, state that you don't have real-time data for that specific query.
Never fabricate risk scores or wallet data.
Use clean Markdown formatting (bolding, lists, etc.) to make the information easy to read.

STRICT GUARDRAIL RULES:
1. You may ONLY answer questions related to cryptocurrencies, blockchain technology, Web3, wallet analysis, market data, and the Kryptos platform.
2. If the user asks about ANYTHING ELSE (e.g., sports, celebrities like Virat Kohli, politics, general knowledge, programming outside of crypto smart contracts, etc.), you MUST refuse to answer.
3. For off-topic questions, respond exactly like this (or similar): "I am a hyper-specialized AI built for the Kryptos platform. I can only assist you with topics related to cryptocurrency, blockchain intelligence, and wallet analysis. How can I help you with your crypto research today?"

Current Context:
${toolContext || "No additional real-time context available."}`

  const contents = messages
    .filter(m => m.role === "user" || m.role === "assistant")
    .map(m => ({
      role: m.role === "user" ? "user" : "model",
      parts: [{ text: m.content }]
    }))

  if (contents.length > 0) {
    contents[0].parts[0].text = `Instructions: ${systemPrompt}\n\nUser Question: ${contents[0].parts[0].text}`
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${GEMINI_API_KEY}`
  
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents,
      generationConfig: {
        temperature: 0.7,
        topP: 0.8,
        topK: 40,
        maxOutputTokens: 1024,
      }
    })
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Gemini API error: ${res.status} ${text}`)
  }

  const data = await res.json()
  const reply = data.candidates?.[0]?.content?.parts?.[0]?.text
  
  if (!reply) {
    throw new Error("Empty response from Gemini")
  }

  return reply
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as ChatRequest
    const messages = body.messages || []
    const chainId = body.chainId || 1

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "Messages are required" }, { status: 400 })
    }

    const latestQuestion = extractLatestUserMessage(messages)
    const toolContext = await buildToolContext(latestQuestion, chainId)
    
    const reply = await callGemini(messages, toolContext)

    return NextResponse.json({ reply })
  } catch (error) {
    console.error("Chat route error:", error)
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : "Failed to generate chatbot response",
        fallback: "Kryptos AI is having trouble connecting to the intelligence engine. Please try again later."
      },
      { status: 500 }
    )
  }
}
