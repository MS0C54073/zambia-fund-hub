import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type KycSubmission = Tables<"kyc_submissions">;
export type KycStatus = "not_submitted" | "pending" | "approved" | "rejected";

export function useKyc(userId: string | undefined) {
  const [individual, setIndividual] = useState<KycSubmission | null>(null);
  const [businessKycs, setBusinessKycs] = useState<KycSubmission[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from("kyc_submissions")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    const all = (data ?? []) as KycSubmission[];
    setIndividual(all.find((k) => k.kind === "individual") ?? null);
    setBusinessKycs(all.filter((k) => k.kind === "business"));
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`kyc-${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "kyc_submissions", filter: `user_id=eq.${userId}` },
        () => refresh()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, refresh]);

  const status: KycStatus = individual?.status ?? "not_submitted";
  const isApproved = status === "approved";
  const canInvest = isApproved;

  return { individual, businessKycs, loading, status, isApproved, canInvest, refresh };
}
