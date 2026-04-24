import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useSavedBusinesses(userId: string | undefined) {
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const fetchSaved = useCallback(async () => {
    if (!userId) {
      setSavedIds(new Set());
      setLoading(false);
      return;
    }
    const { data } = await supabase.from("saved_businesses").select("business_id").eq("user_id", userId);
    setSavedIds(new Set((data ?? []).map((r) => r.business_id)));
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchSaved();
  }, [fetchSaved]);

  const toggleSave = useCallback(
    async (businessId: string) => {
      if (!userId) return false;
      const isSaved = savedIds.has(businessId);
      if (isSaved) {
        await supabase.from("saved_businesses").delete().eq("user_id", userId).eq("business_id", businessId);
        setSavedIds((prev) => {
          const next = new Set(prev);
          next.delete(businessId);
          return next;
        });
        return false;
      } else {
        await supabase.from("saved_businesses").insert({ user_id: userId, business_id: businessId });
        setSavedIds((prev) => new Set(prev).add(businessId));
        return true;
      }
    },
    [userId, savedIds]
  );

  const isSaved = useCallback((id: string) => savedIds.has(id), [savedIds]);

  return { savedIds, isSaved, toggleSave, loading, refresh: fetchSaved };
}
