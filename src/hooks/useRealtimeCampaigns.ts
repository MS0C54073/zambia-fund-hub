import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";

type Campaign = Tables<"campaigns">;

interface UseRealtimeCampaignsOptions {
  /** Callback when any campaign updates – receives the updated campaign row */
  onUpdate?: (campaign: Campaign) => void;
  /** Show toast notifications for funding changes (useful for investors) */
  notifyOnFunding?: boolean;
  /** Optional map of business_id → name for richer notifications */
  businessNames?: Map<string, string>;
}

export function useRealtimeCampaigns({
  onUpdate,
  notifyOnFunding = false,
  businessNames,
}: UseRealtimeCampaignsOptions = {}) {
  const { toast } = useToast();
  const prevAmounts = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    const channel = supabase
      .channel("campaigns-realtime")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "campaigns" },
        (payload) => {
          const updated = payload.new as Campaign;
          onUpdate?.(updated);

          if (notifyOnFunding) {
            const prev = prevAmounts.current.get(updated.id) ?? 0;
            const current = Number(updated.raised_amount);
            if (current > prev && prev > 0) {
              const diff = current - prev;
              const bizName = businessNames?.get(updated.business_id) ?? "A campaign";
              toast({
                title: "💰 New Investment!",
                description: `${bizName} just received K${diff.toLocaleString()} — now at K${current.toLocaleString()} of K${Number(updated.goal_amount).toLocaleString()}`,
              });
            }
            prevAmounts.current.set(updated.id, current);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [onUpdate, notifyOnFunding, businessNames, toast]);

  /** Call once after initial fetch to seed previous amounts (avoids false notification on first update) */
  const seedAmounts = (campaigns: Campaign[]) => {
    campaigns.forEach((c) => prevAmounts.current.set(c.id, Number(c.raised_amount)));
  };

  return { seedAmounts };
}
