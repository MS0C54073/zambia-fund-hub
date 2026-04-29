import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AlertTriangle, RefreshCw, Trash2, Search } from "lucide-react";

interface ErrorLogRow {
  id: string;
  user_id: string | null;
  category: string;
  source: string | null;
  message: string;
  context: any;
  created_at: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  rls: "text-red-400",
  rpc: "text-orange-400",
  payment: "text-yellow-400",
  transaction: "text-yellow-400",
  auth: "text-blue-400",
  perf: "text-purple-400",
  render: "text-pink-400",
  other: "text-muted-foreground",
};

export default function AdminErrorLogsTab() {
  const { toast } = useToast();
  const [rows, setRows] = useState<ErrorLogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("all");

  const fetchLogs = async () => {
    setLoading(true);
    let q = supabase
      .from("error_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);
    if (category !== "all") q = q.eq("category", category);
    const { data, error } = await q;
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setRows((data ?? []) as ErrorLogRow[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchLogs();
  }, [category]);

  const filtered = rows.filter(
    (r) =>
      r.message.toLowerCase().includes(search.toLowerCase()) ||
      (r.source ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const clearAll = async () => {
    if (!confirm("Delete ALL error log entries? This cannot be undone.")) return;
    const { error } = await supabase.from("error_logs").delete().not("id", "is", null);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Logs cleared" });
      fetchLogs();
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
          <Input
            placeholder="Search messages..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-secondary border-border"
          />
        </div>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-[160px] bg-secondary border-border">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            <SelectItem value="rls">RLS denials</SelectItem>
            <SelectItem value="rpc">RPC failures</SelectItem>
            <SelectItem value="perf">Performance</SelectItem>
            <SelectItem value="payment">Payment</SelectItem>
            <SelectItem value="transaction">Transaction</SelectItem>
            <SelectItem value="auth">Auth</SelectItem>
            <SelectItem value="render">Render</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="ghost" size="sm" onClick={fetchLogs} disabled={loading}>
          <RefreshCw size={14} className={`mr-1 ${loading ? "animate-spin" : ""}`} /> Refresh
        </Button>
        <Button variant="ghost" size="sm" onClick={clearAll} className="text-destructive">
          <Trash2 size={14} className="mr-1" /> Clear all
        </Button>
        <span className="text-xs text-muted-foreground ml-auto">{filtered.length} entries</span>
      </div>

      <div className="bg-card rounded-xl border border-border/50 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[160px]">Time</TableHead>
              <TableHead className="w-[110px]">Category</TableHead>
              <TableHead className="w-[160px]">Source</TableHead>
              <TableHead>Message</TableHead>
              <TableHead className="w-[120px]">User</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8 text-sm">
                  <AlertTriangle className="inline mr-2" size={14} />
                  No error logs found.
                </TableCell>
              </TableRow>
            )}
            {filtered.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                  {new Date(r.created_at).toLocaleString()}
                </TableCell>
                <TableCell>
                  <span className={`text-xs font-medium uppercase ${CATEGORY_COLORS[r.category] ?? ""}`}>
                    {r.category}
                  </span>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">{r.source ?? "—"}</TableCell>
                <TableCell className="text-xs text-foreground">
                  <div className="font-mono break-all">{r.message}</div>
                  {r.context && Object.keys(r.context).length > 0 && (
                    <details className="mt-1">
                      <summary className="text-muted-foreground cursor-pointer">context</summary>
                      <pre className="mt-1 text-[10px] text-muted-foreground bg-secondary/50 p-2 rounded overflow-auto max-h-40">
                        {JSON.stringify(r.context, null, 2)}
                      </pre>
                    </details>
                  )}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground font-mono">
                  {r.user_id ? r.user_id.slice(0, 8) : "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
