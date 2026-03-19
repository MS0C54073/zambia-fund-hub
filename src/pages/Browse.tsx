import { useState, useEffect, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/landing/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, MapPin, TrendingUp, Filter, X, ArrowUpDown, ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useRealtimeCampaigns } from "@/hooks/useRealtimeCampaigns";
import RealtimeProgressBar from "@/components/RealtimeProgressBar";
import type { Tables } from "@/integrations/supabase/types";

type Business = Tables<"businesses">;
type Campaign = Tables<"campaigns">;

interface BizWithCampaign extends Business {
  campaign?: Campaign | null;
}

const PROVINCES = [
  "Central", "Copperbelt", "Eastern", "Luapula", "Lusaka",
  "Muchinga", "Northern", "North-Western", "Southern", "Western",
];

const FUNDING_TYPES = [
  { value: "equity", label: "Equity" },
  { value: "revenue_share", label: "Revenue Share" },
  { value: "crowdfunding", label: "Crowdfunding" },
  { value: "loan", label: "Loan" },
];

const SORT_OPTIONS = [
  { value: "newest", label: "Newest First" },
  { value: "most_funded", label: "Most Funded" },
  { value: "closest_to_goal", label: "Closest to Goal" },
  { value: "name_asc", label: "Name A–Z" },
];

const PAGE_SIZE = 9;

const Browse = () => {
  const [search, setSearch] = useState("");
  const [businesses, setBusinesses] = useState<BizWithCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [industryFilter, setIndustryFilter] = useState<string>("all");
  const [provinceFilter, setProvinceFilter] = useState<string>("all");
  const [fundingTypeFilter, setFundingTypeFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("newest");
  const [page, setPage] = useState(1);

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

  const industries = useMemo(() => {
    const set = new Set<string>();
    businesses.forEach((b) => { if (b.industry) set.add(b.industry); });
    return Array.from(set).sort();
  }, [businesses]);

  // Filter + sort
  const sortedFiltered = useMemo(() => {
    const result = businesses.filter((b) => {
      const matchesSearch =
        b.name.toLowerCase().includes(search.toLowerCase()) ||
        (b.industry ?? "").toLowerCase().includes(search.toLowerCase());
      const matchesIndustry = industryFilter === "all" || b.industry === industryFilter;
      const matchesProvince = provinceFilter === "all" || b.province === provinceFilter;
      const matchesFunding =
        fundingTypeFilter === "all" || b.campaign?.funding_type === fundingTypeFilter;
      return matchesSearch && matchesIndustry && matchesProvince && matchesFunding;
    });

    result.sort((a, b) => {
      switch (sortBy) {
        case "most_funded": {
          const aRaised = Number(a.campaign?.raised_amount ?? 0);
          const bRaised = Number(b.campaign?.raised_amount ?? 0);
          return bRaised - aRaised;
        }
        case "closest_to_goal": {
          const aPct = a.campaign ? Number(a.campaign.raised_amount) / Number(a.campaign.goal_amount) : 0;
          const bPct = b.campaign ? Number(b.campaign.raised_amount) / Number(b.campaign.goal_amount) : 0;
          return bPct - aPct;
        }
        case "name_asc":
          return a.name.localeCompare(b.name);
        case "newest":
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

    return result;
  }, [businesses, search, industryFilter, provinceFilter, fundingTypeFilter, sortBy]);

  // Reset page when filters/sort/search change
  useEffect(() => { setPage(1); }, [search, industryFilter, provinceFilter, fundingTypeFilter, sortBy]);

  const totalPages = Math.max(1, Math.ceil(sortedFiltered.length / PAGE_SIZE));
  const paged = sortedFiltered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const activeFilterCount = [industryFilter, provinceFilter, fundingTypeFilter].filter(
    (f) => f !== "all"
  ).length;

  const clearFilters = () => {
    setIndustryFilter("all");
    setProvinceFilter("all");
    setFundingTypeFilter("all");
  };

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

        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <Input
              placeholder="Search by name or industry..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-secondary border-border"
            />
          </div>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="bg-secondary border-border w-full md:w-48 gap-2">
              <ArrowUpDown size={14} className="text-muted-foreground shrink-0" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            className="gap-2"
            onClick={() => setShowFilters((v) => !v)}
          >
            <Filter size={16} />
            Filters
            {activeFilterCount > 0 && (
              <span className="ml-1 bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </Button>
        </div>

        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden mb-6"
            >
              <div className="flex flex-col sm:flex-row gap-3 p-4 bg-card border border-border/50 rounded-xl">
                <Select value={industryFilter} onValueChange={setIndustryFilter}>
                  <SelectTrigger className="bg-secondary border-border sm:w-48">
                    <SelectValue placeholder="Industry" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Industries</SelectItem>
                    {industries.map((ind) => (
                      <SelectItem key={ind} value={ind}>{ind}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={provinceFilter} onValueChange={setProvinceFilter}>
                  <SelectTrigger className="bg-secondary border-border sm:w-48">
                    <SelectValue placeholder="Province" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Provinces</SelectItem>
                    {PROVINCES.map((p) => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={fundingTypeFilter} onValueChange={setFundingTypeFilter}>
                  <SelectTrigger className="bg-secondary border-border sm:w-48">
                    <SelectValue placeholder="Funding Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {FUNDING_TYPES.map((ft) => (
                      <SelectItem key={ft.value} value={ft.value}>{ft.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {activeFilterCount > 0 && (
                  <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1 text-muted-foreground">
                    <X size={14} /> Clear
                  </Button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Result count */}
        {!loading && sortedFiltered.length > 0 && (
          <p className="text-sm text-muted-foreground mb-4">
            Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, sortedFiltered.length)} of {sortedFiltered.length} businesses
          </p>
        )}

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : sortedFiltered.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            {activeFilterCount > 0 || search
              ? "No businesses match your filters. Try adjusting your criteria."
              : "No approved businesses found. Check back soon!"}
          </div>
        ) : (
          <>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paged.map((biz, i) => {
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

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-10">
                <Button
                  variant="outline"
                  size="icon"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  <ChevronLeft size={16} />
                </Button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <Button
                    key={p}
                    variant={p === page ? "default" : "outline"}
                    size="icon"
                    onClick={() => setPage(p)}
                    className="w-9 h-9"
                  >
                    {p}
                  </Button>
                ))}

                <Button
                  variant="outline"
                  size="icon"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  <ChevronRight size={16} />
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Browse;
