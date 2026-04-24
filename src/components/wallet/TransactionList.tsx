import { ArrowDownLeft, ArrowUpRight, TrendingUp, RotateCcw } from "lucide-react";
import type { WalletTransaction } from "@/hooks/useWallet";
import { formatDistanceToNow } from "date-fns";

interface Props {
  transactions: WalletTransaction[];
  emptyText?: string;
}

const TYPE_META: Record<string, { icon: typeof ArrowDownLeft; color: string; sign: string }> = {
  deposit: { icon: ArrowDownLeft, color: "text-green-400", sign: "+" },
  withdrawal: { icon: ArrowUpRight, color: "text-orange-400", sign: "-" },
  investment: { icon: TrendingUp, color: "text-primary", sign: "-" },
  payout: { icon: ArrowDownLeft, color: "text-green-400", sign: "+" },
  refund: { icon: RotateCcw, color: "text-blue-400", sign: "+" },
  fee: { icon: ArrowUpRight, color: "text-muted-foreground", sign: "-" },
};

export default function TransactionList({ transactions, emptyText = "No transactions yet." }: Props) {
  if (transactions.length === 0) {
    return (
      <div className="bg-card rounded-xl border border-border/50 p-8 text-center text-sm text-muted-foreground">
        {emptyText}
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl border border-border/50 divide-y divide-border/30">
      {transactions.map((tx) => {
        const meta = TYPE_META[tx.type] ?? TYPE_META.fee;
        const Icon = meta.icon;
        return (
          <div key={tx.id} className="flex items-center gap-4 p-4">
            <div className={`w-9 h-9 rounded-full bg-secondary flex items-center justify-center ${meta.color} shrink-0`}>
              <Icon size={16} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground capitalize truncate">
                {tx.description ?? tx.type.replace("_", " ")}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(tx.created_at), { addSuffix: true })}
                {tx.provider && ` • ${tx.provider.replace("_", " ")}`}
                <span className={`ml-2 px-1.5 py-0.5 rounded text-[10px] uppercase ${
                  tx.status === "completed" ? "bg-green-500/10 text-green-400"
                  : tx.status === "pending" ? "bg-yellow-500/10 text-yellow-400"
                  : "bg-destructive/10 text-destructive"
                }`}>
                  {tx.status}
                </span>
              </p>
            </div>
            <div className={`text-sm font-display font-semibold ${meta.color}`}>
              {meta.sign}K{Number(tx.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
