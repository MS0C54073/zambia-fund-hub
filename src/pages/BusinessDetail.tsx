import { useEffect, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import Navbar from "@/components/landing/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useRealtimeCampaigns } from "@/hooks/useRealtimeCampaigns";
import RealtimeProgressBar from "@/components/RealtimeProgressBar";
import { motion } from "framer-motion";
import { MapPin, TrendingUp, ArrowLeft, DollarSign } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Business = Tables<"businesses">;
type Campaign = Tables<"campaigns">;

const BusinessDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [business, setBusiness] = useState<Business | null>(null);
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [investAmount, setInvestAmount] = useState("");
  const [investing, setInvesting] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setUserId(data.session?.user?.id ?? null));
  }, []);

  // Real-time campaign updates
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
      }
      setLoading(false);
    };
    fetch();
  }, [id]);

  const handleInvest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) {
      toast({ title: "Please sign in", description: "You need to be logged in to invest.", variant: "destructive" });
      return;
    }
    if (!campaign) return;
    setInvesting(true);

    const amount = parseFloat(investAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({ title: "Invalid amount", variant: "destructive" });
      setInvesting(false);
      return;
    }

    const { error } = await supabase.from("investments").insert({
      campaign_id: campaign.id,
      investor_id: userId,
      amount,
      status: "pledged",
    });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      // Update raised amount
      await supabase
        .from("campaigns")
        .update({ raised_amount: Number(campaign.raised_amount) + amount })
        .eq("id", campaign.id);

      toast({ title: "Investment pledged!", description: `K${amount.toLocaleString()} ZMW pledged successfully.` });
      setInvestAmount("");
      // Refresh campaign
      const { data: updated } = await supabase.from("campaigns").select("*").eq("id", campaign.id).single();
      setCampaign(updated);
    }
    setInvesting(false);
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

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container px-4 pt-24 pb-16 max-w-4xl">
        <Link to="/browse" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft size={16} /> Back to Browse
        </Link>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="bg-card rounded-2xl border border-border/50 p-8">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-3xl font-display font-bold text-foreground">{business.name}</h1>
                <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                  {business.industry && <span className="flex items-center gap-1"><TrendingUp size={14} />{business.industry}</span>}
                  {business.province && <span className="flex items-center gap-1"><MapPin size={14} />{business.province}</span>}
                </div>
              </div>
            </div>

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
                <div className="h-2 bg-background rounded-full overflow-hidden mb-6">
                  <div className="h-full bg-gradient-gold rounded-full transition-all" style={{ width: `${Math.min(progress, 100)}%` }} />
                </div>

                {/* Invest form */}
                <form onSubmit={handleInvest} className="space-y-3">
                  <Label className="text-foreground">Invest in this campaign</Label>
                  <div className="flex gap-3">
                    <div className="relative flex-1">
                      <DollarSign size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        type="number"
                        min="1"
                        placeholder="Amount in ZMW"
                        value={investAmount}
                        onChange={(e) => setInvestAmount(e.target.value)}
                        className="pl-9 bg-background border-border"
                        required
                      />
                    </div>
                    <Button type="submit" variant="hero" disabled={investing}>
                      {investing ? "Processing..." : "Pledge Investment"}
                    </Button>
                  </div>
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
