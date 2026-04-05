export type Plan = "free" | "pro" | "enterprise";

export interface PlanLimits {
  daily_scans: number | "unlimited";
  chains: number;
  batch_size: number;
  watchlist_limit: number | "unlimited";
  pdf_reports: boolean;
  fund_flow: boolean;
  contract_audit: boolean;
  on_chain_reports: boolean;
  api_access: boolean;
  csv_export: boolean;
}

export const PLAN_LIMITS: Record<Plan, PlanLimits> = {
  free: {
    daily_scans: 5,
    chains: 1,
    batch_size: 0,
    watchlist_limit: 0,
    pdf_reports: false,
    fund_flow: false,
    contract_audit: false,
    on_chain_reports: false,
    api_access: false,
    csv_export: false,
  },
  pro: {
    daily_scans: "unlimited",
    chains: 14,
    batch_size: 10,
    watchlist_limit: 20,
    pdf_reports: true,
    fund_flow: true,
    contract_audit: true,
    on_chain_reports: true,
    api_access: false,
    csv_export: true,
  },
  enterprise: {
    daily_scans: "unlimited",
    chains: 14,
    batch_size: 50,
    watchlist_limit: "unlimited",
    pdf_reports: true,
    fund_flow: true,
    contract_audit: true,
    on_chain_reports: true,
    api_access: true,
    csv_export: true,
  },
};

export const canAccessFeature = (userPlan: Plan, feature: keyof PlanLimits): boolean => {
  const limits = PLAN_LIMITS[userPlan];
  const featureLimit = limits[feature];

  if (typeof featureLimit === "boolean") {
    return featureLimit;
  }

  if (typeof featureLimit === "number") {
    return featureLimit > 0;
  }

  // featureLimit is "unlimited"
  return true;
};

export const getFeatureLimit = (userPlan: Plan, feature: keyof PlanLimits): number | "unlimited" | boolean => {
  return PLAN_LIMITS[userPlan][feature];
};

export const canPerformAction = (userPlan: Plan, action: string, quantity: number = 1): boolean => {
  const limits = PLAN_LIMITS[userPlan];

  switch (action) {
    case "batch_scan":
      return limits.batch_size >= quantity;
    case "watchlist_item":
      return typeof limits.watchlist_limit === "string" || limits.watchlist_limit >= quantity;
    case "pdf_report":
      return limits.pdf_reports;
    case "fund_flow":
      return limits.fund_flow;
    case "contract_audit":
      return limits.contract_audit;
    case "on_chain_report":
      return limits.on_chain_reports;
    case "api_access":
      return limits.api_access;
    case "csv_export":
      return limits.csv_export;
    default:
      return false;
  }
};
