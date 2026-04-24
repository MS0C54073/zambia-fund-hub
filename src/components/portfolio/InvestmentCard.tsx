import { Link } from "react-router-dom";
import { ArrowUpRight, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import RealtimeProgressBar from "@/components/RealtimeProgressBar";
import type { InvestmentWithRelations } from "@/hooks/usePortfolio";
import { formatDistanceToNow } from "date-fns";

interface Props {
  investment: InvestmentWithRelations;
}

const STATUS_COLORS: Record<string, string> = {
  pledged: "bg-yellow-500/10 text-yellow-400",
  paid: "bg-blue-500/10 text-blue-400",
  confirmed: "bg-green-500/10 text-green-400",
  refunded: "bg-destructive/10 text-destructive",
};

const FUNDING_LABEL: Record<string, string> = {
  equity: "Equity",
  revenue_share: "Revenue Share",
  loan: "Loan",
  crowdfunding: "Donation",
};

export default function InvestmentCard({ investment }: Props) {
  const { campaign, business, amount, returns, status, created_at, currency } = investment;
  const invested = Number(amount);
  const roi = invested > 0 ? (returns / invested) * 100 : 0;
  const positive = returns >= 0;

  return (
    <div className="bg-card rounded-xl border border-border/50 p-5 hover:border-primary/30 transition-colors">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-display font-semibold text-foreground truncate">
              {business?.name ?? "Business"}
            </h3>
            {business?.is_verified && (
              <span className="text-xs text-primary" title="Verified">✓</span>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
            {campaign && (
              <span className="px-2 py-0.5 rounded-full bg-secondary">
                {FUNDING_LABEL[campaign.funding_type] ?? campaign.funding_type}
              </span>
            )}
            <span className={`px-2 py-0.5 rounded-full uppercase tracking-wide ${STATUS_COLORS[status] ?? "bg-secondary"}`}>
              {status}
            </span>
            {business?.province && (
              <span className="flex items-center gap-1">
                <MapPin size={11} />
                {business.province}
              </span>
            )}
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className="font-display font-bold text-foreground">
            {currency} {invested.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(created_at), { addSuffix: true })}
          </p>
        </div>
      </div>

      {campaign && (
        <div className="mb-4">
          <RealtimeProgressBar
            raised={Number(campaign.raised_amount)}
            goal={Number(campaign.goal_amount)}
          />
        </div>
      )}

      <div className="grid grid-cols-3 gap-3 pt-3 border-t border-border/30">
        <div>
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Returns</p>
          <p className={`text-sm font-display font-semibold ${positive ? "text-green-400" : "text-destructive"}`}>
            {positive ? "+" : ""}K{returns.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">ROI</p>
          <p className={`text-sm font-display font-semibold ${positive ? "text-green-400" : "text-destructive"}`}>
            {roi.toFixed(2)}%
          </p>
        </div>
        <div className="flex items-end justify-end">
          {business && (
            <Button size="sm" variant="ghost" asChild>
              <Link to={`/business/${business.id}`}>
                View <ArrowUpRight size={14} className="ml-1" />
              </Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
