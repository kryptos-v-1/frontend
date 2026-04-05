"use client";

import { useSession } from "@/lib/session";
import { Crown, Zap } from "lucide-react";

export default function PlanBadge() {
  const { user } = useSession();

  if (!user) return null;

  const userPlan = user.plan || "free";
  const dailyUsed = user.daily_scans_used || 0;
  const dailyLimit = user.daily_scans_limit || 5;

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case "enterprise":
        return "from-purple-600 to-purple-700";
      case "pro":
        return "from-emerald-500 to-green-600";
      default:
        return "from-gray-600 to-gray-700";
    }
  };

  const getPlanLabel = (plan: string) => {
    switch (plan) {
      case "enterprise":
        return "Enterprise";
      case "pro":
        return "Pro";
      default:
        return "Free";
    }
  };

  return (
    <div className="flex items-center gap-3">
      {/* Plan Badge */}
      <div className={`bg-gradient-to-r ${getPlanColor(userPlan)} rounded-full px-3 py-1 text-xs font-semibold text-white flex items-center gap-1`}>
        <Crown className="h-3 w-3" />
        {getPlanLabel(userPlan)}
      </div>

      {/* Daily Scans Usage */}
      {userPlan === "free" && (
        <div className="text-xs text-gray-400 flex items-center gap-1">
          <Zap className="h-3 w-3 text-amber-400" />
          <span>
            <span className="font-semibold text-white">{dailyUsed}</span>
            <span className="text-gray-500">/{dailyLimit}</span>
            {" "}scans today
          </span>
        </div>
      )}
    </div>
  );
}
