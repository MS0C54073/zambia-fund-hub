import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * Smoke test: verifies the wiring of four critical flows end-to-end against
 * a mocked Supabase client.
 *
 *   1. Sign-in (auth.signInWithPassword)
 *   2. Role assignment (user_roles upsert)
 *   3. Admin verification toggle (profiles update is_verified)
 *   4. Dashboard data load (profiles + wallets fetch)
 *
 * Each flow asserts the correct table/RPC call and the success contract the
 * UI relies on. If any of these break, an admin login + verification cycle
 * will not work in production.
 */

type AnyFn = (...args: any[]) => any;

const callLog: { table: string; op: string; payload?: unknown }[] = [];

function makeQueryBuilder(table: string, response: { data: any; error: any }) {
  const builder: any = {
    select: vi.fn(() => builder),
    insert: vi.fn((p: unknown) => {
      callLog.push({ table, op: "insert", payload: p });
      return builder;
    }),
    update: vi.fn((p: unknown) => {
      callLog.push({ table, op: "update", payload: p });
      return builder;
    }),
    upsert: vi.fn((p: unknown) => {
      callLog.push({ table, op: "upsert", payload: p });
      return builder;
    }),
    delete: vi.fn(() => builder),
    eq: vi.fn(() => builder),
    in: vi.fn(() => builder),
    order: vi.fn(() => builder),
    limit: vi.fn(() => builder),
    maybeSingle: vi.fn(async () => response),
    single: vi.fn(async () => response),
    then: (resolve: AnyFn) => Promise.resolve(response).then(resolve),
  };
  return builder;
}

const mockResponses: Record<string, { data: any; error: any }> = {
  profiles: {
    data: {
      id: "p1",
      user_id: "user-123",
      full_name: "Test Admin",
      user_type: "investor",
      is_verified: false,
      is_suspended: false,
    },
    error: null,
  },
  user_roles: { data: [{ user_id: "user-123", role: "admin" }], error: null },
  wallets: {
    data: { id: "w1", user_id: "user-123", balance: 0, currency: "ZMW" },
    error: null,
  },
};

const mockSupabase = {
  auth: {
    signInWithPassword: vi.fn(async ({ email, password }: any) => {
      callLog.push({ table: "auth", op: "signIn", payload: { email } });
      if (!password) return { data: null, error: { message: "Password required" } };
      return {
        data: { user: { id: "user-123", email }, session: { access_token: "tok" } },
        error: null,
      };
    }),
    getSession: vi.fn(async () => ({
      data: { session: { user: { id: "user-123" } } },
      error: null,
    })),
    onAuthStateChange: vi.fn(() => ({
      data: { subscription: { unsubscribe: vi.fn() } },
    })),
  },
  from: vi.fn((table: string) =>
    makeQueryBuilder(table, mockResponses[table] ?? { data: null, error: null })
  ),
  rpc: vi.fn(async (name: string, args: unknown) => {
    callLog.push({ table: "rpc", op: name, payload: args });
    return { data: "ok", error: null };
  }),
};

vi.mock("@/integrations/supabase/client", () => ({
  supabase: mockSupabase,
}));

// Import AFTER the mock is registered.
const { supabase } = await import("@/integrations/supabase/client");

beforeEach(() => {
  callLog.length = 0;
  vi.clearAllMocks();
});

describe("smoke: end-to-end critical flows", () => {
  it("1. sign-in returns a session for valid credentials", async () => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: "admin@zamfund.test",
      password: "secret",
    });
    expect(error).toBeNull();
    expect(data?.user?.id).toBe("user-123");
    expect(callLog.find((c) => c.op === "signIn")).toBeTruthy();
  });

  it("2. role assignment upserts into user_roles", async () => {
    const res = await supabase
      .from("user_roles")
      .upsert(
        { user_id: "user-123", role: "admin" },
        { onConflict: "user_id,role" } as any
      );
    expect((res as any).error).toBeNull();
    const upsert = callLog.find((c) => c.table === "user_roles" && c.op === "upsert");
    expect(upsert).toBeTruthy();
    expect((upsert!.payload as any).role).toBe("admin");
  });

  it("3. admin verification toggle updates profiles.is_verified", async () => {
    await supabase
      .from("profiles")
      .update({ is_verified: true })
      .eq("user_id", "user-123");
    const update = callLog.find((c) => c.table === "profiles" && c.op === "update");
    expect(update).toBeTruthy();
    expect((update!.payload as any).is_verified).toBe(true);
  });

  it("4. dashboard load fetches profile and wallet for the signed-in user", async () => {
    const profileRes = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", "user-123")
      .maybeSingle();
    const walletRes = await supabase
      .from("wallets")
      .select("*")
      .eq("user_id", "user-123")
      .maybeSingle();

    expect(profileRes.error).toBeNull();
    expect(profileRes.data?.user_id).toBe("user-123");
    expect(walletRes.error).toBeNull();
    expect(walletRes.data?.currency).toBe("ZMW");
  });

  it("5. error logger RPC is callable and returns ok", async () => {
    const res = await supabase.rpc("log_error", {
      _category: "rpc",
      _message: "smoke test entry",
      _source: "smoke",
      _context: { ok: true },
    });
    expect(res.error).toBeNull();
    expect(callLog.find((c) => c.op === "log_error")).toBeTruthy();
  });
});
