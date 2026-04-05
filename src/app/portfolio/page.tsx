"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import dynamic from "next/dynamic"
import { useRouter } from "next/navigation"
import { Search, Plus, X, Loader2, ArrowUpRight, ArrowDownLeft, Copy, Activity } from "lucide-react"
import { cn } from "@/lib/utils"
import Sidebar from "@/components/dashboard/sidebar"
import Header from "@/components/dashboard/header"
import AccountsTable from "@/components/dashboard/accounts-table"
import TransactionsTable from "@/components/dashboard/transactions-table"
import CountryWallets from "@/components/dashboard/country-wallets"
import { api } from "@/lib/api"
import { CHAINS } from "@/lib/constants"
import { useSession } from "@/lib/session"
import { formatAddress } from "@/lib/wallet"
import FreePlanGuard from "@/components/dashboard/free-plan-guard"

const GlobeVisualization = dynamic(
  () => import("@/components/dashboard/globe-visualization"),
  { ssr: false }
)

interface WatchedWallet {
  address: string
  label: string
  network: string
  riskScore: number
  riskLabel: string
  balance: number
  lastSeen: number
}

interface RecentTransaction {
  hash: string
  from: string
  to: string
  value: number
  timestamp: number
  status: "success" | "failed"
  chain: string
  type: "in" | "out"
}

// Risk threshold for auto-triggering sanctions check
const SANCTIONS_CHECK_THRESHOLD = 75;

export default function WatchlistPage() {
  const router = useRouter()
  const { user, isAuthenticated, token } = useSession()
  const [mounted, setMounted] = useState(false)
  const [addWalletOpen, setAddWalletOpen] = useState(false)
  const [walletAddress, setWalletAddress] = useState("")
  const [walletLabel, setWalletLabel] = useState("")
  const [selectedChain, setSelectedChain] = useState(1)
  const [isAdding, setIsAdding] = useState(false)
  const [wallets, setWallets] = useState<WatchedWallet[]>([])
  const [transactions, setTransactions] = useState<RecentTransaction[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [visibleTxs, setVisibleTxs] = useState(5)

  useEffect(() => {
    setMounted(true)
    loadWallets()
  }, [isAuthenticated])

  const loadWallets = async () => {
    if (isAuthenticated) {
      try {
        const data = await api.getUserData()
        if (data.watchlist) {
          setWallets(data.watchlist)
          if (data.watchlist.length > 0) {
            generateTransactionsForWallets(data.watchlist)
          }
        }
      } catch (err) {
        console.error("Failed to load watchlist from DB", err)
      }
    } else {
      const saved = localStorage.getItem("watchedWallets")
      if (saved) {
        const parsedWallets = JSON.parse(saved)
        setWallets(parsedWallets)

        // Generate initial transactions for existing wallets
        if (parsedWallets.length > 0) {
          generateTransactionsForWallets(parsedWallets)
        }
      }
    }
  }

  const generateTransactionsForWallets = (walletList: WatchedWallet[]) => {
    const newTxs: RecentTransaction[] = []
    walletList.forEach(wallet => {
      // Create 5-10 mock transactions for each wallet
      const count = Math.floor(Math.random() * 6) + 5
      for (let i = 0; i < count; i++) {
        const isReceived = Math.random() > 0.5
        newTxs.push({
          hash: "0x" + Math.random().toString(16).slice(2, 12) + "...",
          from: isReceived ? "0x" + Math.random().toString(16).slice(2, 10) + "..." : wallet.address,
          to: isReceived ? wallet.address : "0x" + Math.random().toString(16).slice(2, 10) + "...",
          value: parseFloat((Math.random() * 5).toFixed(3)),
          timestamp: Date.now() - Math.floor(Math.random() * 86400000 * 7), // Last 7 days
          status: "success",
          chain: wallet.network,
          type: isReceived ? "in" : "out"
        })
      }
    })
    setTransactions(newTxs.sort((a, b) => b.timestamp - a.timestamp))
  }

  const saveWallets = (newWallets: WatchedWallet[]) => {
    setWallets(newWallets)
    if (isAuthenticated) {
      api.updateUserData({ action: "set_watchlist", watchlist: newWallets }).catch(console.error)
    } else {
      localStorage.setItem("watchedWallets", JSON.stringify(newWallets))
    }
  }

  const handleAddWallet = async () => {
    if (!walletAddress.trim()) return

    setIsAdding(true)
    try {
      const analysis = await api.analyze(walletAddress.trim(), selectedChain)
      const newWallet: WatchedWallet = {
        address: analysis.address,
        label: walletLabel || analysis.ens_name || analysis.address.slice(0, 8) + "...",
        network: CHAINS.find(c => c.id === selectedChain)?.short || "ETH",
        riskScore: analysis.risk_score,
        riskLabel: analysis.risk_label,
        balance: analysis.balance,
        lastSeen: Date.now(),
      }

      const updatedWallets = [...wallets.filter(w => w.address !== newWallet.address), newWallet]
      saveWallets(updatedWallets)

      // Trigger both workflows only if risk score exceeds threshold
      if (analysis.risk_score >= SANCTIONS_CHECK_THRESHOLD) {
        await api.triggerCrossChainWorkflow(analysis.address)
        await api.triggerSanctionsScan(analysis.address)
      }

      // Add a fresh transaction for the new wallet
      const isReceived = Math.random() > 0.5
      const freshTx: RecentTransaction = {
        hash: "0x" + Math.random().toString(16).slice(2, 12) + "...",
        from: isReceived ? "0x" + Math.random().toString(16).slice(2, 10) + "..." : newWallet.address,
        to: isReceived ? newWallet.address : "0x" + Math.random().toString(16).slice(2, 10) + "...",
        value: parseFloat((Math.random() * 2).toFixed(3)),
        timestamp: Date.now(),
        status: "success",
        chain: newWallet.network,
        type: isReceived ? "in" : "out"
      }

      setTransactions(prev => [freshTx, ...prev].sort((a, b) => b.timestamp - a.timestamp))

      setWalletAddress("")
      setWalletLabel("")
      setAddWalletOpen(false)
    } catch (err) {
      console.error("Failed to add wallet:", err)
    } finally {
      setIsAdding(false)
    }
  }

  const handleRemoveWallet = (address: string) => {
    const updated = wallets.filter(w => w.address !== address)
    saveWallets(updated)
    setTransactions(prev => prev.filter(tx => tx.from === address || tx.to === address))
  }

  const handleAnalyzeWallet = (address: string, chainId: number = 1) => {
    const params = new URLSearchParams({
      address,
      chain: chainId.toString(),
    })
    router.push(`/dashboard?${params.toString()}`)
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
                <h1 className="text-2xl font-bold text-white">Watchlist</h1>
                <p className="mt-1 text-sm text-gray-500">
                  Manage your tracked wallets and monitor real-time activity
                </p>
              </div>
              <button
                onClick={() => setAddWalletOpen(true)}
                className="flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-medium text-black hover:bg-gray-200"
              >
                <Plus className="h-4 w-4" />
                Add to Watchlist
              </button>
            </div>
          </motion.div>

          <AnimatePresence>
            {addWalletOpen && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="mb-6 rounded-xl border border-[#1A1A1A] bg-[#0A0A0A] p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">Add Wallet to Watchlist</h3>
                  <button
                    onClick={() => setAddWalletOpen(false)}
                    className="p-1 text-gray-500 hover:text-white"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <div className="flex gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500" />
                    <input
                      type="text"
                      value={walletAddress}
                      onChange={(e) => setWalletAddress(e.target.value)}
                      placeholder="Enter wallet address (0x...) or ENS name"
                      className="w-full rounded-lg border border-[#1A1A1A] bg-[#0A0A0A] py-3 pl-12 pr-4 text-white placeholder-gray-500 focus:border-white focus:outline-none"
                    />
                  </div>
                  <input
                    type="text"
                    value={walletLabel}
                    onChange={(e) => setWalletLabel(e.target.value)}
                    placeholder="Label (optional)"
                    className="w-48 rounded-lg border border-[#1A1A1A] bg-[#0A0A0A] px-4 py-3 text-white placeholder-gray-500 focus:border-white focus:outline-none"
                  />
                  <select
                    value={selectedChain}
                    onChange={(e) => setSelectedChain(Number(e.target.value))}
                    className="rounded-lg border border-[#1A1A1A] bg-[#0A0A0A] px-4 py-3 text-white focus:border-white focus:outline-none"
                  >
                    {CHAINS.filter(c => c.id !== 84532 && c.id !== 11155111).map((chain) => (
                      <option key={chain.id} value={chain.id}>{chain.name}</option>
                    ))}
                  </select>
                  <button
                    onClick={handleAddWallet}
                    disabled={isAdding || !walletAddress.trim()}
                    className="flex items-center gap-2 rounded-lg bg-[#00FF94] px-6 py-3 font-medium text-black hover:opacity-90 disabled:opacity-50"
                  >
                    {isAdding ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4" />
                        Add
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <AccountsTable
                showAll={true}
                wallets={wallets.map(w => ({
                  id: w.address,
                  address: w.address,
                  ensName: w.label,
                  network: w.network as "ETH" | "BTC" | "SOL",
                  balance: w.balance,
                  balanceUsd: w.balance * 1800,
                  riskScore: w.riskScore,
                  riskLabel: w.riskLabel as "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
                  label: w.label,
                  firstSeen: w.lastSeen,
                  lastSeen: w.lastSeen,
                }))}
                onAddWallet={() => setAddWalletOpen(true)}
                onRemoveWallet={handleRemoveWallet}
                onAnalyzeWallet={handleAnalyzeWallet}
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="rounded-xl border border-[#1A1A1A] bg-[#0A0A0A] overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b border-[#1A1A1A]">
                  <h3 className="text-lg font-semibold text-white">Recent Transactions</h3>
                  {transactions.length > visibleTxs && (
                    <button
                      onClick={() => setVisibleTxs(prev => prev + 5)}
                      className="text-sm text-[#00FF94] hover:underline"
                    >
                      View More
                    </button>
                  )}
                </div>
                <FreePlanGuard feature="Full transaction history">
                  <div className="divide-y divide-[#1A1A1A]">
                    {transactions.length > 0 ? (
                      transactions.slice(0, visibleTxs).map((tx, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-4 hover:bg-[#111] transition-colors"
                        >
                          <div className="flex items-center gap-4">
                            <div className={cn(
                              "h-10 w-10 rounded-full flex items-center justify-center",
                              tx.type === "in" ? "bg-[#00FF94]/10" : "bg-white/10"
                            )}>
                              {tx.type === "in" ? (
                                <ArrowDownLeft className="h-5 w-5 text-[#00FF94]" />
                              ) : (
                                <ArrowUpRight className="h-5 w-5 text-white" />
                              )}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-white font-medium">
                                  {tx.type === "in" ? "Received" : "Sent"}
                                </span>
                                <span className={cn(
                                  "px-2 py-0.5 rounded text-xs",
                                  tx.status === "success" ? "bg-white/10 text-white" : "bg-red-500/10 text-red-400"
                                )}>
                                  {tx.status}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-gray-500 text-sm">
                                  {tx.type === "in" ? "From" : "To"}: {formatAddress(tx.type === "in" ? tx.from : tx.to)}
                                </span>
                                <button
                                  onClick={() => navigator.clipboard.writeText(tx.type === "in" ? tx.from : tx.to)}
                                  className="text-gray-500 hover:text-white"
                                >
                                  <Copy className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={cn(
                              "font-medium",
                              tx.type === "in" ? "text-[#00FF94]" : "text-white"
                            )}>
                              {tx.type === "in" ? "+" : "-"}{tx.value} {tx.chain}
                            </div>
                            <div className="text-gray-500 text-sm mt-1">
                              {new Date(tx.timestamp).toLocaleString()}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="flex flex-col items-center justify-center py-12 text-center">
                        <Activity className="h-10 w-10 text-gray-700 mb-3" />
                        <p className="text-gray-400 font-medium">No recent transactions</p>
                        <p className="text-gray-600 text-sm mt-1">Add a wallet to start tracking activity</p>
                      </div>
                    )}
                  </div>
                </FreePlanGuard>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="rounded-xl border border-[#1A1A1A] bg-[#0A0A0A] overflow-hidden">
                <div className="p-4 border-b border-[#1A1A1A]">
                  <h3 className="text-lg font-semibold text-white">Known Entity Wallets</h3>
                  <p className="text-sm text-gray-500 mt-1">Trusted exchanges, DeFi protocols, and notable addresses</p>
                </div>
                <div className="p-4 space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
                      <span className="text-[#00FF94]">●</span> Safe Wallets (80+ Trust Score)
                    </h4>
                    {user && (user.premium_tier === "pro" || user.premium_tier === "enterprise") ? (
                      <CountryWallets filter="safe" />
                    ) : (
                      <FreePlanGuard feature="Safe trusted wallets">
                        <CountryWallets filter="safe" />
                      </FreePlanGuard>
                    )}
                  </div>
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
                      <span className="text-[#FF3B3B]">●</span> High Risk / Unknown Wallets
                    </h4>
                    <CountryWallets filter="risky" />
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.footer
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
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
        </div>
      </main>
    </div>
  )
}
