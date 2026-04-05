"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { useRouter, useSearchParams } from "next/navigation"
import {
  Search,
  ShieldAlert,
  ShieldCheck,
  Code,
  FileCode,
  Activity,
  ExternalLink,
  Loader2,
  AlertCircle,
  Zap,
  Lock,
  Terminal,
  Database,
  User,
  Layers,
  Cpu,
  Fingerprint,
  Info,
  CheckCircle2,
  XCircle,
  AlertTriangle
} from "lucide-react"
import Sidebar from "@/components/dashboard/sidebar"
import Header from "@/components/dashboard/header"
import { api } from "@/lib/api"
import { CHAINS } from "@/lib/constants"
import { useSession } from "@/lib/session"
import type { ContractAuditResult, ContractNlpResult } from "@/types"

export default function ContractReportPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useSession()
  const [address, setAddress] = useState("")
  const [selectedChainId, setSelectedChainId] = useState(1)
  const [isScanning, setIsScanning] = useState(false)
  const [auditResult, setAuditResult] = useState<ContractAuditResult | null>(null)
  const [nlpResult, setNlpResult] = useState<ContractNlpResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const paramAddress = searchParams.get("address")
    const paramChain = searchParams.get("chain")
    if (paramAddress) setAddress(paramAddress)
    if (paramChain) setSelectedChainId(Number(paramChain))

    if (paramAddress) {
      void performScan(paramAddress, Number(paramChain || 1))
    }
  }, [searchParams])

  const performScan = async (addr: string, chainId: number) => {
    if (!addr || !/^0x[a-fA-F0-9]{40}$/.test(addr)) {
      setError("Please enter a valid contract address")
      return
    }

    setIsScanning(true)
    setError(null)
    setAuditResult(null)
    setNlpResult(null)

    try {
      // Step 1: Static audit
      const audit = await api.contractAudit(addr, chainId)
      setAuditResult(audit)

      // Step 2: If source code exists, run NLP analysis
      if (audit.source_code) {
        try {
          const nlp = await api.contractAuditAnalyze(audit.source_code, addr)
          setNlpResult(nlp)
        } catch (nlpErr) {
          console.error("NLP analysis failed:", nlpErr)
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Audit failed. The address might not be a contract or is not verified.")
    } finally {
      setIsScanning(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    performScan(address, selectedChainId)
  }

  if (!mounted) return null

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case "critical": return "text-white"
      case "high": return "text-white"
      case "medium": return "text-gray-300"
      case "low": return "text-gray-400"
      case "info": return "text-gray-500"
      default: return "text-gray-500"
    }
  }

  const getSeverityBg = (severity: string) => {
    switch (severity.toLowerCase()) {
      case "critical": return "bg-white/10 border-white/30"
      case "high": return "bg-white/8 border-white/20"
      case "medium": return "bg-white/5 border-white/15"
      case "low": return "bg-white/3 border-white/10"
      case "info": return "bg-white/2 border-white/5"
      default: return "bg-white/2 border-white/5"
    }
  }

  return (
    <div className="min-h-screen bg-black">
      <Sidebar />
      <Header />

      <main className="pt-16 transition-all duration-300" style={{ marginLeft: "16rem" }}>
        <div className="max-w-7xl mx-auto p-8">
          {/* Header Section */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-10"
          >
            <div className="flex items-center gap-3">
             
              <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">Contract Sentinel</h1>
                <p className="text-gray-500 mt-1">Multi-layer security audit and AI-powered vulnerability analysis</p>
              </div>
            </div>
          </motion.div>

          {/* Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-12"
          >
            <form onSubmit={handleSearch} className="flex gap-4">
              <div className="relative flex-1 group">
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500 transition-colors group-focus-within:text-white" />
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Enter contract address (0x...)"
                  className="w-full rounded-2xl border border-[#1A1A1A] bg-[#0A0A0A] py-4 pl-12 pr-4 text-white placeholder-gray-600 focus:border-white/50 focus:outline-none focus:ring-1 focus:ring-white/50 transition-all font-mono"
                />
              </div>
              <select
                value={selectedChainId}
                onChange={(e) => setSelectedChainId(Number(e.target.value))}
                className="rounded-2xl border border-[#1A1A1A] bg-[#0A0A0A] px-6 py-4 text-white focus:border-white/50 focus:outline-none transition-all cursor-pointer"
              >
                {CHAINS.map((chain) => (
                  <option key={chain.id} value={chain.id}>{chain.name}</option>
                ))}
              </select>
              <button
                type="submit"
                disabled={isScanning || !address.trim()}
                className="rounded-2xl bg-white px-10 py-4 font-bold text-black transition-all hover:bg-gray-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:scale-100 flex items-center gap-2"
              >
                {isScanning ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Activity className="h-5 w-5" />
                    Generate Report
                  </>
                )}
              </button>
            </form>
          </motion.div>

         
               

            {auditResult && !isScanning && (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
              >
                {/* Recommendation Banner (NLP) */}
                {nlpResult && (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`p-6 rounded-3xl border ${nlpResult.risk_score >= 70 ? "bg-white/10 border-white/30" :
                      nlpResult.risk_score >= 40 ? "bg-white/5 border-white/15" :
                        "bg-white/3 border-white/10"
                      } flex items-start justify-between`}
                  >
                    <div className="flex gap-4">
                      <div className={`p-3 rounded-2xl ${nlpResult.risk_score >= 70 ? "bg-white/20 text-white" :
                        nlpResult.risk_score >= 40 ? "bg-white/10 text-gray-300" :
                          "bg-white/5 text-gray-400"
                        }`}>
                        {nlpResult.risk_score >= 70 ? <ShieldAlert className="h-6 w-6" /> : <ShieldCheck className="h-6 w-6" />}
                      </div>
                      <div>
                        <h4 className="text-lg font-bold text-white">AI Recommendation</h4>
                        <p className="text-gray-300 mt-1">{nlpResult.recommended_action}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs uppercase tracking-widest text-gray-500 font-bold mb-1">AI Risk Score</div>
                      <div className={`text-3xl font-black ${nlpResult.risk_score >= 70 ? "text-white" :
                        nlpResult.risk_score >= 40 ? "text-gray-300" :
                          "text-gray-400"
                        }`}>{nlpResult.risk_score}/100</div>
                    </div>
                  </motion.div>
                )}

                {/* Main Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* Score Circle */}
                  <div className="col-span-1 rounded-3xl border border-[#1A1A1A] bg-[#0A0A0A] p-8 flex flex-col items-center justify-center relative overflow-hidden group">
                    <div className="absolute -top-4 -right-4 p-8 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity">
                      <Fingerprint className="h-32 w-32 text-white" />
                    </div>
                    <div className="text-xs uppercase tracking-widest text-gray-500 font-bold mb-4">Static Security Grade</div>
                    <div className="relative">
                      <svg className="h-32 w-32 transform -rotate-90">
                        <circle
                          cx="64"
                          cy="64"
                          r="58"
                          fill="transparent"
                          stroke="#1A1A1A"
                          strokeWidth="8"
                        />
                        <circle
                          cx="64"
                          cy="64"
                          r="58"
                          fill="transparent"
                          stroke="white"
                          strokeWidth="8"
                          strokeDasharray={364.4}
                          strokeDashoffset={364.4 - (364.4 * auditResult.security_score.score) / 100}
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-4xl font-black text-white">{auditResult.security_score.grade}</span>
                        <span className="text-[10px] text-gray-500 font-bold">{auditResult.security_score.score}%</span>
                      </div>
                    </div>
                    <div className={`mt-4 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border text-white border-white/20 bg-white/5`}>
                      {auditResult.security_score.label}
                    </div>
                  </div>

                  {/* Contractor Profile */}
                  <div className="col-span-1 lg:col-span-2 rounded-3xl border border-[#1A1A1A] bg-[#0A0A0A] p-8">
                    <div className="flex items-start justify-between mb-8">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Code className="h-4 w-4 text-gray-500" />
                          <h3 className="text-lg font-bold text-white">{auditResult.contract_name || "Smart Contract"}</h3>
                        </div>
                        <p className="font-mono text-sm text-gray-500 truncate max-w-[300px]">{auditResult.contract_address}</p>
                      </div>
                      <div className="flex gap-2">
                        <a
                          href={`${CHAINS.find(c => c.id === selectedChainId)?.explorer}/address/${auditResult.contract_address}`}
                          target="_blank"
                          className="p-2.5 rounded-xl bg-[#1A1A1A] hover:bg-[#252525] transition-colors border border-white/5"
                        >
                          <ExternalLink className="h-4 w-4 text-gray-400" />
                        </a>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-6 pt-6 border-t border-[#1A1A1A]">
                      <div>
                        <div className="text-[10px] uppercase font-black text-gray-500 tracking-wider mb-1">Status</div>
                        <div className="flex items-center gap-2 text-sm text-white">
                          {auditResult.is_verified ? (
                            <ShieldCheck className="h-4 w-4 text-white" />
                          ) : (
                            <ShieldAlert className="h-4 w-4 text-gray-400" />
                          )}
                          {auditResult.is_verified ? "Verified" : "Unverified"}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase font-black text-gray-500 tracking-wider mb-1">Compiler</div>
                        <div className="text-sm text-white font-mono">{auditResult.compiler_version || "Unknown"}</div>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase font-black text-gray-500 tracking-wider mb-1">Source Lines</div>
                        <div className="text-sm text-white">{auditResult.metadata.source_lines || "N/A"}</div>
                      </div>
                    </div>
                  </div>

                  {/* Creator Info */}
                  <div className="col-span-1 rounded-3xl border border-[#1A1A1A] bg-[#0A0A0A] p-8">
                    <div className="flex items-center gap-2 mb-6">
                      <User className="h-4 w-4 text-white" />
                      <h3 className="text-sm font-bold text-white">Deployer Profile</h3>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <div className="text-[10px] uppercase font-black text-gray-500 tracking-wider mb-1">Creator Address</div>
                        <div className="text-xs text-gray-400 font-mono truncate">{auditResult.creator.address}</div>
                      </div>
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="text-[10px] uppercase font-black text-gray-500 tracking-wider mb-1">Transactions</div>
                          <div className="text-sm text-white font-bold">{auditResult.creator.tx_count}</div>
                        </div>
                        <div>
                          <div className="text-[10px] uppercase font-black text-gray-500 tracking-wider mb-1">Deploys</div>
                          <div className="text-sm text-white font-bold">{auditResult.creator.contracts_deployed}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* NLP Summary Card */}
                {nlpResult && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="rounded-3xl border border-[#1A1A1A] bg-[#0A0A0A] overflow-hidden"
                  >
                    <div className="bg-white/3 border-b border-[#1A1A1A] px-8 py-4 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Zap className="h-4 w-4 text-white" />
                        <span className="text-sm font-bold text-white">Gemini Intelligence Analysis</span>
                      </div>
                      <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">{nlpResult.model_used}</span>
                    </div>
                    <div className="p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
                      <div className="lg:col-span-2">
                        <h4 className="text-xl font-bold text-white mb-4">Functional Summary</h4>
                        <p className="text-gray-400 leading-relaxed italic border-l-2 border-white/20 pl-6 py-1">
                          &quot;{nlpResult.overall_summary}&quot;
                        </p>
                      </div>
                      <div className="space-y-4">
                        <h4 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-gray-400" />
                          Key Concerns
                        </h4>
                        <div className="space-y-2">
                          {nlpResult.key_concerns.map((concern, i) => (
                            <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
                              <div className="h-1.5 w-1.5 rounded-full bg-white" />
                              <span className="text-xs text-gray-300">{concern}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Vulnerabilities and Functions */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Vulnerability List */}
                  <div className="rounded-3xl border border-[#1A1A1A] bg-[#0A0A0A] p-8">
                    <div className="flex items-center justify-between mb-8">
                      <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <AlertCircle className="h-5 w-5 text-white" />
                        Audit Findings
                      </h3>
                      <div className="flex gap-2">
                        {Object.entries(auditResult.security_score.severity_counts).map(([sev, count]) => (
                          count > 0 && (
                            <span key={sev} className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${getSeverityColor(sev)} bg-white/5`}>
                              {count} {sev.charAt(0)}
                            </span>
                          )
                        ))}
                      </div>
                    </div>

                    <div className="space-y-4">
                      {auditResult.findings && auditResult.findings.length > 0 ? (
                        auditResult.findings.map((v, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 + i * 0.05 }}
                            className={`p-6 rounded-2xl border ${getSeverityBg(v.severity)} group hover:border-white/20 transition-all`}
                          >
                            <div className="flex items-center justify-between mb-3">
                              <span className={`text-[10px] font-black uppercase tracking-widest ${getSeverityColor(v.severity)}`}>
                                {v.severity} Severity
                              </span>
                              {v.line && (
                                <span className="text-[10px] text-gray-600 font-mono">Line {v.line}</span>
                              )}
                            </div>
                            <h4 className="font-bold text-white mb-2">{v.title}</h4>
                            {v.snippet && (
                              <div className="mt-4 p-3 rounded-xl bg-black/40 border border-white/5 font-mono text-[11px] text-gray-400 overflow-x-auto">
                                <code className="block whitespace-pre">{v.snippet}</code>
                              </div>
                            )}
                          </motion.div>
                        ))
                      ) : (
                        <div className="py-20 flex flex-col items-center justify-center text-center opacity-30">
                          <CheckCircle2 className="h-16 w-16 text-white mb-4" />
                          <p className="text-white font-bold text-xl">No vulnerabilities identified</p>
                          <p className="text-sm text-gray-500 mt-1 max-w-xs">Our static analysis engines didn&apos;t flag any major security issues.</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Function Risk Table */}
                  <div className="space-y-8">
                    <div className="rounded-3xl border border-[#1A1A1A] bg-[#0A0A0A] p-8 overflow-hidden">
                      <div className="mb-8">
                        <div className="flex items-center justify-between">
                          <h3 className="text-xl font-bold text-white flex items-center gap-2">
                            <Terminal className="h-5 w-5 text-white" />
                            Function Capability Analysis
                          </h3>
                          <Layers className="h-5 w-5 text-gray-700" />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">High-risk administrative and structural functions</p>
                      </div>

                      <div className="space-y-2">
                        {auditResult.functions && auditResult.functions.length > 0 ? (
                          auditResult.functions.map((fn, i) => (
                            <div
                              key={i}
                              className="group flex items-center justify-between p-4 rounded-2xl border border-[#1A1A1A] bg-[#0D0D0D] hover:bg-[#111111] transition-all"
                            >
                              <div className="flex flex-col">
                                <span className="text-sm text-white font-mono font-medium">{fn.name}()</span>
                                <span className="text-[10px] text-gray-600 uppercase tracking-tighter mt-0.5">{fn.mutability}</span>
                              </div>
                              <div className="flex gap-1.5">
                                {fn.risk_tags.map((tag, ti) => (
                                  <span key={ti} className="px-2 py-0.5 rounded-lg bg-white/10 border border-white/10 text-[9px] text-gray-300 font-black uppercase tracking-tighter">
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="py-12 text-center text-gray-500 text-sm">No significant administrative functions detected.</div>
                        )}
                      </div>
                    </div>

                    {/* Technical Metadata */}
                    <div className="rounded-3xl border border-[#1A1A1A] bg-[#0A0A0A] p-8">
                      <div className="flex items-center gap-2 mb-8">
                        <Cpu className="h-5 w-5 text-white" />
                        <h3 className="text-lg font-bold text-white">Advanced Architecture</h3>
                      </div>

                      <div className="space-y-5">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Layers className="h-4 w-4" />
                            Proxy Implementation
                          </div>
                          <div className={`px-3 py-1 rounded-full text-xs font-bold ${auditResult.metadata.is_proxy ? "text-white bg-white/10" : "text-gray-500 bg-gray-500/10"}`}>
                            {auditResult.metadata.is_proxy ? "Active Proxy" : "None Detected"}
                          </div>
                        </div>

                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Fingerprint className="h-4 w-4" />
                            Pattern Analysis
                          </div>
                          <span className="text-xs font-bold text-white">Identified</span>
                        </div>

                        {Object.entries(auditResult.metadata).filter(([key]) => !['is_proxy', 'source_lines'].includes(key)).slice(0, 3).map(([key, val]) => (
                          <div key={key} className="flex justify-between items-center">
                            <span className="text-sm text-gray-500 capitalize">{key.replace(/_/g, ' ')}</span>
                            <span className="text-xs text-white font-mono">{String(val)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}


          
        </div>
      </main>
    </div>
  )
}
