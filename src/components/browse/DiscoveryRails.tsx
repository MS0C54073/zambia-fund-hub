import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { TrendingUp, Sparkles, MapPin, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import RealtimeProgressBar from "@/components/RealtimeProgressBar";
import VerifiedBadge from "@/components/VerifiedBadge";
import CampaignUrgency from "@/components/CampaignUrgency";
import type { Tables } from "@/integrations/supabase/types";

type Business = Tables<"businesses">;
type Campaign = Tables<"campaigns">;

export interface BizWithCampaign extends Business {
  campaign?: Campaign | null;
}

interface Props {
  businesses: BizWithCampaign[];
  userProvince?: string | null;
}

const RAIL_LIMIT = 6;

function MiniCard({ biz }: { biz: BizWithCampaign }) {
  const camp = biz.campaign;
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-w-[260px] max-w-[260px] snap-start bg-card border border-border/50 rounded-xl p-4 hover:border-primary/30 transition-colors"
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <VerifiedBadge verified={biz.is_verified} />
        {camp?.end_date && <CampaignUrgency endDate={camp.end_date} />}
      </div>
      <h4 className="font-display font-semibold text-sm text-foreground truncate">{biz.name}</h4>
      <p className="text-[11px] text-muted-foreground truncate">
        {biz.industry ?? "—"} {biz.province && `• ${biz.province}`}
      </p>
      {camp && (
        <div className="mt-3">
          <RealtimeProgressBar
            raised={Number(camp.raised_amount)}
            goal={Number(camp.goal_amount)}
            className="h-1.5"
          />
        </div>
      )}
      <Button variant="ghost" size="sm" className="mt-3 w-full justify-between h-8 text-xs" asChild>
        <Link to={`/business/${biz.id}`}>
          View <ArrowRight size={12} />
        </Link>
      </Button>
    </motion.div>
  );
}

function Rail({
  title,
  icon: Icon,
  items,
  emptyText,
}: {
  title: string;
  icon: typeof TrendingUp;
  items: BizWithCampaign[];
  emptyText: string;
}) {
  if (items.length === 0) {
    return (
      <section className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Icon size={16} className="text-primary" />
          <h3 className="text-sm font-display font-semibold text-foreground">{title}</h3>
        </div>
        <p className="text-xs text-muted-foreground italic">{emptyText}</p>
      </section>
    );
  }
  return (
    <section className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <Icon size={16} className="text-primary" />
        <h3 className="text-sm font-display font-semibold text-foreground">{title}</h3>
        <span className="text-xs text-muted-foreground">({items.length})</span>
      </div>
      <div className="flex gap-3 overflow-x-auto snap-x scroll-pl-1 pb-2 -mx-1 px-1">
        {items.map((b) => <MiniCard key={b.id} biz={b} />)}
      </div>
    </section>
  );
}

export default function DiscoveryRails({ businesses, userProvince }: Props) {
  const withCampaign = businesses.filter((b) => b.campaign);

  // Trending: highest raised_amount among active campaigns
  const trending = [...withCampaign]
    .sort((a, b) => Number(b.campaign!.raised_amount) - Number(a.campaign!.raised_amount))
    .slice(0, RAIL_LIMIT);

  // Featured: verified + has decent completeness
  const featured = withCampaign
    .filter((b) => b.is_verified && b.is_approved)
    .sort((a, b) => {
      const ap = Number(a.campaign!.raised_amount) / Number(a.campaign!.goal_amount || 1);
      const bp = Number(b.campaign!.raised_amount) / Number(b.campaign!.goal_amount || 1);
      return bp - ap;
    })
    .slice(0, RAIL_LIMIT);

  // Closing soon: campaigns with an end_date in the next 30 days
  const closingSoon = withCampaign
    .filter((b) => {
      if (!b.campaign?.end_date) return false;
      const ms = new Date(b.campaign.end_date).getTime() - Date.now();
      return ms > 0 && ms < 1000 * 60 * 60 * 24 * 30;
    })
    .sort(
      (a, b) =>
        new Date(a.campaign!.end_date!).getTime() - new Date(b.campaign!.end_date!).getTime(),
    )
    .slice(0, RAIL_LIMIT);

  // Near you: same province as logged-in user
  const nearYou = userProvince
    ? withCampaign.filter((b) => b.province === userProvince).slice(0, RAIL_LIMIT)
    : [];

  return (
    <div className="mb-8 space-y-2">
      <Rail
        title="Trending"
        icon={TrendingUp}
        items={trending}
        emptyText="No active campaigns yet."
      />
      <Rail
        title="Featured"
        icon={Sparkles}
        items={featured}
        emptyText="No verified businesses with active campaigns yet."
      />
      {closingSoon.length > 0 && (
        <Rail
          title="Closing soon"
          icon={TrendingUp}
          items={closingSoon}
          emptyText="No campaigns closing soon."
        />
      )}
      {userProvince && (
        <Rail
          title={`Near you · ${userProvince}`}
          icon={MapPin}
          items={nearYou}
          emptyText={`No active campaigns in ${userProvince} yet.`}
        />
      )}
    </div>
  );
}
