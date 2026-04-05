"use client";

import { useRouter } from "next/navigation";
import { useSession } from "@/lib/session";
import { Crown, ArrowRight, Lock } from "lucide-react";
import { motion } from "framer-motion";

interface PlanGuardProps {
  children: React.ReactNode;
  requiredPlan?: "pro" | "enterprise";
  feature?: string;
  customMessage?: string;
}

export default function PlanGuard({
  children,
  requiredPlan = "pro",
  feature = "This feature",
  customMessage,
}: PlanGuardProps) {
  const router = useRouter();
  const { user, isAuthenticated } = useSession();

  const userPlan = user?.plan || "free";
  const planHierarchy = { free: 0, pro: 1, enterprise: 2 };
  const userPlanLevel = planHierarchy[userPlan as keyof typeof planHierarchy] || 0;
  const requiredLevel = planHierarchy[requiredPlan];

  if (!isAuthenticated || userPlanLevel >= requiredLevel) {
    return <>{children}</>;
  }

  const handleUpgrade = () => {
    router.push("/pricing");
  };

  return (
    <div className="relative min-h-[280px]">
      {/* Blurred preview of content */}
      <div className="pointer-events-none select-none opacity-40 blur-sm">
        {children}
      </div>

      {/* Lock overlay */}
      <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/40 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.25 }}
          className="mx-4 w-full max-w-sm rounded-2xl border border-[#333] bg-[#0A0A0A]/95 p-8 text-center shadow-2xl"
        >
          {/* Lock icon */}
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/10 ring-1 ring-amber-500/20">
            <Lock className="h-7 w-7 text-amber-400" />
          </div>

          <h3 className="text-lg font-semibold text-white">
            {requiredPlan === "enterprise" ? "Enterprise Feature" : "Pro Feature"}
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-gray-400">
            {customMessage || `${feature} is available with ${requiredPlan === "enterprise" ? "an Enterprise" : "a Pro"} plan.`}
          </p>

          <div className="mt-6 space-y-2">
            <button
              onClick={handleUpgrade}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#00FF94] py-3 text-sm font-semibold text-black transition-all hover:bg-[#00FF94]/90 active:bg-[#00FF94]/80"
            >
              <Crown className="h-4 w-4" />
              Upgrade to {requiredPlan === "enterprise" ? "Enterprise" : "Pro"}
              <ArrowRight className="h-4 w-4" />
            </button>
            <p className="text-xs text-gray-500">
              Current plan: <span className="font-semibold capitalize text-gray-300">{userPlan}</span>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
