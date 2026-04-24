import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type Investment = Tables<"investments">;
export type Campaign = Tables<"campaigns">;
export type Business = Tables<"businesses">;
export type WalletTransaction = Tables<"wallet_transactions">;

export interface InvestmentWithRelations extends Investment {
  campaign: Campaign | null;
  business: Business | null;
  /** All payouts/refunds tied to this investment from the wallet ledger */
  returns: number;
}

export interface PortfolioSummary {
  totalInvested: number;
  totalReturns: number;
  portfolioValue: number;
  roiPercent: number;
  activeCount: number;
  completedCount: number;
  pledgedCount: number;
  uniqueBusinesses: number;
}

const ACTIVE_CAMPAIGN_STATUSES = new Set(["active", "pending_review", "draft"]);

function summarize(items: InvestmentWithRelations[]): PortfolioSummary {
  const totalInvested = items.reduce((s, i) => s + Number(i.amount), 0);
  const totalReturns = items.reduce((s, i) => s + i.returns, 0);
  const portfolioValue = totalInvested + totalReturns;
  const roiPercent = totalInvested > 0 ? (totalReturns / totalInvested) * 100 : 0;

  const activeCount = items.filter(
    (i) => i.campaign && ACTIVE_CAMPAIGN_STATUSES.has(i.campaign.status)
  ).length;
  const completedCount = items.filter(
    (i) => i.campaign && (i.campaign.status === "funded" || i.campaign.status === "closed")
  ).length;
  const pledgedCount = items.filter((i) => i.status === "pledged").length;
  const uniqueBusinesses = new Set(items.map((i) => i.business?.id).filter(Boolean)).size;

  return {
    totalInvested,
    totalReturns,
    portfolioValue,
    roiPercent,
    activeCount,
    completedCount,
    pledgedCount,
    uniqueBusinesses,
  };
}

export function usePortfolio(userId: string | undefined) {
  const [investments, setInvestments] = useState<InvestmentWithRelations[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPortfolio = useCallback(async () => {
    if (!userId) {
      setInvestments([]);
      setLoading(false);
      return;
    }
    setLoading(true);

    const [invRes, payoutsRes] = await Promise.all([
      supabase
        .from("investments")
        .select("*, campaigns(*, businesses(*))")
        .eq("investor_id", userId)
        .order("created_at", { ascending: false }),
      supabase
        .from("wallet_transactions")
        .select("amount, type, related_investment_id")
        .eq("user_id", userId)
        .in("type", ["payout", "refund"])
        .eq("status", "completed"),
    ]);

    const returnsByInvestment = new Map<string, number>();
    for (const tx of payoutsRes.data ?? []) {
      if (!tx.related_investment_id) continue;
      returnsByInvestment.set(
        tx.related_investment_id,
        (returnsByInvestment.get(tx.related_investment_id) ?? 0) + Number(tx.amount)
      );
    }

    const enriched: InvestmentWithRelations[] = ((invRes.data ?? []) as any[]).map((inv) => ({
      ...inv,
      campaign: inv.campaigns ?? null,
      business: inv.campaigns?.businesses ?? null,
      returns: returnsByInvestment.get(inv.id) ?? 0,
    }));

    setInvestments(enriched);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchPortfolio();
  }, [fetchPortfolio]);

  const summary = summarize(investments);
  const active = investments.filter(
    (i) => i.campaign && ACTIVE_CAMPAIGN_STATUSES.has(i.campaign.status)
  );
  const completed = investments.filter(
    (i) => i.campaign && (i.campaign.status === "funded" || i.campaign.status === "closed")
  );

  return { investments, active, completed, summary, loading, refresh: fetchPortfolio };
}
