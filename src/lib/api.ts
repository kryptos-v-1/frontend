import type {
  WalletAnalysis,
  BalanceResult,
  TokenPortfolio,
  CrossChainResult,
  TraceResult,
  ResolveResult,
  ChainsResponse,
  GNNAnalysis,
  TemporalAnalysis,
  MEVAnalysis,
  BridgeAnalysis,
  SimilarResult,
  CommunityReportsResult,
  ReportRequest,
  VoteRequest,
  BatchResult,
  TokenScanResult,
  ContractAuditResult,
  ContractNlpResult,
  WatchlistQuickScore,
  SharedReport,
  SharedReportMeta,
  OnChainReportResult,
  HealthCheck,
  ChainInfo,
  BatchRequest,
  BatchCsvRequest,
  ShareRequest,
} from "@/types"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://kryptos-backend-uq36.onrender.com"

let authToken: string | null = null

export function setAuthToken(token: string | null) {
  authToken = token
}

export function getAuthToken(): string | null {
  return authToken
}

async function fetchApi<T>(endpoint: string, options?: RequestInit & { requireAuth?: boolean }): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...options?.headers as Record<string, string>,
  }
  
  // Only add auth header if explicitly required (default: false for public endpoints)
  if (options?.requireAuth && authToken) {
    headers["Authorization"] = `Bearer ${authToken}`
  }
  
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
    mode: 'cors',
    credentials: 'omit',
  })
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.detail || `API request failed: ${response.statusText}`)
  }
  
  return response.json()
}

export const api = {
  health: () => fetchApi<HealthCheck>("/health"),
  
  chains: () => fetchApi<ChainsResponse>("/chains"),
  
  // Public endpoint - no auth required
  analyze: (address: string, chainId: number = 1) =>
    fetchApi<WalletAnalysis>(`/analyze/${address}?chain_id=${chainId}`),
  
  balance: (address: string, chainId: number = 1) =>
    fetchApi<BalanceResult>(`/balance/${address}?chain_id=${chainId}`),
  
  tokens: (address: string, chainId: number = 1) =>
    fetchApi<TokenPortfolio>(`/tokens/${address}?chain_id=${chainId}`),
  
  crossChain: (address: string) =>
    fetchApi<CrossChainResult>(`/cross-chain/${address}`),
  
  trace: (address: string, chainId: number = 1, depth: number = 3, minValue: number = 0.01, direction: "in" | "out" = "out") =>
    fetchApi<TraceResult>(`/trace/${address}?chain_id=${chainId}&depth=${depth}&min_value=${minValue}&direction=${direction}`),
  
  resolve: (name: string) =>
    fetchApi<ResolveResult>(`/resolve/${name}`),
  
  sanctions: (address: string) =>
    fetchApi<{ is_sanctioned: boolean; is_mixer: boolean; risk_modifier: number; sanctions_list?: string }>(`/sanctions/${address}`),
  
  similar: (address: string, chainId: number = 1, topK: number = 5) =>
    fetchApi<SimilarResult>(`/similar/${address}?chain_id=${chainId}&top_k=${topK}`),
  
  gnn: (address: string, chainId: number = 1) =>
    fetchApi<GNNAnalysis>(`/gnn/${address}?chain_id=${chainId}`),
  
  temporal: (address: string, chainId: number = 1) =>
    fetchApi<TemporalAnalysis>(`/temporal/${address}?chain_id=${chainId}`),
  
  mev: (address: string, chainId: number = 1) =>
    fetchApi<MEVAnalysis>(`/mev/${address}?chain_id=${chainId}`),
  
  bridges: (address: string, chainId: number = 1) =>
    fetchApi<BridgeAnalysis>(`/bridges/${address}?chain_id=${chainId}`),
  
  report: (address: string) =>
    fetchApi<OnChainReportResult>(`/report/${address}`),
  
  reportPdf: (address: string, chainId: number = 1): Promise<Blob> => {
    const headers: Record<string, string> = {}
    if (authToken) {
      headers["Authorization"] = `Bearer ${authToken}`
    }
    return fetch(`${API_BASE_URL}/report/${address}/pdf?chain_id=${chainId}`, { 
      headers,
      mode: 'cors',
      credentials: 'omit',
    }).then(res => {
      if (!res.ok) throw new Error("Failed to generate PDF")
      return res.blob()
    })
  },
  
  communityReport: (req: ReportRequest) =>
    fetchApi<{ success: boolean; report_id: string }>("/community/report", {
      method: "POST",
      body: JSON.stringify(req),
    }),
  
  communityReports: (address: string, limit: number = 50) =>
    fetchApi<CommunityReportsResult>(`/community/reports/${address}?limit=${limit}`),
  
  communityVote: (req: VoteRequest) =>
    fetchApi<{ success: boolean; votes: number }>("/community/vote", {
      method: "POST",
      body: JSON.stringify(req),
    }),
  
  communityRecent: (limit: number = 20) =>
    fetchApi<CommunityReportsResult>(`/community/recent?limit=${limit}`),
  
  communityFlagged: (minReports: number = 2) =>
    fetchApi<{ addresses: Array<{ address: string; report_count: number; categories: string[] }> }>(`/community/flagged?min_reports=${minReports}`),
  
  batch: (req: BatchRequest) =>
    fetchApi<BatchResult>("/batch", {
      method: "POST",
      body: JSON.stringify(req),
    }),
  
  batchCsv: (req: BatchCsvRequest) =>
    fetchApi<BatchResult>("/batch/csv", {
      method: "POST",
      body: JSON.stringify(req),
    }),
    
  batchUpload: (file: File, chainId: number = 1, quick: boolean = true) => {
    const formData = new FormData()
    formData.append("file", file)
    formData.append("chain_id", chainId.toString())
    formData.append("quick", quick.toString())

    const headers: Record<string, string> = {}
    if (authToken) headers["Authorization"] = `Bearer ${authToken}`

    return fetch(`${API_BASE_URL}/batch/upload`, {
      method: "POST",
      headers,
      body: formData,
      mode: 'cors',
      credentials: 'omit',
    }).then(async (res) => {
      if (!res.ok) {
        const error = await res.json().catch(() => ({}))
        throw new Error(error.detail || `Upload failed: ${res.statusText}`)
      }
      return res.json() as Promise<BatchResult & { summary: Record<string, unknown> }>
    })
  },
  
  tokenScan: (address: string, chainId: number = 1) =>
    fetchApi<TokenScanResult>(`/token-scan/${address}?chain_id=${chainId}`),
  
  contractAudit: (address: string, chainId: number = 1) =>
    fetchApi<ContractAuditResult>(`/contract-audit/${address}?chain_id=${chainId}`),
  
  contractAuditAnalyze: (auditText: string, contractAddress: string) =>
    fetchApi<ContractNlpResult>(`/contract-audit-analyze`, {
      method: "POST",
      body: JSON.stringify({ audit_text: auditText, contract_address: contractAddress }),
    }),
  
  watchlistQuickScore: (address: string, chainId: number = 1) =>
    fetchApi<WatchlistQuickScore>(`/watchlist/quick-score/${address}?chain_id=${chainId}`),
  
  createShare: (req: ShareRequest) =>
    fetchApi<{ report_id: string; url: string; address: string; risk_score: number; risk_label: string }>("/share", {
      method: "POST",
      body: JSON.stringify(req),
    }),
  
  getSharedReport: (reportId: string) =>
    fetchApi<SharedReport>(`/shared/${reportId}`),
  
  getSharedReportMeta: (reportId: string) =>
    fetchApi<SharedReportMeta>(`/shared/${reportId}/meta`),
    
  // User Data API (Next.js route)
  getUserData: () => {
    const headers: Record<string, string> = { "Content-Type": "application/json" }
    if (authToken) headers["Authorization"] = `Bearer ${authToken}`
    return fetch("/api/user/data", { headers })
      .then(res => {
        if (!res.ok) throw new Error("Failed to get user data")
        return res.json()
      })
  },
  
  updateUserData: (body: any) => {
    const headers: Record<string, string> = { "Content-Type": "application/json" }
    if (authToken) headers["Authorization"] = `Bearer ${authToken}`
    return fetch("/api/user/data", {
      method: "POST",
      headers,
      body: JSON.stringify(body)
    }).then(res => {
      if (!res.ok) throw new Error("Failed to update user data")
      return res.json()
    })
  },

  // Plan Management API (Next.js routes)
  getPlans: () => {
    return fetch("/api/auth/plans").then(res => {
      if (!res.ok) throw new Error("Failed to fetch plans")
      return res.json()
    })
  },

  getUserPlan: async () => {
    const headers: Record<string, string> = { "Content-Type": "application/json" }
    if (authToken) headers["Authorization"] = `Bearer ${authToken}`
    
    const defaultPlan = {
      plan: "free",
      daily_scans_used: 0,
      daily_scans_limit: 5,
      features: {
        daily_scans: 5,
        chains: 1,
        pdf_reports: false,
        api_access: false,
        watchlist_limit: 0,
        batch_size: 0,
        csv_export: false,
        fund_flow: false,
        contract_audit: false,
        on_chain_reports: false,
      },
    }
    
    try {
      const res = await fetch("/api/auth/plan", { headers })
      if (!res.ok) {
        return defaultPlan
      }
      return await res.json()
    } catch (err) {
      return defaultPlan
    }
  },

  updateUserPlan: (planData: any) => {
    const headers: Record<string, string> = { "Content-Type": "application/json" }
    if (authToken) headers["Authorization"] = `Bearer ${authToken}`
    return fetch("/api/auth/plan", {
      method: "PUT",
      headers,
      body: JSON.stringify(planData)
    }).then(res => {
      if (!res.ok) throw new Error("Failed to update plan")
      return res.json()
    })
  },

  triggerCrossChainWorkflow: async (address: string) => {
    const webhookUrl = process.env.NEXT_PUBLIC_SUPERPLANE_WEBHOOK_URL
    if (!webhookUrl) {
      console.warn("SuperPlane webhook URL not configured")
      return
    }

    try {
      // Fire and forget - don't wait for response
      fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address }),
        mode: "cors",
        credentials: "omit",
      }).catch(err => console.error("Webhook error:", err))
    } catch (err) {
      console.error("Failed to trigger workflow:", err)
    }
  },

  triggerSanctionsScan: async (address: string) => {
    const webhookUrl = process.env.NEXT_PUBLIC_SUPERPLANE_SANCTIONS_WEBHOOK_URL
    if (!webhookUrl) {
      console.warn("SuperPlane sanctions webhook URL not configured")
      return
    }

    try {
      // Fire and forget - don't wait for response
      fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address }),
        mode: "cors",
        credentials: "omit",
      }).catch(err => console.error("Sanctions webhook error:", err))
    } catch (err) {
      console.error("Failed to trigger sanctions scan:", err)
    }
  }
}

export type ApiClient = typeof api
