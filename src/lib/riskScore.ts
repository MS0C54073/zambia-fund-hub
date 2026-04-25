import type { Tables } from "@/integrations/supabase/types";

type Business = Tables<"businesses">;
type Campaign = Tables<"campaigns">;

export type RiskLevel = "low" | "medium" | "high";

export interface RiskAssessment {
  /** 0–100, higher = safer */
  score: number;
  level: RiskLevel;
  label: string;
  /** Human-readable factors that pushed the score up or down */
  factors: { label: string; positive: boolean }[];
}

/**
 * Simple, transparent risk score:
 * - Verification (40%): is_verified, is_approved, registration_number
 * - Profile completeness (35%): description, industry, province, logo, pitch_deck, valuation
 * - Traction (25%): campaign exists, % of goal raised
 *
 * The output is intentionally generous on partial data so very new businesses
 * still surface a meaningful score rather than 0.
 */
export function assessRisk(business: Business, campaign?: Campaign | null): RiskAssessment {
  const factors: RiskAssessment["factors"] = [];

  // --- Verification (max 40) ---
  let verification = 0;
  if (business.is_verified) {
    verification += 25;
    factors.push({ label: "Identity verified", positive: true });
  } else {
    factors.push({ label: "Not yet verified", positive: false });
  }
  if (business.is_approved) verification += 10;
  if (business.registration_number) {
    verification += 5;
    factors.push({ label: "Registration number on file", positive: true });
  }

  // --- Completeness (max 35) ---
  let completeness = 0;
  const completenessChecks: [boolean, number, string][] = [
    [!!business.description && business.description.length > 60, 8, "Detailed description"],
    [!!business.industry, 5, "Industry specified"],
    [!!business.province, 4, "Location set"],
    [!!business.logo_url, 4, "Has logo"],
    [!!business.pitch_deck_url, 8, "Pitch deck uploaded"],
    [!!business.valuation && Number(business.valuation) > 0, 6, "Valuation disclosed"],
  ];
  for (const [pass, weight, label] of completenessChecks) {
    if (pass) {
      completeness += weight;
      factors.push({ label, positive: true });
    }
  }

  // --- Traction (max 25) ---
  let traction = 0;
  if (campaign) {
    traction += 8;
    const goal = Number(campaign.goal_amount) || 0;
    const raised = Number(campaign.raised_amount) || 0;
    if (goal > 0) {
      const pct = Math.min(1, raised / goal);
      traction += Math.round(pct * 17);
      if (pct >= 0.25) factors.push({ label: `${Math.round(pct * 100)}% funded`, positive: true });
    }
  } else {
    factors.push({ label: "No active campaign", positive: false });
  }

  const score = Math.min(100, verification + completeness + traction);

  let level: RiskLevel;
  let label: string;
  if (score >= 70) {
    level = "low";
    label = "Lower risk";
  } else if (score >= 45) {
    level = "medium";
    label = "Moderate risk";
  } else {
    level = "high";
    label = "Higher risk";
  }

  return { score, level, label, factors: factors.slice(0, 6) };
}

export const RISK_LEVEL_STYLES: Record<RiskLevel, string> = {
  low: "bg-green-500/10 text-green-400 border-green-500/30",
  medium: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30",
  high: "bg-destructive/10 text-destructive border-destructive/30",
};
