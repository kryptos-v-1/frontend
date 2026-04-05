"use client"

import { useState, useEffect, Suspense } from "react"
import { motion } from "framer-motion"
import { useSearchParams } from "next/navigation"
import dynamic from "next/dynamic"
import Sidebar from "@/components/dashboard/sidebar"
import Header from "@/components/dashboard/header"
import MetricsCards from "@/components/dashboard/metrics-cards"
import RiskGauge from "@/components/dashboard/risk-gauge"
import TransactionFlowChart from "@/components/dashboard/transaction-flow-chart"
import AccountsTable from "@/components/dashboard/accounts-table"
import TransactionsTable from "@/components/dashboard/transactions-table"
import RiskIntelligencePanel from "@/components/dashboard/risk-intelligence-panel"
import CounterpartiesTable from "@/components/dashboard/counterparties-table"
import NetworkGraph from "@/components/dashboard/network-graph"
import { api } from "@/lib/api"
import type { WalletAnalysis, TokenPortfolio } from "@/types"
import { Loader2, AlertTriangle, Shield } from "lucide-react"
import { useSession } from "@/lib/session"

const GlobeVisualization = dynamic(
  () => import("@/components/dashboard/globe-visualization"),
  { ssr: false }
)

function DashboardContent() {
  const searchParams = useSearchParams()
  const [selectedNetwork, setSelectedNetwork] = useState("ETH")
  const [mounted, setMounted] = useState(false)

  const [userAnalysis, setUserAnalysis] = useState<WalletAnalysis | null>(null)
  const [userTokens, setUserTokens] = useState<TokenPortfolio | null>(null)
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false)
  const [analysisError, setAnalysisError] = useState<string | null>(null)
  const [graphMode, setGraphMode] = useState<"3d" | "2d" | "timeline">("3d")
  const { isAuthenticated } = useSession()
  const [watchlist, setWatchlist] = useState<any[]>([])

  useEffect(() => {
    setMounted(true)

    // Load watchlist
    if (isAuthenticated) {
      api.getUserData().then(data => {
        if (data.watchlist) {
          setWatchlist(data.watchlist)
        }
      }).catch(console.error)
    } else {
      const saved = localStorage.getItem("watchedWallets")
      if (saved) {
        setWatchlist(JSON.parse(saved))
      }
    }
  }, [isAuthenticated])

  useEffect(() => {
    const addressParam = searchParams.get("address")
    const chainParam = searchParams.get("chain")

    if (addressParam) {
      loadAnalysis(addressParam, chainParam ? parseInt(chainParam) : 1)
    }
  }, [searchParams])

  const loadAnalysis = async (walletAddress: string, chainId: number) => {
    setIsLoadingAnalysis(true)
    setAnalysisError(null)

    try {
      const [analysis, tokens] = await Promise.all([
        api.analyze(walletAddress, chainId),
        api.tokens(walletAddress, chainId).catch(() => null),
      ])
      setUserAnalysis(analysis)
      setUserTokens(tokens)
    } catch (err) {
      console.error("Failed to analyze wallet:", err)
      setAnalysisError(err instanceof Error ? err.message : "Failed to analyze")
    } finally {
      setIsLoadingAnalysis(false)
    }
  }


  if (!mounted) {
    return (
      <div className="flex h-screen items-center justify-center bg-black">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black">
      <Sidebar />

      <Header />

      <main
        className="pt-16 transition-all duration-300"
        style={{ marginLeft: "16rem" }}
      >
        <div className="p-6">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-white">Blockchain Intelligence</h1>
                <p className="mt-1 text-sm text-gray-500">
                  Real-time risk analysis and portfolio monitoring
                </p>
              </div>
            </div>
          </motion.div>

          {userAnalysis ? (
            <div className="space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="rounded-xl border border-[#1A1A1A] bg-[#0A0A0A] p-6"
              >
                <div className="flex items-center gap-4">
                  <div className={`flex h-16 w-16 items-center justify-center rounded-xl ${userAnalysis.risk_score >= 70 ? "bg-[#00FF94]/10" :
                    userAnalysis.risk_score >= 40 ? "bg-[#FFB800]/10" : "bg-[#FF3B3B]/10"
                    }`}>
                    <Shield className={`h-8 w-8 ${userAnalysis.risk_score >= 70 ? "text-[#00FF94]" :
                      userAnalysis.risk_score >= 40 ? "text-[#FFB800]" : "text-[#FF3B3B]"
                      }`} />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-lg font-semibold text-white">Wallet Risk Analysis</h2>
                    <p className="text-sm text-gray-400">
                      {userAnalysis.tx_count.toLocaleString()} transactions • {userTokens?.tokens.length || 0} tokens • {userAnalysis.neighbors_analyzed} counterparties
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-white">{userAnalysis.risk_score}</p>
                    <p className="text-sm text-gray-400">{userAnalysis.risk_label}</p>
                  </div>
                </div>

                {userAnalysis.flags.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {userAnalysis.flags.slice(0, 5).map((flag, i) => (
                      <span key={i} className="rounded-full bg-[#FF3B3B]/10 px-3 py-1 text-xs text-[#FF3B3B]">
                        {flag}
                      </span>
                    ))}
                  </div>
                )}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="grid gap-6 lg:grid-cols-2"
              >
                <div className="">
                  <RiskGauge score={userAnalysis.risk_score} label={userAnalysis.risk_label.toUpperCase()} />
                </div>
                <div className="">
                  <TransactionFlowChart timeline={userAnalysis.timeline} />
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="space-y-6"
              >
                <div className="rounded-xl border border-[#1A1A1A] bg-[#0A0A0A] p-6">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-sm font-medium text-gray-400">Network Visualization</h3>
                    <div className="flex gap-1">
                      {(["3d", "2d", "timeline"] as const).map((mode) => (
                        <button
                          key={mode}
                          onClick={() => setGraphMode(mode)}
                          className={`px-3 py-1 text-xs rounded transition-colors ${graphMode === mode
                            ? "bg-[#00FF94] text-black"
                            : "bg-[#111111] text-gray-400 hover:text-white"
                            }`}
                        >
                          {mode.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="h-[350px] w-full">
                    <NetworkGraph
                      nodes={userAnalysis.graph?.nodes || []}
                      links={userAnalysis.graph?.links || []}
                      timeline={userAnalysis.timeline || []}
                      width={800}
                      height={350}
                      mode={graphMode}
                    />
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
              >
                <CounterpartiesTable counterparties={userAnalysis.top_counterparties} />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <RiskIntelligencePanel analysis={userAnalysis} />
              </motion.div>
            </div>
          ) : isLoadingAnalysis ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="h-12 w-12 animate-spin text-white" />
              <p className="mt-4 text-lg text-gray-400">Analyzing wallet...</p>
              <p className="text-sm text-gray-600">This may take a few seconds</p>
            </div>
          ) : analysisError ? (
            <div className="rounded-xl border border-[#FF3B3B]/30 bg-[#FF3B3B]/10 p-6">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-6 w-6 text-[#FF3B3B]" />
                <div>
                  <h3 className="font-semibold text-[#FF3B3B]">Analysis Failed</h3>
                  <p className="text-sm text-gray-400">{analysisError}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <MetricsCards />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="grid gap-6 lg:grid-cols-2"
              >
                <div className="">
                  <RiskGauge
                    score={watchlist.length > 0 ? watchlist[watchlist.length - 1].riskScore : 0}
                    label={watchlist.length > 0 ? watchlist[watchlist.length - 1].riskLabel : "NO DATA"}
                  />
                </div>
                <div className="">
                  <TransactionFlowChart
                    timeline={watchlist.length > 0 ? Array.from({ length: 12 }).map((_, i) => ({
                      date: `2026-${(i + 1).toString().padStart(2, '0')}-01`,
                      tx_count: Math.floor(Math.random() * 50) + 10,
                      volume: Math.random() * 10 * watchlist.length
                    })) : []}
                  />
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="space-y-6"
              >
                <div className="rounded-xl border border-[#1A1A1A] bg-[#0A0A0A] p-6">
                  <h3 className="mb-4 text-sm font-medium text-gray-400">Global Transaction Flow</h3>
                  <div className="flex flex-col items-center justify-center py-8">
                    <div className="h-[400px] w-full max-w-3xl">
                      <GlobeVisualization />
                    </div>
                    <p className="mt-4 text-gray-400">Use the wallet scanner to analyze addresses</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <AccountsTable wallets={watchlist} />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <TransactionsTable />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <RiskIntelligencePanel />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
              >
                <CounterpartiesTable />
              </motion.div>
            </div>
          )}

          <motion.footer
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-8 border-t border-[#1A1A1A] py-6"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded bg-white">
                  <span className="text-xs font-bold text-black">K</span>
                </div>
                <span className="text-sm font-medium text-gray-400">KRYPTOS</span>
              </div>
              <p className="text-xs text-gray-600">
                © 2026 KRYPTOS. Blockchain Intelligence Platform.
              </p>
            </div>
          </motion.footer>
        </div>
      </main>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center bg-black">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    }>
      <DashboardContent />
    </Suspense>
  )
}
