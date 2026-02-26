import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

export interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  phone: string | null;
  province: string | null;
  user_type: string;
  avatar_url: string | null;
  is_verified: boolean;
  is_suspended: boolean;
}

async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  return data as Profile | null;
}

export function useAuth(redirectIfUnauthenticated = true) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const initialized = useRef(false);

  useEffect(() => {
    // 1. Set up auth listener FIRST (per Supabase docs)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const u = session?.user ?? null;
        setUser(u);

        if (u) {
          // Use setTimeout to avoid blocking the auth callback
          setTimeout(async () => {
            const p = await fetchProfile(u.id);
            setProfile(p);
            setLoading(false);
          }, 0);
        } else {
          setProfile(null);
          setLoading(false);
          if (initialized.current && redirectIfUnauthenticated) {
            navigate("/auth");
          }
        }
      }
    );

    // 2. Then check existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      const u = session?.user ?? null;
      setUser(u);

      if (u) {
        const p = await fetchProfile(u.id);
        setProfile(p);
      } else if (redirectIfUnauthenticated) {
        navigate("/auth");
      }
      setLoading(false);
      initialized.current = true;
    });

    return () => subscription.unsubscribe();
  }, [navigate, redirectIfUnauthenticated]);

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  return { user, profile, loading, signOut };
}
