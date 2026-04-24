import { Wallet as WalletIcon, ArrowDownToLine, ArrowUpFromLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Wallet } from "@/hooks/useWallet";

interface Props {
  wallet: Wallet | null;
  loading?: boolean;
  onDeposit: () => void;
  onWithdraw: () => void;
}

export default function WalletCard({ wallet, loading, onDeposit, onWithdraw }: Props) {
  return (
    <div className="bg-gradient-to-br from-primary/10 via-card to-card rounded-2xl border border-primary/20 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <WalletIcon size={16} className="text-primary" />
          My Wallet
        </div>
        <span className="text-xs text-muted-foreground">{wallet?.currency ?? "ZMW"}</span>
      </div>

      <div className="mb-6">
        <p className="text-xs text-muted-foreground mb-1">Available balance</p>
        <p className="text-3xl md:text-4xl font-display font-bold text-foreground">
          {loading
            ? "—"
            : `K${Number(wallet?.balance ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
        </p>
      </div>

      <div className="flex gap-3">
        <Button variant="hero" size="sm" onClick={onDeposit} className="flex-1">
          <ArrowDownToLine size={14} className="mr-1" /> Deposit
        </Button>
        <Button variant="outline" size="sm" onClick={onWithdraw} className="flex-1">
          <ArrowUpFromLine size={14} className="mr-1" /> Withdraw
        </Button>
      </div>
    </div>
  );
}
