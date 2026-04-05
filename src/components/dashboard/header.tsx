"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { Search, Bell, X, User } from "lucide-react"
import { useSession } from "@/lib/session"

export default function Header() {
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const { user } = useSession()

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="fixed top-0 right-0 z-30 flex h-16 items-center justify-between border-b border-[#1A1A1A] bg-[#000000]/95 px-6 backdrop-blur-sm"
      style={{ left: "16rem" }}
    >
      <div className="flex items-center gap-4">
        <div className="relative">
          <button
            onClick={() => setSearchOpen(true)}
            className="flex items-center gap-2 rounded-lg border border-[#1A1A1A] bg-[#0A0A0A] px-4 py-2 text-sm text-[#888888] hover:border-[#00FF94] hover:text-white"
          >
            <Search className="h-4 w-4" />
            <span>Search wallet address...</span>
            <kbd className="ml-4 rounded bg-[#1A1A1A] px-1.5 py-0.5 text-xs">⌘K</kbd>
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button className="relative rounded-lg p-2 text-[#888888] hover:bg-[#1A1A1A] hover:text-white">
          <Bell className="h-5 w-5" />
          <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-[#FF3B3B]" />
        </button>

        <Link href="/profile" className="rounded-lg p-2 text-[#888888] hover:bg-[#1A1A1A] hover:text-white">
          <User className="h-5 w-5" />
        </Link>
      </div>

      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-start justify-center bg-black/80 pt-24 backdrop-blur-sm"
            onClick={() => setSearchOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              className="w-full max-w-2xl rounded-xl border border-[#1A1A1A] bg-[#0A0A0A] p-4 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 border-b border-[#1A1A1A] pb-4">
                <Search className="h-5 w-5 text-[#888888]" />
                <input
                  type="text"
                  placeholder="Search wallet address, ENS name, or transaction hash..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 bg-transparent text-white placeholder-[#555555] focus:outline-none"
                  autoFocus
                />
                <button onClick={() => setSearchOpen(false)}>
                  <X className="h-5 w-5 text-[#888888]" />
                </button>
              </div>
              <div className="mt-4">
                <p className="text-xs text-[#555555]">Recent searches</p>
                <div className="mt-2 space-y-2">
                  <p className="px-3 py-2 text-sm text-[#555555]">No recent searches</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  )
}
