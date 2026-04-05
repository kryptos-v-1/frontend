"use client";

import { useMemo, useState, useRef } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Loader2, X, Upload, Download } from "lucide-react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { CHAINS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { BatchResult } from "@/types";

const MAX_BATCH_SIZE = 50;

type RankedWallet = BatchResult["results"][number] & {
  rank: number;
};

function getRiskSeverity(label: string | undefined): number {
  const normalized = (label || "").toLowerCase();
  if (normalized.includes("critical")) return 4;
  if (normalized.includes("high")) return 3;
  if (normalized.includes("medium")) return 2;
  if (normalized.includes("low")) return 1;
  return 0;
}

function getRiskColorClass(
  label: string | undefined,
  score: number | undefined,
): string {
  const safeScore = Number.isFinite(score) ? Number(score) : 50;
  if (safeScore <= 40) return "text-gray-500";
  if (safeScore <= 70) return "text-gray-300";
  return "text-white font-bold";
}

function formatAddress(addr: string): string {
  if (!addr) return "";
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function parseWallets(input: string): string[] {
  const parsed = input
    .replace(/\n/g, ",")
    .split(",")
    .map((w) => w.trim().toLowerCase())
    .filter((w) => /^0x[a-fA-F0-9]{40}$/.test(w));

  return [...new Set(parsed)];
}

function rankResults(results: BatchResult["results"]): RankedWallet[] {
  const sorted = [...results].sort((a, b) => {
    if (a.error && !b.error) return 1;
    if (!a.error && b.error) return -1;

    const severityDelta =
      getRiskSeverity(b.risk_label) - getRiskSeverity(a.risk_label);
    if (severityDelta !== 0) return severityDelta;

    return (b.risk_score ?? -1) - (a.risk_score ?? -1);
  });

  return sorted.map((r, idx) => ({ ...r, rank: idx + 1 }));
}

export default function BatchAnalysis() {
  const router = useRouter();

  const [walletInput, setWalletInput] = useState("");
  const [selectedChainId, setSelectedChainId] = useState(1);
  const [quickMode, setQuickMode] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<RankedWallet[]>([]);
  const [summary, setSummary] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const wallets = useMemo(() => parseWallets(walletInput), [walletInput]);

  const canAnalyze =
    wallets.length > 0 && wallets.length <= MAX_BATCH_SIZE && !isAnalyzing;

  const removeWallet = (walletAddress: string) => {
    const next = wallets.filter((w) => w !== walletAddress);
    setWalletInput(next.join(", "));
  };

  const handleAnalyze = async () => {
    if (!canAnalyze) return;

    setIsAnalyzing(true);
    setError(null);
    setResults([]);
    setSummary(null);

    try {
      const response = await api.batch({
        addresses: wallets,
        chain_id: selectedChainId,
        quick: quickMode,
      });

      setSummary(response.summary || (response as unknown as Record<string, unknown>));
      setResults(rankResults(response.results || []));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Batch analysis failed");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsAnalyzing(true);
    setError(null);
    setResults([]);
    setSummary(null);

    try {
      const response = await api.batchUpload(file, selectedChainId, quickMode);
      setSummary(response.summary || (response as unknown as Record<string, unknown>));
      setResults(rankResults(response.results || []));
    } catch (err) {
      setError(err instanceof Error ? err.message : "File upload failed");
    } finally {
      setIsAnalyzing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="rounded-xl border border-[#1A1A1A] bg-[#0A0A0A] p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-white">
            Batch Wallet Analysis
          </h3>
          <p className="text-sm text-[#888]">
            Submit multiple wallets or upload a CSV and rank them by risk severity.
          </p>
        </div>
      </div>

      <div className="mb-4 grid gap-3 md:grid-cols-3">
        <div className="md:col-span-2">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm text-[#888]">
              Wallet Addresses ({wallets.length}/{MAX_BATCH_SIZE})
            </span>
          </div>
          <textarea
            value={walletInput}
            onChange={(e) => setWalletInput(e.target.value)}
            rows={4}
            placeholder="Paste wallet addresses, comma or newline separated"
            disabled={isAnalyzing}
            className={cn(
              "w-full rounded-lg border bg-[#111] px-3 py-2 text-sm font-mono text-white placeholder-[#555] focus:outline-none",
              wallets.length > MAX_BATCH_SIZE
                ? "border-[#FF3B3B]"
                : "border-[#1A1A1A]",
            )}
          />
          {wallets.length > MAX_BATCH_SIZE && (
            <p className="mt-1 text-xs text-[#FF3B3B]">
              Maximum {MAX_BATCH_SIZE} wallets allowed.
            </p>
          )}
          {wallets.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {wallets.map((wallet) => (
                <div
                  key={wallet}
                  className="flex items-center gap-2 rounded-lg border border-[#1A1A1A] bg-[#111] px-3 py-1.5"
                >
                  <span className="font-mono text-xs text-white">
                    {formatAddress(wallet)}
                  </span>
                  <button
                    onClick={() => removeWallet(wallet)}
                    className="text-[#888] hover:text-[#FF3B3B]"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-3">
          <label className="block text-sm text-[#888]">
            Chain
            <select
              value={selectedChainId}
              onChange={(e) => setSelectedChainId(Number(e.target.value))}
              disabled={isAnalyzing}
              className="mt-1 w-full rounded-lg border border-[#1A1A1A] bg-[#111] px-3 py-2 text-sm text-white"
            >
              {CHAINS.filter((c) => c.id !== 84532 && c.id !== 11155111).map(
                (chain) => (
                  <option key={chain.id} value={chain.id}>
                    {chain.name}
                  </option>
                ),
              )}
            </select>
          </label>

          <label className="flex items-center gap-2 rounded-lg border border-[#1A1A1A] bg-[#111] px-3 py-2 text-sm text-[#BFBFBF]">
            <input
              type="checkbox"
              checked={quickMode}
              onChange={(e) => setQuickMode(e.target.checked)}
              disabled={isAnalyzing}
              className="h-4 w-4"
            />
            Quick mode
          </label>

          <div className="flex flex-col gap-2">
            <button
              onClick={handleAnalyze}
              disabled={!canAnalyze}
              className="w-full rounded-lg bg-white py-2 text-sm font-semibold text-black transition-all hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isAnalyzing ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Analyzing...
                </span>
              ) : (
                `Analyze ${wallets.length || 0} Wallet${wallets.length === 1 ? "" : "s"}`
              )}
            </button>
            <div className="relative">
              <input
                type="file"
                accept=".csv"
                ref={fileInputRef}
                onChange={handleFileUpload}
                disabled={isAnalyzing}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
              />
              <button
                disabled={isAnalyzing}
                className="w-full rounded-lg border border-[#333] bg-[#111] py-2 text-sm font-semibold text-white transition-all hover:bg-[#222] disabled:cursor-not-allowed disabled:opacity-40 flex items-center justify-center gap-2"
              >
                <Upload className="h-4 w-4" />
                Upload CSV file
              </button>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-[#333] bg-[#111] p-3 text-sm text-red-500">
          {error}
        </div>
      )}

      {summary && (
        <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-5">
          <div className="rounded-lg bg-[#111] border border-[#222] p-3 text-center">
            <p className="text-xl font-bold text-white">
              {Number(summary.total_analyzed ?? summary.total_addresses ?? summary.successfully_analyzed ?? 0)}
            </p>
            <p className="text-xs text-[#888]">Analyzed</p>
          </div>
          <div className="rounded-lg bg-[#111] border border-[#222] p-3 text-center">
            <p className="text-xl font-bold text-white">
              {Number(summary.high_risk_count ?? 0)}
            </p>
            <p className="text-xs text-[#888]">High Risk</p>
          </div>
          <div className="rounded-lg bg-[#111] border border-[#222] p-3 text-center">
            <p className="text-xl font-bold text-gray-300">
              {Number(summary.medium_risk_count ?? 0)}
            </p>
            <p className="text-xs text-[#888]">Medium Risk</p>
          </div>
          <div className="rounded-lg bg-[#111] border border-[#222] p-3 text-center">
            <p className="text-xl font-bold text-gray-500">
              {Number(summary.low_risk_count ?? 0)}
            </p>
            <p className="text-xs text-[#888]">Low Risk</p>
          </div>
          <div className="rounded-lg bg-[#111] border border-[#222] p-3 text-center">
            <p className="text-xl font-bold text-white">
              {Number(summary.errors ?? results.filter((r) => r.error).length)}
            </p>
            <p className="text-xs text-[#888]">Errors</p>
          </div>
        </div>
      )}

      {results.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-[#1A1A1A]">
          <table className="w-full min-w-[760px]">
            <thead>
              <tr className="bg-[#111] text-left text-xs text-[#888]">
                <th className="px-3 py-2">Rank</th>
                <th className="px-3 py-2">Wallet</th>
                <th className="px-3 py-2">Risk Score</th>
                <th className="px-3 py-2">Risk Label</th>
                <th className="px-3 py-2">Flags</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {results.map((result, idx) => {
                const riskColor = getRiskColorClass(
                  result.risk_label,
                  result.risk_score,
                );
                return (
                  <motion.tr
                    key={`${result.address}-${idx}`}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="border-t border-[#1A1A1A] text-sm"
                  >
                    <td className="px-3 py-2 font-semibold text-gray-500">
                      #{result.rank}
                    </td>
                    <td className="px-3 py-2 font-mono text-white">
                      {formatAddress(result.address)}
                    </td>
                    <td className={cn("px-3 py-2 font-semibold", riskColor)}>
                      {typeof result.risk_score === "number"
                          ? result.risk_score.toFixed(0)
                          : "N/A"}
                    </td>
                    <td className={cn("px-3 py-2", riskColor)}>
                      {result.risk_label || "Unknown"}
                    </td>
                    <td className="px-3 py-2 text-[#BFBFBF]">
                      {result.error
                          ? "-"
                          : result.flags?.length
                            ? result.flags.slice(0, 2).join(" | ")
                            : "None"}
                    </td>
                    <td className={cn("px-3 py-2", result.error ? "text-white font-bold" : "text-gray-400")}>
                      {result.error ? result.error : "Complete"}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() =>
                            router.push(
                              `/wallet-scanner?address=${encodeURIComponent(result.address)}&chain=${selectedChainId}`,
                            )
                          }
                          className="rounded-lg border border-[#333] bg-[#111] px-2 py-1 text-xs text-white hover:border-[#666] transition-colors"
                        >
                          Analyze
                        </button>
                        <button
                          onClick={async () => {
                            try {
                              const blob = await api.reportPdf(result.address, selectedChainId);
                              const url = window.URL.createObjectURL(blob);
                              const link = document.createElement("a");
                              link.href = url;
                              link.download = `kryptos-report-${result.address}.pdf`;
                              document.body.appendChild(link);
                              link.click();
                              document.body.removeChild(link);
                              window.URL.revokeObjectURL(url);
                            } catch (error) {
                              console.error("Failed to export PDF:", error);
                            }
                          }}
                          className="flex items-center gap-1 rounded-lg border border-[#333] bg-[#111] px-2 py-1 text-xs text-white hover:border-[#666] transition-colors"
                        >
                          <Download className="h-3 w-3" />
                          PDF
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
