import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Tables } from "@/integrations/supabase/types";

type Transaction = Tables<"transactions">;

interface Props {
  transactions: Transaction[];
}

export default function AdminTransactionsTab({ transactions }: Props) {
  return (
    <div className="bg-card rounded-xl border border-border/50 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Type</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Provider</TableHead>
            <TableHead>Reference</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((tx) => (
            <TableRow key={tx.id}>
              <TableCell className="text-sm capitalize text-foreground">{tx.type}</TableCell>
              <TableCell className="text-sm font-medium text-foreground">K{Number(tx.amount).toLocaleString()} {tx.currency}</TableCell>
              <TableCell className="text-sm text-muted-foreground">{tx.payment_provider || "—"}</TableCell>
              <TableCell className="text-xs text-muted-foreground font-mono">{tx.payment_reference || "—"}</TableCell>
              <TableCell>
                <span className={`text-xs capitalize ${tx.status === "completed" ? "text-green-400" : tx.status === "pending" ? "text-yellow-400" : "text-muted-foreground"}`}>
                  {tx.status}
                </span>
              </TableCell>
              <TableCell className="text-xs text-muted-foreground">{new Date(tx.created_at).toLocaleDateString()}</TableCell>
            </TableRow>
          ))}
          {transactions.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No transactions yet.</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
