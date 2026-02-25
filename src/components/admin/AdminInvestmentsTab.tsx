import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle } from "lucide-react";

interface InvestmentRow {
  id: string;
  amount: number;
  currency: string;
  status: string;
  payment_method: string | null;
  payment_reference: string | null;
  created_at: string;
  investor_name?: string;
  business_name?: string;
}

interface Props {
  investments: InvestmentRow[];
  onRefresh: () => void;
}

export default function AdminInvestmentsTab({ investments, onRefresh }: Props) {
  const { toast } = useToast();

  const confirmInvestment = async (id: string) => {
    await supabase.from("investments").update({ status: "confirmed" }).eq("id", id);
    toast({ title: "Investment confirmed" });
    onRefresh();
  };

  const statusColors: Record<string, string> = {
    pledged: "text-yellow-400",
    paid: "text-blue-400",
    confirmed: "text-green-400",
    refunded: "text-muted-foreground",
  };

  return (
    <div className="bg-card rounded-xl border border-border/50 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Investor</TableHead>
            <TableHead>Business</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Method</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {investments.map((inv) => (
            <TableRow key={inv.id}>
              <TableCell className="text-sm text-foreground">{inv.investor_name || "—"}</TableCell>
              <TableCell className="text-sm text-foreground">{inv.business_name || "—"}</TableCell>
              <TableCell className="text-sm font-medium text-foreground">K{Number(inv.amount).toLocaleString()} {inv.currency}</TableCell>
              <TableCell className="text-sm text-muted-foreground">{inv.payment_method || "N/A"}</TableCell>
              <TableCell>
                <span className={`text-xs capitalize ${statusColors[inv.status] || "text-muted-foreground"}`}>
                  {inv.status}
                </span>
              </TableCell>
              <TableCell className="text-xs text-muted-foreground">
                {new Date(inv.created_at).toLocaleDateString()}
              </TableCell>
              <TableCell>
                {(inv.status === "pledged" || inv.status === "paid") && (
                  <Button size="sm" variant="outline" className="text-green-400 border-green-400/30 hover:bg-green-400/10" onClick={() => confirmInvestment(inv.id)}>
                    <CheckCircle size={14} className="mr-1" /> Confirm
                  </Button>
                )}
                {inv.status === "confirmed" && <span className="text-xs text-green-400">✓</span>}
              </TableCell>
            </TableRow>
          ))}
          {investments.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No investments yet.</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
