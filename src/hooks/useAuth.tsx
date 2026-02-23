import { useEffect, useState } from "react";
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
}

export function useAuth(redirectIfUnauthenticated = true) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_, session) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) {
        const { data } = await supabase.from("profiles").select("*").eq("user_id", u.id).single();
        setProfile(data as Profile | null);
      } else {
        setProfile(null);
        if (redirectIfUnauthenticated) navigate("/auth");
      }
      setLoading(false);
    });

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) {
        const { data } = await supabase.from("profiles").select("*").eq("user_id", u.id).single();
        setProfile(data as Profile | null);
      } else if (redirectIfUnauthenticated) {
        navigate("/auth");
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [navigate, redirectIfUnauthenticated]);

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  return { user, profile, loading, signOut };
}
