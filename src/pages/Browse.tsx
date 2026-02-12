import { useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/landing/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, MapPin, TrendingUp, Filter } from "lucide-react";
import { motion } from "framer-motion";

const MOCK_BUSINESSES = [
  {
    id: 1,
    name: "Lusaka Solar Solutions",
    industry: "Clean Energy",
    province: "Lusaka",
    fundingType: "Equity",
    goal: 500000,
    raised: 320000,
    stage: "Growth",
    description: "Affordable solar panels and installation for urban and peri-urban households.",
  },
  {
    id: 2,
    name: "ChiTenge Fashion House",
    industry: "Fashion & Textiles",
    province: "Copperbelt",
    fundingType: "Crowdfunding",
    goal: 150000,
    raised: 98000,
    stage: "Early",
    description: "Modern African fashion brand using locally sourced chitenge fabrics.",
  },
  {
    id: 3,
    name: "FarmLink Zambia",
    industry: "AgriTech",
    province: "Southern",
    fundingType: "Revenue Share",
    goal: 800000,
    raised: 450000,
    stage: "Scaling",
    description: "Connecting smallholder farmers directly to buyers through our digital marketplace.",
  },
  {
    id: 4,
    name: "MedAccess Clinics",
    industry: "Healthcare",
    province: "Lusaka",
    fundingType: "Loan",
    goal: 1200000,
    raised: 600000,
    stage: "Growth",
    description: "Affordable private healthcare clinics in underserved communities.",
  },
  {
    id: 5,
    name: "ZamPay Digital",
    industry: "FinTech",
    province: "Lusaka",
    fundingType: "Equity",
    goal: 2000000,
    raised: 1400000,
    stage: "Series A",
    description: "Mobile-first payment platform for cross-border transactions in Southern Africa.",
  },
  {
    id: 6,
    name: "Kafue Fish Farms",
    industry: "Aquaculture",
    province: "Southern",
    fundingType: "Revenue Share",
    goal: 350000,
    raised: 120000,
    stage: "Early",
    description: "Sustainable tilapia farming with modern aquaculture techniques.",
  },
];

const Browse = () => {
  const [search, setSearch] = useState("");

  const filtered = MOCK_BUSINESSES.filter(
    (b) => b.name.toLowerCase().includes(search.toLowerCase()) || b.industry.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container px-4 pt-24 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
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

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((biz, i) => {
            const progress = Math.round((biz.raised / biz.goal) * 100);
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
                    <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                      {biz.fundingType}
                    </span>
                    <h3 className="text-lg font-display font-semibold text-foreground mt-2">{biz.name}</h3>
                  </div>
                  <span className="text-xs text-muted-foreground bg-secondary px-2 py-1 rounded-full">{biz.stage}</span>
                </div>

                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{biz.description}</p>

                <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
                  <span className="flex items-center gap-1"><MapPin size={12} /> {biz.province}</span>
                  <span className="flex items-center gap-1"><TrendingUp size={12} /> {biz.industry}</span>
                </div>

                <div className="mb-3">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">K{(biz.raised / 1000).toFixed(0)}k raised</span>
                    <span className="text-primary font-medium">{progress}%</span>
                  </div>
                  <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-gold rounded-full transition-all" style={{ width: `${progress}%` }} />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Goal: K{(biz.goal / 1000).toFixed(0)}k ZMW</p>
                </div>

                <Button variant="hero-outline" size="sm" className="w-full" asChild>
                  <Link to="/auth">View Details</Link>
                </Button>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Browse;
