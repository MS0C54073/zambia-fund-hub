import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Search, Shield, Ban, CheckCircle } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

interface UserProfile {
  user_id: string;
  full_name: string | null;
  phone: string | null;
  province: string | null;
  user_type: string;
  is_verified: boolean;
  is_suspended: boolean;
  email?: string;
  roles: AppRole[];
}

interface Props {
  users: UserProfile[];
  onRefresh: () => void;
}

export default function AdminUsersTab({ users, onRefresh }: Props) {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [assigning, setAssigning] = useState<string | null>(null);

  const filtered = users.filter(
    (u) =>
      (u.full_name ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (u.email ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const assignRole = async (userId: string, role: AppRole) => {
    setAssigning(userId);
    const { error } = await supabase.from("user_roles").upsert(
      { user_id: userId, role },
      { onConflict: "user_id,role" }
    );
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: `Role "${role}" assigned` });
      onRefresh();
    }
    setAssigning(null);
  };

  const removeRole = async (userId: string, role: AppRole) => {
    const { error } = await supabase
      .from("user_roles")
      .delete()
      .eq("user_id", userId)
      .eq("role", role);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: `Role "${role}" removed` });
      onRefresh();
    }
  };

  const toggleSuspend = async (userId: string, currentlySuspended: boolean) => {
    const { error } = await supabase
      .from("profiles")
      .update({ is_suspended: !currentlySuspended })
      .eq("user_id", userId);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: currentlySuspended ? "User unsuspended" : "User suspended" });
      onRefresh();
    }
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
          <Input
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-secondary border-border"
          />
        </div>
        <span className="text-xs text-muted-foreground">{filtered.length} users</span>
      </div>

      <div className="bg-card rounded-xl border border-border/50 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Province</TableHead>
              <TableHead>Roles</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((u) => (
              <TableRow key={u.user_id}>
                <TableCell>
                  <div>
                    <p className="font-medium text-foreground text-sm">{u.full_name || "—"}</p>
                    <p className="text-xs text-muted-foreground">{u.email || u.user_id.slice(0, 8)}</p>
                  </div>
                </TableCell>
                <TableCell className="text-sm capitalize text-muted-foreground">{u.user_type}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{u.province || "—"}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {u.roles.length === 0 && <span className="text-xs text-muted-foreground">none</span>}
                    {u.roles.map((r) => (
                      <span
                        key={r}
                        className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary cursor-pointer hover:bg-destructive/10 hover:text-destructive transition-colors"
                        onClick={() => removeRole(u.user_id, r)}
                        title={`Click to remove ${r} role`}
                      >
                        {r} ×
                      </span>
                    ))}
                  </div>
                </TableCell>
                <TableCell>
                  {u.is_suspended ? (
                    <span className="text-xs text-destructive flex items-center gap-1"><Ban size={12} /> Suspended</span>
                  ) : u.is_verified ? (
                    <span className="text-xs text-green-400 flex items-center gap-1"><CheckCircle size={12} /> Verified</span>
                  ) : (
                    <span className="text-xs text-muted-foreground">Unverified</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-xs"
                      disabled={assigning === u.user_id}
                      onClick={() => assignRole(u.user_id, "admin")}
                      title="Assign admin role"
                    >
                      <Shield size={12} className="mr-1" /> Admin
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-xs"
                      onClick={() => toggleSuspend(u.user_id, u.is_suspended)}
                    >
                      <Ban size={12} className="mr-1" /> {u.is_suspended ? "Unsuspend" : "Suspend"}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
