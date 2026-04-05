"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSession } from "@/lib/session";
import { Search } from "lucide-react";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const { isAuthenticated } = useSession();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex justify-center px-4 pt-4 pointer-events-none">
      <nav
        className="font-array pointer-events-auto flex w-full max-w-5xl items-center justify-between rounded-full border border-white/10 px-8 py-2.5 text-lg transition-all duration-500"
        style={{
          backgroundColor: scrolled
            ? "rgba(0, 0, 0, 0.85)"
            : "rgba(0, 0, 0, 0.2)",
          backdropFilter: `blur(${scrolled ? 24 : 16}px) saturate(180%)`,
          WebkitBackdropFilter: `blur(${scrolled ? 24 : 16}px) saturate(180%)`,
          boxShadow: scrolled ? "0 8px 32px rgba(0, 0, 0, 0.4)" : "none",
          transform: scrolled ? "scale(0.98)" : "scale(1)",
        }}
      >
        <div className="hidden min-w-0 flex-1 items-center gap-8 lg:flex">
          <Link
            href="/"
            className="text-base font-medium tracking-tight transition-all hover:opacity-50"
            style={{ color: "#E5E7EB" }}
          >
            Home
          </Link>
          <Link
            href="/team"
            className="text-base font-medium tracking-tight transition-all hover:opacity-50"
            style={{ color: "#E5E7EB" }}
          >
            Team
          </Link>
        </div>

        <Link
          href="/"
          className="font-quicktext flex items-center justify-center px-4 py-1 text-[1.6rem] leading-none"
          style={{ color: "#E5E7EB" }}
          aria-label="Kryptos home"
        >
          Kryptos
        </Link>

        <div className="flex min-w-0 flex-1 items-center justify-end gap-5 lg:gap-8">
          <Link
            href="/pricing"
            className="text-base font-medium tracking-tight transition-all hover:opacity-50"
            style={{ color: "#E5E7EB" }}
          >
            Pricing
          </Link>
          <Link
            href="/docs"
            className="text-base font-medium tracking-tight transition-all hover:opacity-50"
            style={{ color: "#E5E7EB" }}
          >
            Docs
          </Link>

          {isAuthenticated ? (
            <Link
              href="/wallet-scanner"
              className="flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-5 py-2 text-sm font-semibold text-white hover:bg-white/10 transition-all"
            >
              <Search className="h-4 w-4" />
              Analyze
            </Link>
          ) : (
            <Link
              href="/auth"
              className="rounded-full px-6 py-2.5 text-sm font-semibold tracking-tight transition-all duration-300 hover:opacity-80"
              style={{
                backgroundColor: "#E5E7EB",
                color: "#000000",
                border: "1px solid #333333",
              }}
            >
              Get Started
            </Link>
          )}
        </div>
      </nav>
    </div>
  );
}
