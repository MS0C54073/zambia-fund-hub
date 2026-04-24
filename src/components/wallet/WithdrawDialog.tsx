import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { PAYMENT_PROVIDERS, type PaymentProvider } from "@/hooks/useWallet";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  availableBalance: number;
  onWithdraw: (amount: number, provider: PaymentProvider, phone?: string) => Promise<unknown>;
}

export default function WithdrawDialog({ open, onOpenChange, availableBalance, onWithdraw }: Props) {
  const [amount, setAmount] = useState("");
  const [provider, setProvider] = useState<PaymentProvider>("mtn_momo");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isMobile = PAYMENT_PROVIDERS.find((p) => p.value === provider)?.type === "mobile";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    if (amt > availableBalance) {
      toast.error("Insufficient balance");
      return;
    }
    if (isMobile && !phone.trim()) {
      toast.error("Enter destination mobile number");
      return;
    }
    setSubmitting(true);
    try {
      await onWithdraw(amt, provider, phone.trim() || undefined);
      toast.success("Withdrawal successful", {
        description: `K${amt.toLocaleString()} sent to ${PAYMENT_PROVIDERS.find((p) => p.value === provider)?.label} (simulated).`,
      });
      setAmount("");
      setPhone("");
      onOpenChange(false);
    } catch (err: any) {
      toast.error("Withdrawal failed", { description: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Withdraw from Wallet</DialogTitle>
          <DialogDescription>
            Available: K{availableBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}. Withdrawals are simulated for demo.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Amount (ZMW)</Label>
            <Input
              type="number"
              min="1"
              step="0.01"
              max={availableBalance}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="100.00"
              className="mt-1"
              required
            />
          </div>
          <div>
            <Label>Withdraw to</Label>
            <Select value={provider} onValueChange={(v) => setProvider(v as PaymentProvider)}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_PROVIDERS.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {isMobile && (
            <div>
              <Label>Mobile Number</Label>
              <Input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+260 9X XXX XXXX"
                className="mt-1"
              />
            </div>
          )}
          <Button type="submit" variant="hero" className="w-full" disabled={submitting}>
            {submitting ? "Processing..." : `Withdraw K${amount || "0"}`}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
