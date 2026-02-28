import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useRealtimeCampaigns } from "@/hooks/useRealtimeCampaigns";
import RealtimeProgressBar from "@/components/RealtimeProgressBar";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import {
  LayoutDashboard, Briefcase, TrendingUp, User, Plus,
  Upload, MapPin, Clock, CheckCircle
} from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Business = Tables<"businesses">;
type Campaign = Tables<"campaigns">;
type Investment = Tables<"investments">;

const navItems = [
  { icon: LayoutDashboard, label: "Overview", path: "/dashboard" },
  { icon: Briefcase, label: "My Businesses", path: "/dashboard/businesses" },
  { icon: TrendingUp, label: "Investments", path: "/dashboard/investments" },
  { icon: User, label: "Profile", path: "/dashboard/profile" },
];

const Dashboard = () => {
  const { user, profile, loading, signOut } = useAuth();
  const { toast } = useToast();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [investments, setInvestments] = useState<(Investment & { campaign?: Campaign; business?: Business })[]>([]);
  const [activeTab, setActiveTab] = useState("overview");

  // Business form state
  const [showBizForm, setShowBizForm] = useState(false);
  const [bizName, setBizName] = useState("");
  const [bizDesc, setBizDesc] = useState("");
  const [bizIndustry, setBizIndustry] = useState("");
  const [bizProvince, setBizProvince] = useState("");
  const [bizRegNum, setBizRegNum] = useState("");
  const [bizSubmitting, setBizSubmitting] = useState(false);
  const [pitchDeckFile, setPitchDeckFile] = useState<File | null>(null);

  // Campaign form
  const [showCampaignForm, setShowCampaignForm] = useState(false);
  const [campBizId, setCampBizId] = useState("");
  const [campType, setCampType] = useState<"equity" | "revenue_share" | "crowdfunding" | "loan">("equity");
  const [campGoal, setCampGoal] = useState("");
  const [campSubmitting, setCampSubmitting] = useState(false);
  const [campProblem, setCampProblem] = useState("");
  const [campSolution, setCampSolution] = useState("");
  const [campMarket, setCampMarket] = useState("");
  const [campRevenue, setCampRevenue] = useState("");
  const [campTraction, setCampTraction] = useState("");
  const [campUseOfFunds, setCampUseOfFunds] = useState("");
  const [campProposalFile, setCampProposalFile] = useState<File | null>(null);

  // Profile edit
  const [editingProfile, setEditingProfile] = useState(false);
  const [profName, setProfName] = useState("");
  const [profPhone, setProfPhone] = useState("");
  const [profProvince, setProfProvince] = useState("");
  const [profType, setProfType] = useState("");
  const [profSubmitting, setProfSubmitting] = useState(false);

  // Real-time campaign updates
  const handleCampaignUpdate = useCallback((updated: Tables<"campaigns">) => {
    setCampaigns((prev) =>
      prev.map((c) => (c.id === updated.id ? updated : c))
    );
  }, []);

  const { seedAmounts } = useRealtimeCampaigns({
    onUpdate: handleCampaignUpdate,
    notifyOnFunding: true,
  });

  useEffect(() => {
    if (!user) return;
    fetchData();
  }, [user]);

  useEffect(() => {
    if (profile) {
      setProfName(profile.full_name ?? "");
      setProfPhone(profile.phone ?? "");
      setProfProvince(profile.province ?? "");
      setProfType(profile.user_type ?? "investor");
    }
  }, [profile]);

  const fetchData = async () => {
    if (!user) return;
    const [bizRes, invRes] = await Promise.all([
      supabase.from("businesses").select("*").eq("owner_id", user.id),
      supabase.from("investments").select("*, campaigns(*, businesses(*))").eq("investor_id", user.id),
    ]);
    const biz = (bizRes.data ?? []) as Business[];
    setBusinesses(biz);

    if (biz.length > 0) {
      const { data: campData } = await supabase
        .from("campaigns")
        .select("*")
        .in("business_id", biz.map((b) => b.id));
      const camps = campData ?? [];
      setCampaigns(camps);
      seedAmounts(camps);
    }

    const rawInv = (invRes.data ?? []) as any[];
    setInvestments(
      rawInv.map((inv) => ({
        ...inv,
        campaign: inv.campaigns,
        business: inv.campaigns?.businesses,
      }))
    );
  };

  const handleCreateBusiness = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setBizSubmitting(true);

    let pitchDeckUrl: string | null = null;
    if (pitchDeckFile) {
      const filePath = `${user.id}/${Date.now()}_${pitchDeckFile.name}`;
      const { error: uploadErr } = await supabase.storage
        .from("business-documents")
        .upload(filePath, pitchDeckFile);
      if (uploadErr) {
        toast({ title: "Upload failed", description: uploadErr.message, variant: "destructive" });
        setBizSubmitting(false);
        return;
      }
      pitchDeckUrl = filePath;
    }

    const { error } = await supabase.from("businesses").insert({
      name: bizName.trim(),
      description: bizDesc.trim() || null,
      industry: bizIndustry || null,
      province: bizProvince || null,
      registration_number: bizRegNum || null,
      owner_id: user.id,
      pitch_deck_url: pitchDeckUrl,
    });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Business created", description: "Pending admin approval." });
      setShowBizForm(false);
      setBizName(""); setBizDesc(""); setBizIndustry(""); setBizProvince(""); setBizRegNum("");
      setPitchDeckFile(null);
      fetchData();
    }
    setBizSubmitting(false);
  };

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!campBizId || !campGoal) return;
    setCampSubmitting(true);

    let proposalDocUrl: string | null = null;
    if (campProposalFile && user) {
      const filePath = `${user.id}/${Date.now()}_proposal_${campProposalFile.name}`;
      const { error: uploadErr } = await supabase.storage.from("business-documents").upload(filePath, campProposalFile);
      if (uploadErr) {
        toast({ title: "Upload failed", description: uploadErr.message, variant: "destructive" });
        setCampSubmitting(false);
        return;
      }
      proposalDocUrl = filePath;
    }

    const { error } = await supabase.from("campaigns").insert({
      business_id: campBizId,
      funding_type: campType,
      goal_amount: parseFloat(campGoal),
      status: "draft",
      proposal_problem: campProblem || null,
      proposal_solution: campSolution || null,
      proposal_market_size: campMarket || null,
      proposal_revenue_model: campRevenue || null,
      proposal_traction: campTraction || null,
      proposal_use_of_funds: campUseOfFunds || null,
      proposal_doc_url: proposalDocUrl,
    });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Campaign created", description: "Submit for review when ready." });
      setShowCampaignForm(false);
      setCampGoal(""); setCampProblem(""); setCampSolution(""); setCampMarket("");
      setCampRevenue(""); setCampTraction(""); setCampUseOfFunds(""); setCampProposalFile(null);
      fetchData();
    }
    setCampSubmitting(false);
  };

  const submitCampaignForReview = async (id: string) => {
    await supabase.from("campaigns").update({ status: "pending_review" }).eq("id", id);
    toast({ title: "Submitted for review" });
    fetchData();
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setProfSubmitting(true);

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: profName.trim() || null,
        phone: profPhone.trim() || null,
        province: profProvince.trim() || null,
        user_type: profType,
      })
      .eq("user_id", user.id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Profile updated" });
      setEditingProfile(false);
    }
    setProfSubmitting(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const totalInvested = investments.reduce((s, i) => s + Number(i.amount), 0);
  const totalRaised = campaigns.reduce((s, c) => s + Number(c.raised_amount), 0);

  return (
    <DashboardLayout navItems={navItems} onSignOut={signOut}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="mb-8">
          <h1 className="text-2xl font-display font-bold text-foreground">
            Welcome back, {profile?.full_name || "there"} 👋
          </h1>
          <p className="text-muted-foreground text-sm">{user?.email}</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="businesses">My Businesses</TabsTrigger>
            <TabsTrigger value="investments">Investments</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
          </TabsList>

          {/* OVERVIEW */}
          <TabsContent value="overview">
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
              {[
                { label: "Total Invested", value: `K${totalInvested.toLocaleString()}` },
                { label: "Businesses", value: businesses.length.toString() },
                { label: "Active Campaigns", value: campaigns.filter((c) => c.status === "active").length.toString() },
                { label: "Total Raised", value: `K${totalRaised.toLocaleString()}` },
              ].map((stat) => (
                <div key={stat.label} className="bg-card rounded-xl border border-border/50 p-5">
                  <p className="text-xs text-muted-foreground mb-1">{stat.label}</p>
                  <p className="text-2xl font-display font-bold text-foreground">{stat.value}</p>
                </div>
              ))}
            </div>

            <div className="bg-card rounded-2xl border border-border/50 p-12 text-center">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mx-auto mb-4">
                <Briefcase size={28} />
              </div>
              <h2 className="text-xl font-display font-semibold text-foreground mb-2">
                Get started with ZamFund
              </h2>
              <p className="text-muted-foreground text-sm mb-6 max-w-md mx-auto">
                Browse investment opportunities or list your business to start raising capital.
              </p>
              <div className="flex items-center justify-center gap-4">
                <Button variant="hero" asChild>
                  <Link to="/browse">Browse Businesses</Link>
                </Button>
                <Button variant="hero-outline" onClick={() => { setActiveTab("businesses"); setShowBizForm(true); }}>
                  List Your Business
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* BUSINESSES */}
          <TabsContent value="businesses">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-display font-semibold text-foreground">My Businesses</h2>
              <Button variant="hero" size="sm" onClick={() => setShowBizForm(!showBizForm)}>
                <Plus size={16} className="mr-1" /> Add Business
              </Button>
            </div>

            {showBizForm && (
              <form onSubmit={handleCreateBusiness} className="bg-card rounded-xl border border-border/50 p-6 mb-6 space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-foreground">Business Name *</Label>
                    <Input value={bizName} onChange={(e) => setBizName(e.target.value)} required className="mt-1 bg-secondary border-border" />
                  </div>
                  <div>
                    <Label className="text-foreground">Industry</Label>
                    <Input value={bizIndustry} onChange={(e) => setBizIndustry(e.target.value)} placeholder="e.g. AgriTech" className="mt-1 bg-secondary border-border" />
                  </div>
                  <div>
                    <Label className="text-foreground">Province</Label>
                    <Input value={bizProvince} onChange={(e) => setBizProvince(e.target.value)} placeholder="e.g. Lusaka" className="mt-1 bg-secondary border-border" />
                  </div>
                  <div>
                    <Label className="text-foreground">Registration Number</Label>
                    <Input value={bizRegNum} onChange={(e) => setBizRegNum(e.target.value)} className="mt-1 bg-secondary border-border" />
                  </div>
                </div>
                <div>
                  <Label className="text-foreground">Description</Label>
                  <textarea
                    value={bizDesc}
                    onChange={(e) => setBizDesc(e.target.value)}
                    rows={3}
                    className="w-full mt-1 rounded-md border border-border bg-secondary px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    placeholder="Describe your business..."
                  />
                </div>
                <div>
                  <Label className="text-foreground">Pitch Deck (PDF)</Label>
                  <div className="mt-1">
                    <label className="flex items-center gap-2 px-4 py-2 bg-secondary border border-border rounded-md cursor-pointer hover:bg-surface-hover transition-colors text-sm text-muted-foreground">
                      <Upload size={16} />
                      {pitchDeckFile ? pitchDeckFile.name : "Choose file"}
                      <input type="file" accept=".pdf,.ppt,.pptx" className="hidden" onChange={(e) => setPitchDeckFile(e.target.files?.[0] ?? null)} />
                    </label>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button type="submit" variant="hero" disabled={bizSubmitting}>
                    {bizSubmitting ? "Creating..." : "Create Business"}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowBizForm(false)}>Cancel</Button>
                </div>
              </form>
            )}

            {businesses.length === 0 && !showBizForm ? (
              <div className="bg-card rounded-xl border border-border/50 p-12 text-center text-muted-foreground">
                No businesses yet. Click "Add Business" to get started.
              </div>
            ) : (
              <div className="space-y-4">
                {businesses.map((biz) => {
                  const bizCampaigns = campaigns.filter((c) => c.business_id === biz.id);
                  return (
                    <div key={biz.id} className="bg-card rounded-xl border border-border/50 p-6">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-display font-semibold text-foreground">{biz.name}</h3>
                          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                            {biz.industry && <span>{biz.industry}</span>}
                            {biz.province && <span className="flex items-center gap-1"><MapPin size={12} />{biz.province}</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {biz.is_approved ? (
                            <span className="flex items-center gap-1 text-xs text-green-400"><CheckCircle size={14} /> Approved</span>
                          ) : (
                            <span className="flex items-center gap-1 text-xs text-yellow-400"><Clock size={14} /> Pending</span>
                          )}
                        </div>
                      </div>
                      {biz.description && <p className="text-sm text-muted-foreground mt-2">{biz.description}</p>}

                      {/* Campaigns for this business */}
                      <div className="mt-4 border-t border-border/30 pt-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium text-foreground">Campaigns</span>
                          {biz.is_approved && (
                            <Button size="sm" variant="outline" onClick={() => { setCampBizId(biz.id); setShowCampaignForm(true); }}>
                              <Plus size={14} className="mr-1" /> New Campaign
                            </Button>
                          )}
                        </div>
                        {bizCampaigns.length === 0 ? (
                          <p className="text-xs text-muted-foreground">No campaigns yet.</p>
                        ) : (
                          bizCampaigns.map((camp) => (
                            <div key={camp.id} className="bg-secondary rounded-lg p-3 mb-2 flex items-center justify-between">
                              <div>
                                <span className="text-xs font-medium text-primary capitalize">{camp.funding_type.replace("_", " ")}</span>
                                <div className="text-sm text-foreground mt-0.5">
                                  K{Number(camp.raised_amount).toLocaleString()} / K{Number(camp.goal_amount).toLocaleString()}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={`text-xs px-2 py-0.5 rounded-full ${
                                  camp.status === "active" ? "bg-green-500/10 text-green-400" :
                                  camp.status === "draft" ? "bg-muted text-muted-foreground" :
                                  camp.status === "pending_review" ? "bg-yellow-500/10 text-yellow-400" :
                                  "bg-muted text-muted-foreground"
                                }`}>
                                  {camp.status.replace("_", " ")}
                                </span>
                                {camp.status === "draft" && (
                                  <Button size="sm" variant="outline" onClick={() => submitCampaignForReview(camp.id)}>
                                    Submit for Review
                                  </Button>
                                )}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Campaign creation modal */}
            {showCampaignForm && (
              <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-auto">
                <form onSubmit={handleCreateCampaign} className="bg-card rounded-2xl border border-border/50 p-8 max-w-lg w-full space-y-4 my-8">
                  <h3 className="text-lg font-display font-semibold text-foreground">Create Campaign</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-foreground">Funding Type</Label>
                      <select
                        value={campType}
                        onChange={(e) => setCampType(e.target.value as any)}
                        className="w-full mt-1 rounded-md border border-border bg-secondary px-3 py-2 text-sm text-foreground"
                      >
                        <option value="equity">Equity</option>
                        <option value="revenue_share">Revenue Share</option>
                        <option value="crowdfunding">Crowdfunding</option>
                        <option value="loan">Loan</option>
                      </select>
                    </div>
                    <div>
                      <Label className="text-foreground">Goal Amount (ZMW)</Label>
                      <Input type="number" min="1" value={campGoal} onChange={(e) => setCampGoal(e.target.value)} required className="mt-1 bg-secondary border-border" />
                    </div>
                  </div>
                  
                  <p className="text-xs text-muted-foreground font-medium pt-2 border-t border-border/30">Proposal Details (optional but recommended)</p>
                  
                  <div>
                    <Label className="text-foreground">Problem</Label>
                    <textarea value={campProblem} onChange={(e) => setCampProblem(e.target.value)} rows={2}
                      className="w-full mt-1 rounded-md border border-border bg-secondary px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      placeholder="What problem are you solving?" />
                  </div>
                  <div>
                    <Label className="text-foreground">Solution</Label>
                    <textarea value={campSolution} onChange={(e) => setCampSolution(e.target.value)} rows={2}
                      className="w-full mt-1 rounded-md border border-border bg-secondary px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      placeholder="How does your business solve it?" />
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-foreground">Market Size</Label>
                      <Input value={campMarket} onChange={(e) => setCampMarket(e.target.value)} placeholder="e.g. $500M TAM" className="mt-1 bg-secondary border-border" />
                    </div>
                    <div>
                      <Label className="text-foreground">Revenue Model</Label>
                      <Input value={campRevenue} onChange={(e) => setCampRevenue(e.target.value)} placeholder="e.g. SaaS subscription" className="mt-1 bg-secondary border-border" />
                    </div>
                  </div>
                  <div>
                    <Label className="text-foreground">Traction</Label>
                    <Input value={campTraction} onChange={(e) => setCampTraction(e.target.value)} placeholder="e.g. 1,000 users, K50k MRR" className="mt-1 bg-secondary border-border" />
                  </div>
                  <div>
                    <Label className="text-foreground">Use of Funds</Label>
                    <textarea value={campUseOfFunds} onChange={(e) => setCampUseOfFunds(e.target.value)} rows={2}
                      className="w-full mt-1 rounded-md border border-border bg-secondary px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      placeholder="How will the funds be used?" />
                  </div>
                  <div>
                    <Label className="text-foreground">Proposal Document (PDF)</Label>
                    <div className="mt-1">
                      <label className="flex items-center gap-2 px-4 py-2 bg-secondary border border-border rounded-md cursor-pointer hover:bg-surface-hover transition-colors text-sm text-muted-foreground">
                        <Upload size={16} />
                        {campProposalFile ? campProposalFile.name : "Choose file"}
                        <input type="file" accept=".pdf" className="hidden" onChange={(e) => setCampProposalFile(e.target.files?.[0] ?? null)} />
                      </label>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Button type="submit" variant="hero" disabled={campSubmitting}>
                      {campSubmitting ? "Creating..." : "Create Campaign"}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setShowCampaignForm(false)}>Cancel</Button>
                  </div>
                </form>
              </div>
            )}
          </TabsContent>

          {/* INVESTMENTS */}
          <TabsContent value="investments">
            <h2 className="text-xl font-display font-semibold text-foreground mb-6">My Investments</h2>
            {investments.length === 0 ? (
              <div className="bg-card rounded-xl border border-border/50 p-12 text-center">
                <TrendingUp size={32} className="text-primary mx-auto mb-3" />
                <p className="text-muted-foreground">No investments yet.</p>
                <Button variant="hero" className="mt-4" asChild>
                  <Link to="/browse">Browse Opportunities</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {investments.map((inv) => (
                  <div key={inv.id} className="bg-card rounded-xl border border-border/50 p-5 flex items-center justify-between">
                    <div>
                      <h3 className="font-display font-semibold text-foreground text-sm">
                        {(inv.business as any)?.name ?? "Business"}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {(inv.campaign as any)?.funding_type?.replace("_", " ")} • {inv.status}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-display font-bold text-foreground">K{Number(inv.amount).toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">{inv.currency}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* PROFILE */}
          <TabsContent value="profile">
            <h2 className="text-xl font-display font-semibold text-foreground mb-6">My Profile</h2>
            <div className="bg-card rounded-xl border border-border/50 p-6 max-w-lg">
              {editingProfile ? (
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <div>
                    <Label className="text-foreground">Full Name</Label>
                    <Input value={profName} onChange={(e) => setProfName(e.target.value)} className="mt-1 bg-secondary border-border" />
                  </div>
                  <div>
                    <Label className="text-foreground">Phone</Label>
                    <Input value={profPhone} onChange={(e) => setProfPhone(e.target.value)} className="mt-1 bg-secondary border-border" />
                  </div>
                  <div>
                    <Label className="text-foreground">Province</Label>
                    <Input value={profProvince} onChange={(e) => setProfProvince(e.target.value)} className="mt-1 bg-secondary border-border" />
                  </div>
                  <div>
                    <Label className="text-foreground">I am a</Label>
                    <select
                      value={profType}
                      onChange={(e) => setProfType(e.target.value)}
                      className="w-full mt-1 rounded-md border border-border bg-secondary px-3 py-2 text-sm text-foreground"
                    >
                      <option value="investor">Investor</option>
                      <option value="founder">Founder / Business Owner</option>
                      <option value="diaspora">Diaspora Investor</option>
                    </select>
                  </div>
                  <div className="flex gap-3">
                    <Button type="submit" variant="hero" disabled={profSubmitting}>
                      {profSubmitting ? "Saving..." : "Save Changes"}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setEditingProfile(false)}>Cancel</Button>
                  </div>
                </form>
              ) : (
                <div className="space-y-3">
                  <div><span className="text-xs text-muted-foreground">Name</span><p className="text-foreground">{profile?.full_name || "—"}</p></div>
                  <div><span className="text-xs text-muted-foreground">Email</span><p className="text-foreground">{user?.email}</p></div>
                  <div><span className="text-xs text-muted-foreground">Phone</span><p className="text-foreground">{profile?.phone || "—"}</p></div>
                  <div><span className="text-xs text-muted-foreground">Province</span><p className="text-foreground">{profile?.province || "—"}</p></div>
                  <div><span className="text-xs text-muted-foreground">Type</span><p className="text-foreground capitalize">{profile?.user_type || "—"}</p></div>
                  <div><span className="text-xs text-muted-foreground">Verified</span><p className="text-foreground">{profile?.is_verified ? "✅ Yes" : "❌ Not yet"}</p></div>
                  <Button variant="outline" onClick={() => setEditingProfile(true)} className="mt-4">Edit Profile</Button>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>
    </DashboardLayout>
  );
};

export default Dashboard;
