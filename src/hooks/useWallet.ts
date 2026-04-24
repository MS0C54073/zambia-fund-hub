import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type Wallet = Tables<"wallets">;
export type WalletTransaction = Tables<"wallet_transactions">;

export type PaymentProvider =
  | "mtn_momo"
  | "airtel_money"
  | "zamtel_kwacha"
  | "bank_transfer"
  | "wallet"
  | "flutterwave";

export const PAYMENT_PROVIDERS: { value: PaymentProvider; label: string; type: "mobile" | "bank" }[] = [
  { value: "mtn_momo", label: "MTN Mobile Money", type: "mobile" },
  { value: "airtel_money", label: "Airtel Money", type: "mobile" },
  { value: "zamtel_kwacha", label: "Zamtel Kwacha", type: "mobile" },
  { value: "bank_transfer", label: "Bank Transfer", type: "bank" },
];

export function useWallet(userId: string | undefined) {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWallet = useCallback(async () => {
    if (!userId) return;
    const [wRes, tRes] = await Promise.all([
      supabase.from("wallets").select("*").eq("user_id", userId).maybeSingle(),
      supabase
        .from("wallet_transactions")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(50),
    ]);
    setWallet(wRes.data ?? null);
    setTransactions(tRes.data ?? []);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }
    fetchWallet();

    const channel = supabase
      .channel(`wallet-${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "wallets", filter: `user_id=eq.${userId}` },
        (payload) => {
          if (payload.new) setWallet(payload.new as Wallet);
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "wallet_transactions", filter: `user_id=eq.${userId}` },
        (payload) => {
          setTransactions((prev) => [payload.new as WalletTransaction, ...prev].slice(0, 50));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, fetchWallet]);

  const deposit = useCallback(
    async (amount: number, provider: PaymentProvider, phone?: string) => {
      const { data, error } = await supabase.rpc("wallet_deposit", {
        _amount: amount,
        _provider: provider,
        _phone: phone ?? null,
        _reference: `SIM-${Date.now()}`,
      });
      if (error) throw error;
      return data;
    },
    []
  );

  const withdraw = useCallback(
    async (amount: number, provider: PaymentProvider, phone?: string) => {
      const { data, error } = await supabase.rpc("wallet_withdraw", {
        _amount: amount,
        _provider: provider,
        _phone: phone ?? null,
      });
      if (error) throw error;
      return data;
    },
    []
  );

  const invest = useCallback(async (campaignId: string, amount: number) => {
    const { data, error } = await supabase.rpc("wallet_invest", {
      _campaign_id: campaignId,
      _amount: amount,
    });
    if (error) throw error;
    return data;
  }, []);

  return { wallet, transactions, loading, deposit, withdraw, invest, refresh: fetchWallet };
}
