import { useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { TrendingUp } from "lucide-react";

interface Props {
  investmentId: string | null;
  investorName?: string;
  businessName?: string;
  baseAmount?: number;
  onClose: () => void;
  onDone: () => void;
}

export default function AdminPayoutDialog({
  investmentId,
  investorName,
  businessName,
  baseAmount,
  onClose,
  onDone,
}: Props) {
  const { toast } = useToast();
  const [kind, setKind] = useState<"payout" | "refund">("payout");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const open = !!investmentId;

  const handleSubmit = async () => {
    if (!investmentId) return;
    const value = parseFloat(amount);
    if (isNaN(value) || value <= 0) {
      toast({ title: "Enter a valid amount", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.rpc("wallet_payout", {
      _investment_id: investmentId,
      _amount: value,
      _kind: kind,
      _description: description || undefined,
    });
    setSubmitting(false);
    if (error) {
      toast({ title: "Payout failed", description: error.message, variant: "destructive" });
      return;
    }
    toast({
      title: kind === "refund" ? "Refund issued" : "Payout credited",
      description: `K${value.toLocaleString()} sent to investor wallet.`,
    });
    setAmount("");
    setDescription("");
    setKind("payout");
    onDone();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp size={18} className="text-primary" />
            Issue payout
          </DialogTitle>
          <DialogDescription>
            Credit {investorName ?? "the investor"} for{" "}
            <span className="text-foreground">{businessName ?? "this investment"}</span>
            {typeof baseAmount === "number" && (
              <> (invested K{baseAmount.toLocaleString()})</>
            )}
            .
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Type</Label>
            <Select value={kind} onValueChange={(v) => setKind(v as "payout" | "refund")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="payout">Payout / ROI return</SelectItem>
                <SelectItem value="refund">Refund (marks investment refunded)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="payout-amount">Amount (ZMW)</Label>
            <Input
              id="payout-amount"
              type="number"
              min="0"
              step="0.01"
              placeholder="e.g. 250.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="payout-desc">Note (optional)</Label>
            <Input
              id="payout-desc"
              placeholder="Q1 dividend, milestone reached…"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Processing…" : kind === "refund" ? "Issue refund" : "Send payout"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
