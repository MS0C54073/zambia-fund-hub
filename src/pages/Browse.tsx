import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/landing/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, MapPin, TrendingUp, Filter } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useRealtimeCampaigns } from "@/hooks/useRealtimeCampaigns";
import RealtimeProgressBar from "@/components/RealtimeProgressBar";
import type { Tables } from "@/integrations/supabase/types";

type Business = Tables<"businesses">;
type Campaign = Tables<"campaigns">;

interface BizWithCampaign extends Business {
  campaign?: Campaign | null;
}

const Browse = () => {
  const [search, setSearch] = useState("");
  const [businesses, setBusinesses] = useState<BizWithCampaign[]>([]);
  const [loading, setLoading] = useState(true);

  // Real-time: update campaign data when it changes
  const handleCampaignUpdate = useCallback((updated: Tables<"campaigns">) => {
    setBusinesses((prev) =>
      prev.map((b) =>
        b.campaign?.id === updated.id ? { ...b, campaign: updated } : b
      )
    );
  }, []);

  const { seedAmounts } = useRealtimeCampaigns({
    onUpdate: handleCampaignUpdate,
    notifyOnFunding: true,
  });

  useEffect(() => {
    const fetchData = async () => {
      const { data: bizData } = await supabase
        .from("businesses")
        .select("*")
        .eq("is_approved", true);

      const biz = bizData ?? [];

      if (biz.length > 0) {
        const { data: campData } = await supabase
          .from("campaigns")
          .select("*")
          .in("business_id", biz.map((b) => b.id))
          .eq("status", "active");

        const camps = campData ?? [];
        seedAmounts(camps);
        const campMap = new Map(camps.map((c) => [c.business_id, c]));
        setBusinesses(biz.map((b) => ({ ...b, campaign: campMap.get(b.id) ?? null })));
      } else {
        setBusinesses([]);
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  const filtered = businesses.filter(
    (b) =>
      b.name.toLowerCase().includes(search.toLowerCase()) ||
      (b.industry ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container px-4 pt-24 pb-16">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <h1 className="text-3xl md:text-4xl font-display font-bold mb-2 text-foreground">
            Browse <span className="text-gradient-gold">Opportunities</span>
          </h1>
          <p className="text-muted-foreground">Discover verified Zambian businesses ready for investment.</p>
        </motion.div>

        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <Input
              placeholder="Search by name or industry..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-secondary border-border"
            />
          </div>
          <Button variant="outline" className="gap-2">
            <Filter size={16} /> Filters
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            No approved businesses found. Check back soon!
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((biz, i) => {
              const camp = biz.campaign;
              return (
                <motion.div
                  key={biz.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-card rounded-2xl border border-border/50 p-6 hover:border-primary/30 transition-all group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      {camp && (
                        <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full capitalize">
                          {camp.funding_type.replace("_", " ")}
                        </span>
                      )}
                      <h3 className="text-lg font-display font-semibold text-foreground mt-2">{biz.name}</h3>
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{biz.description}</p>

                  <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
                    {biz.province && <span className="flex items-center gap-1"><MapPin size={12} /> {biz.province}</span>}
                    {biz.industry && <span className="flex items-center gap-1"><TrendingUp size={12} /> {biz.industry}</span>}
                  </div>

                  {camp && (
                    <RealtimeProgressBar
                      raised={Number(camp.raised_amount)}
                      goal={Number(camp.goal_amount)}
                      className="mb-3"
                    />
                  )}

                  <Button variant="hero-outline" size="sm" className="w-full" asChild>
                    <Link to={`/business/${biz.id}`}>View Details</Link>
                  </Button>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Browse;
