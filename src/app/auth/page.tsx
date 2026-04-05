"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useSession } from "@/lib/session"
import { Loader2, Mail, Lock, ChevronRight, Sparkles } from "lucide-react"

type AuthStep = "register" | "login" | "plan" | "tour"

function AuthPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { isAuthenticated, login, register, loginWithGoogle, completeOnboarding, isOnboardingComplete, token, user } = useSession()


  const [step, setStep] = useState<AuthStep>("register")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [selectedPlan, setSelectedPlan] = useState<string>("free")
  const [tourStep, setTourStep] = useState(0)

  useEffect(() => {
    const stepParam = searchParams.get("step") as AuthStep
    if (stepParam && ["register", "login", "plan", "tour"].includes(stepParam)) {
      setStep(stepParam)
    }
  }, [searchParams])

  const plans = [
    {
      name: "Free",
      price: "$0",
      period: "forever",
      description: "Perfect for exploring Kryptos",
      features: ["5 scans/day", "Basic risk score", "1 blockchain"],
      tier: "free" as const,
    },
    {
      name: "Pro",
      price: "$19",
      period: "/month",
      description: "For serious traders & analysts",
      features: ["Unlimited scans", "All 14 chains", "PDF reports", "Watchlist (20 wallets)"],
      tier: "pro" as const,
    },
    {
      name: "Enterprise",
      price: "$99",
      period: "/month",
      description: "For teams & businesses",
      features: ["Everything in Pro", "API access", "Priority support", "Bulk scan (50/batch)"],
      tier: "enterprise" as const,
    },
  ]

  useEffect(() => {
    const userTier = user?.premium_tier || "free"

    if (isAuthenticated && isOnboardingComplete) {
      router.push("/dashboard")
    } else if (isAuthenticated && userTier !== "free") {
      completeOnboarding()
      router.push("/dashboard")
    } else if (isAuthenticated) {
      setStep("plan")
    }
  }, [isAuthenticated, isOnboardingComplete, user, router, completeOnboarding])

  const handleRegister = async () => {
    if (password !== confirmPassword) {
      setError("Passwords don't match")
      return
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      await register(email, password)
      setStep("plan")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed")
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogin = async () => {
    setIsLoading(true)
    setError(null)

    try {
      await login(email, password)
      await new Promise(resolve => setTimeout(resolve, 200))

      const userTier = user?.premium_tier || "free"

      if (userTier !== "free") {
        completeOnboarding()
        router.push("/dashboard")
      } else {
        setStep("plan")
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Login failed"
      console.error("Login error:", errorMessage)
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setIsLoading(true)
    setError(null)

    try {
      await loginWithGoogle()
      await new Promise(resolve => setTimeout(resolve, 500))
      router.push("/dashboard")
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Google sign in failed"
      console.error("Google sign in error:", errorMessage)
      setError(errorMessage)
      setIsLoading(false)
    }
  }

  const handleSkipWallet = () => {
    setStep("plan")
  }

  const handleSelectPlan = async (plan: string) => {
    setSelectedPlan(plan)
    if (plan === "free") {
      completeOnboarding()
      router.push("/dashboard")
    } else {
      try {
        const response = await fetch("/api/stripe/checkout", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ tier: plan })
        })

        if (response.ok) {
          const data = await response.json()
          if (data.url) {
            window.location.href = data.url
            return
          }
        }
      } catch (err) {
        console.error("Upgrade error:", err)
      }
      setStep("tour")
    }
  }

  const handleSkipTour = () => {
    completeOnboarding()
    router.push("/dashboard")
  }

  const tourSteps = [
    { title: "Scan Any Wallet", description: "Analyze risk scores, transaction history, and token holdings across 14 chains" },
    { title: "Track Suspicious Addresses", description: "Add wallets to your watchlist and get instant alerts on activity" },
    { title: "Generate Reports", description: "Export detailed PDF risk reports for any wallet address" },
  ]

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-white mb-4">
            <span className="text-xl font-bold text-black">K</span>
          </div>
          <h1 className="text-3xl font-bold text-white font-quicktext">KRYPTOS</h1>
          <p className="text-gray-400 mt-2">Blockchain Intelligence Platform</p>
        </div>

        <div className="bg-[#0A0A0A] border border-[#1A1A1A] rounded-2xl p-6">
          {step === "register" && (
            <>
              <h2 className="text-xl font-semibold text-white mb-6">Create Account</h2>

              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-400 mb-1.5 block">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full bg-[#111] border border-[#1A1A1A] rounded-lg pl-10 pr-4 py-2.5 text-white placeholder-gray-600 focus:border-white focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm text-gray-400 mb-1.5 block">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min 8 characters"
                      className="w-full bg-[#111] border border-[#1A1A1A] rounded-lg pl-10 pr-4 py-2.5 text-white placeholder-gray-600 focus:border-white focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm text-gray-400 mb-1.5 block">Confirm Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm password"
                      className="w-full bg-[#111] border border-[#1A1A1A] rounded-lg pl-10 pr-4 py-2.5 text-white placeholder-gray-600 focus:border-white focus:outline-none"
                    />
                  </div>
                </div>

                {error && <p className="text-red-400 text-sm">{error}</p>}

                <button
                  onClick={handleRegister}
                  disabled={isLoading}
                  className="w-full bg-white text-black py-2.5 rounded-lg font-medium hover:bg-gray-200 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Account"}
                  <ChevronRight className="h-4 w-4" />
                </button>

                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-700"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-[#0A0A0A] text-gray-400">or</span>
                  </div>
                </div>

                <button
                  onClick={handleGoogleSignIn}
                  disabled={isLoading}
                  className="w-full bg-white text-black py-2.5 rounded-lg font-medium hover:bg-gray-200 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Continue with Google
                </button>

                <p className="text-center text-gray-400 text-sm">
                  Already have an account?{" "}
                  <button onClick={() => { setStep("login"); setError(null) }} className="text-white hover:underline">
                    Sign in
                  </button>
                </p>
              </div>
            </>
          )}

          {step === "login" && (
            <>
              <h2 className="text-xl font-semibold text-white mb-6">Welcome Back</h2>

              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-400 mb-1.5 block">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full bg-[#111] border border-[#1A1A1A] rounded-lg pl-10 pr-4 py-2.5 text-white placeholder-gray-600 focus:border-white focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm text-gray-400 mb-1.5 block">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter password"
                      className="w-full bg-[#111] border border-[#1A1A1A] rounded-lg pl-10 pr-4 py-2.5 text-white placeholder-gray-600 focus:border-white focus:outline-none"
                    />
                  </div>
                </div>

                {error && <p className="text-red-400 text-sm">{error}</p>}

                <button
                  onClick={handleLogin}
                  disabled={isLoading}
                  className="w-full bg-white text-black py-2.5 rounded-lg font-medium hover:bg-gray-200 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign In"}
                  <ChevronRight className="h-4 w-4" />
                </button>

                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-700"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-[#0A0A0A] text-gray-400">or</span>
                  </div>
                </div>

                <button
                  onClick={handleGoogleSignIn}
                  disabled={isLoading}
                  className="w-full bg-white text-black py-2.5 rounded-lg font-medium hover:bg-gray-200 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Continue with Google
                </button>

                <p className="text-center text-gray-400 text-sm">
                  Don't have an account?{" "}
                  <button onClick={() => { setStep("register"); setError(null) }} className="text-white hover:underline">
                    Sign up
                  </button>
                </p>
              </div>
            </>
          )}



          {step === "plan" && (
            <>
              <div className="text-center mb-6">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-white/10 mb-4">
                  <Sparkles className="h-6 w-6 text-white" />
                </div>
                <h2 className="text-xl font-semibold text-white">Choose Your Plan</h2>
                <p className="text-gray-400 text-sm mt-2">Select a plan that fits your needs</p>
              </div>

              <div className="space-y-3">
                {plans.map((plan) => (
                  <button
                    key={plan.name}
                    onClick={() => handleSelectPlan(plan.tier)}
                    className={`w-full p-4 rounded-lg border text-left transition-all ${selectedPlan === plan.tier
                        ? "border-white bg-white/10"
                        : "border-[#1A1A1A] hover:border-gray-600"
                      }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-white">{plan.name}</h3>
                        <p className="text-xs text-gray-400 mt-1">{plan.description}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-bold text-white">{plan.price}</span>
                        <span className="text-xs text-gray-400">{plan.period}</span>
                      </div>
                    </div>
                  </button>
                ))}

                <button
                  onClick={() => handleSelectPlan("free")}
                  className="w-full text-gray-400 py-2 text-sm hover:text-white"
                >
                  Continue with Free
                </button>
              </div>
            </>
          )}

          {step === "tour" && (
            <>
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center">
                  <div className="flex gap-2 mb-4">
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        className={`h-2 rounded-full transition-all ${i === tourStep ? "w-8 bg-white" : "w-2 bg-gray-600"
                          }`}
                      />
                    ))}
                  </div>
                </div>
                <h2 className="text-xl font-semibold text-white mt-4">{tourSteps[tourStep].title}</h2>
                <p className="text-gray-400 text-sm mt-2">{tourSteps[tourStep].description}</p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleSkipTour}
                  className="flex-1 py-2.5 text-gray-400 hover:text-white"
                >
                  Skip
                </button>
                <button
                  onClick={() => {
                    if (tourStep < 2) {
                      setTourStep(tourStep + 1)
                    } else {
                      completeOnboarding()
                      router.push("/dashboard")
                    }
                  }}
                  className="flex-1 bg-white text-black py-2.5 rounded-lg font-medium hover:bg-gray-200 flex items-center justify-center gap-2"
                >
                  {tourStep < 2 ? "Next" : "Get Started"}
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <Loader2 className="h-8 w-8 animate-spin text-white" />
    </div>
  )
}

export default function AuthPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <AuthPageContent />
    </Suspense>
  )
}