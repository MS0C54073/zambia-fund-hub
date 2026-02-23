import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import {
  Shield, Briefcase, TrendingUp, Users, CheckCircle, XCircle,
} from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Business = Tables<"businesses">;
type Campaign = Tables<"campaigns">;
type Investment = Tables<"investments">;

const adminNav = [
  { icon: Shield, label: "Admin Overview", path: "/admin" },
  { icon: Briefcase, label: "Businesses", path: "/admin" },
  { icon: TrendingUp, label: "Campaigns", path: "/admin" },
  { icon: Users, label: "Users", path: "/admin" },
];

const Admin = () => {
  const { user, loading, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checking, setChecking] = useState(true);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [campaigns, setCampaigns] = useState<(Campaign & { business_name?: string })[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [tab, setTab] = useState("businesses");

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
    const [bizRes, campRes, invRes] = await Promise.all([
      supabase.from("businesses").select("*").order("created_at", { ascending: false }),
      supabase.from("campaigns").select("*, businesses(name)").order("created_at", { ascending: false }),
      supabase.from("investments").select("*").order("created_at", { ascending: false }),
    ]);
    setBusinesses(bizRes.data ?? []);
    setCampaigns(
      (campRes.data ?? []).map((c: any) => ({ ...c, business_name: c.businesses?.name }))
    );
    setInvestments(invRes.data ?? []);
  };

  const approveBusiness = async (id: string) => {
    await supabase.from("businesses").update({ is_approved: true, is_verified: true }).eq("id", id);
    toast({ title: "Business approved" });
    fetchAll();
  };

  const rejectBusiness = async (id: string) => {
    await supabase.from("businesses").update({ is_approved: false }).eq("id", id);
    toast({ title: "Business rejected" });
    fetchAll();
  };

  const approveCampaign = async (id: string) => {
    await supabase.from("campaigns").update({ status: "active", start_date: new Date().toISOString() }).eq("id", id);
    toast({ title: "Campaign approved and now active" });
    fetchAll();
  };

  const rejectCampaign = async (id: string) => {
    await supabase.from("campaigns").update({ status: "rejected" }).eq("id", id);
    toast({ title: "Campaign rejected" });
    fetchAll();
  };

  const confirmInvestment = async (id: string) => {
    await supabase.from("investments").update({ status: "confirmed" }).eq("id", id);
    toast({ title: "Investment confirmed" });
    fetchAll();
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
  const pendingCampaigns = campaigns.filter((c) => c.status === "pending_review");
  

  return (
    <DashboardLayout navItems={adminNav} onSignOut={signOut}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="mb-8">
          <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
            <Shield size={24} className="text-primary" /> Admin Dashboard
          </h1>
          <p className="text-muted-foreground text-sm">Manage businesses, campaigns, and investments.</p>
        </div>

        {/* Stats */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-card rounded-xl border border-border/50 p-5">
            <p className="text-xs text-muted-foreground mb-1">Pending Businesses</p>
            <p className="text-2xl font-display font-bold text-yellow-400">{pendingBiz.length}</p>
          </div>
          <div className="bg-card rounded-xl border border-border/50 p-5">
            <p className="text-xs text-muted-foreground mb-1">Pending Campaigns</p>
            <p className="text-2xl font-display font-bold text-yellow-400">{pendingCampaigns.length}</p>
          </div>
          <div className="bg-card rounded-xl border border-border/50 p-5">
            <p className="text-xs text-muted-foreground mb-1">Total Businesses</p>
            <p className="text-2xl font-display font-bold text-foreground">{businesses.length}</p>
          </div>
          <div className="bg-card rounded-xl border border-border/50 p-5">
            <p className="text-xs text-muted-foreground mb-1">Total Investments</p>
            <p className="text-2xl font-display font-bold text-foreground">{investments.length}</p>
          </div>
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="businesses">Businesses</TabsTrigger>
            <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
            <TabsTrigger value="investments">Investments</TabsTrigger>
          </TabsList>

          <TabsContent value="businesses">
            <div className="space-y-3">
              {businesses.map((biz) => (
                <div key={biz.id} className="bg-card rounded-xl border border-border/50 p-5 flex items-center justify-between">
                  <div>
                    <h3 className="font-display font-semibold text-foreground">{biz.name}</h3>
                    <p className="text-xs text-muted-foreground">{biz.industry} • {biz.province} • Reg: {biz.registration_number || "N/A"}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {biz.is_approved ? (
                      <span className="text-xs text-green-400 flex items-center gap-1"><CheckCircle size={14} /> Approved</span>
                    ) : (
                      <>
                        <Button size="sm" variant="outline" className="text-green-400 border-green-400/30 hover:bg-green-400/10" onClick={() => approveBusiness(biz.id)}>
                          <CheckCircle size={14} className="mr-1" /> Approve
                        </Button>
                        <Button size="sm" variant="outline" className="text-destructive border-destructive/30 hover:bg-destructive/10" onClick={() => rejectBusiness(biz.id)}>
                          <XCircle size={14} className="mr-1" /> Reject
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
              {businesses.length === 0 && <p className="text-muted-foreground text-center py-8">No businesses registered yet.</p>}
            </div>
          </TabsContent>

          <TabsContent value="campaigns">
            <div className="space-y-3">
              {campaigns.map((camp) => (
                <div key={camp.id} className="bg-card rounded-xl border border-border/50 p-5 flex items-center justify-between">
                  <div>
                    <h3 className="font-display font-semibold text-foreground">{camp.business_name}</h3>
                    <p className="text-xs text-muted-foreground capitalize">
                      {camp.funding_type.replace("_", " ")} • K{Number(camp.goal_amount).toLocaleString()} goal • {camp.status.replace("_", " ")}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {camp.status === "pending_review" && (
                      <>
                        <Button size="sm" variant="outline" className="text-green-400 border-green-400/30 hover:bg-green-400/10" onClick={() => approveCampaign(camp.id)}>
                          <CheckCircle size={14} className="mr-1" /> Approve
                        </Button>
                        <Button size="sm" variant="outline" className="text-destructive border-destructive/30 hover:bg-destructive/10" onClick={() => rejectCampaign(camp.id)}>
                          <XCircle size={14} className="mr-1" /> Reject
                        </Button>
                      </>
                    )}
                    {camp.status === "active" && <span className="text-xs text-green-400">Active</span>}
                    {camp.status === "draft" && <span className="text-xs text-muted-foreground">Draft</span>}
                    {camp.status === "rejected" && <span className="text-xs text-destructive">Rejected</span>}
                  </div>
                </div>
              ))}
              {campaigns.length === 0 && <p className="text-muted-foreground text-center py-8">No campaigns yet.</p>}
            </div>
          </TabsContent>

          <TabsContent value="investments">
            <div className="space-y-3">
              {investments.map((inv) => (
                <div key={inv.id} className="bg-card rounded-xl border border-border/50 p-5 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-foreground">K{Number(inv.amount).toLocaleString()} {inv.currency}</p>
                    <p className="text-xs text-muted-foreground capitalize">{inv.status} • {inv.payment_method || "N/A"}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {(inv.status === "pledged" || inv.status === "paid") && (
                      <Button size="sm" variant="outline" className="text-green-400 border-green-400/30 hover:bg-green-400/10" onClick={() => confirmInvestment(inv.id)}>
                        <CheckCircle size={14} className="mr-1" /> Confirm
                      </Button>
                    )}
                    {inv.status === "confirmed" && <span className="text-xs text-green-400">Confirmed</span>}
                  </div>
                </div>
              ))}
              {investments.length === 0 && <p className="text-muted-foreground text-center py-8">No investments yet.</p>}
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>
    </DashboardLayout>
  );
};

export default Admin;
