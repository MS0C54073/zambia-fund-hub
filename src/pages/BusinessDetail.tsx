import { useEffect, useState, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import Navbar from "@/components/landing/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useRealtimeCampaigns } from "@/hooks/useRealtimeCampaigns";
import RealtimeProgressBar from "@/components/RealtimeProgressBar";
import { motion } from "framer-motion";
import { MapPin, TrendingUp, ArrowLeft, Wallet as WalletIcon, Bookmark, BookmarkCheck, AlertTriangle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useWallet } from "@/hooks/useWallet";
import { useSavedBusinesses } from "@/hooks/useSavedBusinesses";
import { useKyc } from "@/hooks/useKyc";
import VerifiedBadge from "@/components/VerifiedBadge";
import RiskBadge from "@/components/RiskBadge";
import KycRequiredBanner from "@/components/kyc/KycRequiredBanner";
import type { Tables } from "@/integrations/supabase/types";

type Business = Tables<"businesses">;
type Campaign = Tables<"campaigns">;

const BusinessDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [business, setBusiness] = useState<Business | null>(null);
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [investAmount, setInvestAmount] = useState("");
  const [investing, setInvesting] = useState(false);

  const { wallet, invest } = useWallet(user?.id);
  const { isSaved, toggleSave } = useSavedBusinesses(user?.id);
  const kyc = useKyc(user?.id);

  const handleCampaignUpdate = useCallback((updated: Campaign) => {
    setCampaign((prev) => (prev?.id === updated.id ? updated : prev));
  }, []);

  const { seedAmounts } = useRealtimeCampaigns({
    onUpdate: handleCampaignUpdate,
    notifyOnFunding: true,
  });

  useEffect(() => {
    if (!id) return;
    const fetch = async () => {
      const { data: biz } = await supabase.from("businesses").select("*").eq("id", id).single();
      setBusiness(biz);
      if (biz) {
        const { data: camp } = await supabase
          .from("campaigns")
          .select("*")
          .eq("business_id", biz.id)
          .eq("status", "active")
          .limit(1)
          .maybeSingle();
        setCampaign(camp);
        if (camp) seedAmounts([camp]);
      }
      setLoading(false);
    };
    fetch();
  }, [id]);

  const handleInvest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("Please sign in to invest");
      navigate("/auth");
      return;
    }
    if (!campaign) return;

    if (!kyc.canInvest) {
      toast.error("Identity verification required", {
        description:
          kyc.status === "pending"
            ? "Your KYC submission is under review."
            : "Submit your NRC details before investing.",
        action: { label: "Verify now", onClick: () => navigate("/dashboard?tab=verification") },
      });
      return;
    }

    const amount = parseFloat(investAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Enter a valid amount");
      return;
    }

    const balance = Number(wallet?.balance ?? 0);
    if (amount > balance) {
      toast.error("Insufficient wallet balance", {
        description: `You have K${balance.toLocaleString()}. Top up your wallet first.`,
        action: { label: "Go to Wallet", onClick: () => navigate("/dashboard") },
      });
      return;
    }

    setInvesting(true);
    try {
      await invest(campaign.id, amount);
      toast.success("Investment confirmed!", {
        description: `K${amount.toLocaleString()} invested in ${business?.name}.`,
      });
      setInvestAmount("");
    } catch (err: any) {
      toast.error("Investment failed", { description: err.message });
    } finally {
      setInvesting(false);
    }
  };

  const handleSave = async () => {
    if (!user) {
      toast.error("Please sign in to save businesses");
      return;
    }
    if (!business) return;
    const nowSaved = await toggleSave(business.id);
    toast.success(nowSaved ? "Added to saved" : "Removed from saved");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!business) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container px-4 pt-24 text-center">
          <p className="text-muted-foreground">Business not found.</p>
          <Button variant="hero" className="mt-4" asChild><Link to="/browse">Back to Browse</Link></Button>
        </div>
      </div>
    );
  }

  const progress = campaign ? Math.round((Number(campaign.raised_amount) / Number(campaign.goal_amount)) * 100) : 0;
  const saved = isSaved(business.id);
  const balance = Number(wallet?.balance ?? 0);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container px-4 pt-24 pb-16 max-w-4xl">
        <Link to="/browse" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft size={16} /> Back to Browse
        </Link>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="bg-card rounded-2xl border border-border/50 p-8">
            <div className="flex items-start justify-between mb-4 gap-4">
              <div className="min-w-0">
                <h1 className="text-3xl font-display font-bold text-foreground">{business.name}</h1>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <VerifiedBadge verified={business.is_verified} showUnverified />
                  <RiskBadge business={business} campaign={campaign} size="md" />
                </div>
                <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground flex-wrap">
                  {business.industry && <span className="flex items-center gap-1"><TrendingUp size={14} />{business.industry}</span>}
                  {business.province && <span className="flex items-center gap-1"><MapPin size={14} />{business.province}</span>}
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={handleSave} className="gap-1 shrink-0">
                {saved ? <BookmarkCheck size={14} className="text-primary" /> : <Bookmark size={14} />}
                {saved ? "Saved" : "Save"}
              </Button>
            </div>

            {!business.is_verified && (
              <div className="flex items-start gap-3 mb-6 p-3 rounded-lg border border-yellow-500/30 bg-yellow-500/5 text-yellow-400 text-sm">
                <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                <p>
                  This business has not yet completed ZamFund verification. Review documents carefully before investing.
                </p>
              </div>
            )}

            {business.description && (
              <p className="text-muted-foreground mb-6">{business.description}</p>
            )}

            {campaign && (
              <div className="bg-secondary rounded-xl p-6 mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-primary capitalize">{campaign.funding_type.replace("_", " ")}</span>
                  <span className="text-xs text-muted-foreground">{campaign.currency}</span>
                </div>
                <div className="flex items-end justify-between mb-3">
                  <div>
                    <p className="text-2xl font-display font-bold text-foreground">
                      K{Number(campaign.raised_amount).toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">raised of K{Number(campaign.goal_amount).toLocaleString()} goal</p>
                  </div>
                  <span className="text-lg font-bold text-primary">{progress}%</span>
                </div>
                <RealtimeProgressBar
                  raised={Number(campaign.raised_amount)}
                  goal={Number(campaign.goal_amount)}
                  className="mb-6"
                />

                <form onSubmit={handleInvest} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-foreground">Invest from your wallet</Label>
                    {user && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <WalletIcon size={12} /> K{balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-3">
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">K</span>
                      <Input
                        type="number"
                        min="1"
                        step="0.01"
                        placeholder="Amount in ZMW"
                        value={investAmount}
                        onChange={(e) => setInvestAmount(e.target.value)}
                        className="pl-7 bg-background border-border"
                        required
                      />
                    </div>
                    <Button type="submit" variant="hero" disabled={investing}>
                      {investing ? "Processing..." : "Invest Now"}
                    </Button>
                  </div>
                  {user && balance === 0 && (
                    <p className="text-xs text-yellow-400">
                      Your wallet is empty.{" "}
                      <Link to="/dashboard" className="underline">Top up your wallet</Link> to invest.
                    </p>
                  )}
                </form>
              </div>
            )}

            {!campaign && (
              <div className="bg-secondary rounded-xl p-6 text-center text-muted-foreground">
                No active campaign at the moment.
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default BusinessDetail;
