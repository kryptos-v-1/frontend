import { useState, useCallback, useEffect } from "react";
import { api } from "./api";

export interface UserPlanData {
  plan: "free" | "pro" | "enterprise";
  daily_scans_used: number;
  daily_scans_limit: number;
  features: {
    daily_scans: number | "unlimited";
    chains: number;
    pdf_reports: boolean;
    api_access: boolean;
    watchlist_limit: number | "unlimited";
    batch_size: number;
    csv_export: boolean;
    fund_flow: boolean;
    contract_audit: boolean;
    on_chain_reports: boolean;
  };
}

export const usePlanData = () => {
  const [planData, setPlanData] = useState<UserPlanData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPlanData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await api.getUserPlan();
      setPlanData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch plan data");
      setPlanData(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const upgradePlan = useCallback(async (newPlan: string) => {
    try {
      setIsLoading(true);
      const data = await api.updateUserPlan({ plan: newPlan });
      setPlanData(data);
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to upgrade plan";
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    planData,
    isLoading,
    error,
    fetchPlanData,
    upgradePlan,
  };
};
