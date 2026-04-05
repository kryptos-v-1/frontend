// Wallet connection system removed.
// This stub exists so existing imports don't break at runtime.

export function formatAddress(addr: string | null): string {
  if (!addr) return ""
  if (addr.length <= 12) return addr
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`
}

export function formatBalance(balance: string | null): string {
  if (!balance) return "0"
  const num = parseFloat(balance)
  if (num >= 1000) return `${(num / 1000).toFixed(2)}K`
  if (num >= 1) return num.toFixed(4)
  return num.toFixed(6)
}
