import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { motion } from "framer-motion";
import { Shield, Briefcase, TrendingUp, Users, CreditCard } from "lucide-react";
import type { Tables, Database } from "@/integrations/supabase/types";
import AdminUsersTab from "@/components/admin/AdminUsersTab";
import AdminBusinessesTab from "@/components/admin/AdminBusinessesTab";
import AdminCampaignsTab from "@/components/admin/AdminCampaignsTab";
import AdminInvestmentsTab from "@/components/admin/AdminInvestmentsTab";
import AdminTransactionsTab from "@/components/admin/AdminTransactionsTab";

type AppRole = Database["public"]["Enums"]["app_role"];

const adminNav = [
  { icon: Shield, label: "Admin Dashboard", tab: "overview" },
];

const Admin = () => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checking, setChecking] = useState(true);
  const [tab, setTab] = useState("overview");

  // Data
  const [businesses, setBusinesses] = useState<Tables<"businesses">[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [investments, setInvestments] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<Tables<"transactions">[]>([]);
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    const checkAdmin = async () => {
      const { data } = await supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin");
      if (data && data.length > 0) {
        setIsAdmin(true);
      } else {
        navigate("/dashboard");
      }
      setChecking(false);
    };
    checkAdmin();
  }, [user, navigate]);

  useEffect(() => {
    if (!isAdmin) return;
    fetchAll();
  }, [isAdmin]);

  const fetchAll = async () => {
    const [bizRes, campRes, invRes, txRes, profilesRes, rolesRes] = await Promise.all([
      supabase.from("businesses").select("*").order("created_at", { ascending: false }),
      supabase.from("campaigns").select("*, businesses(name)").order("created_at", { ascending: false }),
      supabase.from("investments").select("*, campaigns(*, businesses(name))").order("created_at", { ascending: false }),
      supabase.from("transactions").select("*").order("created_at", { ascending: false }),
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("user_roles").select("*"),
    ]);

    setBusinesses(bizRes.data ?? []);
    setCampaigns(
      (campRes.data ?? []).map((c: any) => ({
        ...c,
        business_name: c.businesses?.name,
      }))
    );
    
    // Build profiles lookup for investor names
    const profilesList = profilesRes.data ?? [];
    const profilesLookup = new Map(profilesList.map((p: any) => [p.user_id, p.full_name]));
    
    setInvestments(
      (invRes.data ?? []).map((inv: any) => ({
        ...inv,
        investor_name: profilesLookup.get(inv.investor_id) || null,
        business_name: inv.campaigns?.businesses?.name,
      }))
    );
    setTransactions(txRes.data ?? []);

    // Merge profiles with roles
    const rolesMap = new Map<string, AppRole[]>();
    for (const r of rolesRes.data ?? []) {
      const arr = rolesMap.get(r.user_id) ?? [];
      arr.push(r.role);
      rolesMap.set(r.user_id, arr);
    }
    setUsers(
      (profilesRes.data ?? []).map((p: any) => ({
        ...p,
        roles: rolesMap.get(p.user_id) ?? [],
      }))
    );
  };

  if (loading || checking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAdmin) return null;

  const pendingBiz = businesses.filter((b) => !b.is_approved);
  const pendingCampaigns = campaigns.filter((c: any) => c.status === "pending_review");
  const totalInvested = investments.reduce((s: number, i: any) => s + Number(i.amount), 0);

  return (
    <DashboardLayout navItems={adminNav} activeTab={tab} onTabChange={setTab} onSignOut={signOut}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="mb-8">
          <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
            <Shield size={24} className="text-primary" /> Admin Dashboard
          </h1>
          <p className="text-muted-foreground text-sm">Manage users, businesses, campaigns, investments, and transactions.</p>
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="mb-6 flex-wrap">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="businesses">Businesses</TabsTrigger>
            <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
            <TabsTrigger value="investments">Investments</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: "Total Users", value: users.length, icon: Users, color: "text-primary" },
                { label: "Pending Businesses", value: pendingBiz.length, icon: Briefcase, color: "text-yellow-400" },
                { label: "Pending Campaigns", value: pendingCampaigns.length, icon: TrendingUp, color: "text-yellow-400" },
                { label: "Total Invested", value: `K${totalInvested.toLocaleString()}`, icon: CreditCard, color: "text-green-400" },
              ].map((stat) => (
                <div key={stat.label} className="bg-card rounded-xl border border-border/50 p-5">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                    <stat.icon size={16} className={stat.color} />
                  </div>
                  <p className="text-2xl font-display font-bold text-foreground">{stat.value}</p>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="users">
            <AdminUsersTab users={users} onRefresh={fetchAll} />
          </TabsContent>

          <TabsContent value="businesses">
            <AdminBusinessesTab businesses={businesses} onRefresh={fetchAll} />
          </TabsContent>

          <TabsContent value="campaigns">
            <AdminCampaignsTab campaigns={campaigns} onRefresh={fetchAll} />
          </TabsContent>

          <TabsContent value="investments">
            <AdminInvestmentsTab investments={investments} onRefresh={fetchAll} />
          </TabsContent>

          <TabsContent value="transactions">
            <AdminTransactionsTab transactions={transactions} />
          </TabsContent>
        </Tabs>
      </motion.div>
    </DashboardLayout>
  );
};

export default Admin;
