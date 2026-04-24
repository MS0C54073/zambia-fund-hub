import { TrendingUp, TrendingDown, Briefcase, CheckCircle2, Wallet } from "lucide-react";
import type { PortfolioSummary as Summary } from "@/hooks/usePortfolio";

interface Props {
  summary: Summary;
  walletBalance: number;
}

export default function PortfolioSummary({ summary, walletBalance }: Props) {
  const { totalInvested, totalReturns, portfolioValue, roiPercent, activeCount, completedCount, uniqueBusinesses } =
    summary;
  const positive = totalReturns >= 0;
  const TrendIcon = positive ? TrendingUp : TrendingDown;

  const cards = [
    {
      label: "Portfolio Value",
      value: `K${portfolioValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      hint: `Cost basis K${totalInvested.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
      icon: Briefcase,
      accent: "text-primary",
    },
    {
      label: "Total Returns",
      value: `${positive ? "+" : ""}K${totalReturns.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
      hint: `${roiPercent.toFixed(2)}% ROI`,
      icon: TrendIcon,
      accent: positive ? "text-green-400" : "text-destructive",
    },
    {
      label: "Active Investments",
      value: activeCount.toString(),
      hint: `${completedCount} completed`,
      icon: CheckCircle2,
      accent: "text-foreground",
    },
    {
      label: "Wallet Balance",
      value: `K${walletBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
      hint: `${uniqueBusinesses} businesses backed`,
      icon: Wallet,
      accent: "text-primary",
    },
  ];

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((c) => {
        const Icon = c.icon;
        return (
          <div key={c.label} className="bg-card rounded-xl border border-border/50 p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-muted-foreground">{c.label}</p>
              <Icon size={16} className={c.accent} />
            </div>
            <p className={`text-2xl font-display font-bold ${c.accent}`}>{c.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{c.hint}</p>
          </div>
        );
      })}
    </div>
  );
}
