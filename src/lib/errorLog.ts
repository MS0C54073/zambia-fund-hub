import { supabase } from "@/integrations/supabase/client";

export type ErrorCategory =
  | "rpc"
  | "rls"
  | "payment"
  | "transaction"
  | "auth"
  | "render"
  | "perf"
  | "other";

interface LogOptions {
  category: ErrorCategory;
  source?: string;
  context?: Record<string, unknown>;
}

/**
 * Best-effort error capture. Never throws — failures are swallowed and logged
 * to the console so they don't cascade into the user flow.
 *
 * The classifier infers RLS denials from PostgREST error codes/messages.
 */
export async function logError(err: unknown, opts: LogOptions): Promise<void> {
  try {
    const anyErr = err as any;
    const message: string =
      (anyErr?.message as string) ||
      (typeof err === "string" ? err : JSON.stringify(err));

    const code: string | undefined = anyErr?.code;
    const details: string | undefined = anyErr?.details;
    const hint: string | undefined = anyErr?.hint;

    // Auto-upgrade category for RLS / permission denials
    let category = opts.category;
    if (
      code === "42501" ||
      /row-level security|permission denied|violates row-level/i.test(message)
    ) {
      category = "rls";
    }

    await supabase.rpc("log_error", {
      _category: category,
      _message: message.slice(0, 1000),
      _source: opts.source ?? null,
      _context: {
        ...(opts.context ?? {}),
        code,
        details,
        hint,
      } as any,
    });
  } catch (loggerErr) {
    // eslint-disable-next-line no-console
    console.warn("[errorLog] failed to record error", loggerErr);
  }
}

// ---------------------------------------------------------------------------
// Performance monitoring
// ---------------------------------------------------------------------------

// Tunable thresholds (ms). Anything slower than these is sent to error_logs
// under the "perf" category so admins can see real-world hotspots.
export const PERF_THRESHOLDS = {
  routeLoadMs: 2500,
  queryMs: 1500,
  rpcMs: 1500,
};

// Simple in-memory dedupe so a slow endpoint doesn't flood the logs table.
const recentlyReported = new Map<string, number>();
const DEDUPE_WINDOW_MS = 60_000;

function shouldReport(key: string): boolean {
  const now = Date.now();
  const last = recentlyReported.get(key) ?? 0;
  if (now - last < DEDUPE_WINDOW_MS) return false;
  recentlyReported.set(key, now);
  // light cleanup
  if (recentlyReported.size > 200) {
    for (const [k, t] of recentlyReported) {
      if (now - t > DEDUPE_WINDOW_MS) recentlyReported.delete(k);
    }
  }
  return true;
}

interface PerfEvent {
  kind: "route" | "query" | "rpc";
  label: string;        // route path, query key, or rpc name
  durationMs: number;
  thresholdMs: number;
  extra?: Record<string, unknown>;
}

export function reportPerf(evt: PerfEvent): void {
  if (evt.durationMs < evt.thresholdMs) return;
  const key = `${evt.kind}:${evt.label}`;
  if (!shouldReport(key)) return;

  // Fire-and-forget; never await in caller paths.
  supabase
    .rpc("log_error", {
      _category: "perf",
      _message: `Slow ${evt.kind}: ${evt.label} took ${Math.round(evt.durationMs)}ms`,
      _source: `perf:${evt.kind}`,
      _context: {
        durationMs: Math.round(evt.durationMs),
        thresholdMs: evt.thresholdMs,
        label: evt.label,
        ...(evt.extra ?? {}),
      } as any,
    })
    .then(() => {})
    .catch(() => {
      /* swallow — monitoring must never break UX */
    });
}

/**
 * Wrap an RPC call to time it and report slow ones. Returns the original
 * Supabase response unchanged so call sites don't need to change shape.
 */
export async function timedRpc<T>(
  name: string,
  exec: () => Promise<T>,
): Promise<T> {
  const start = performance.now();
  try {
    return await exec();
  } finally {
    const dur = performance.now() - start;
    reportPerf({
      kind: "rpc",
      label: name,
      durationMs: dur,
      thresholdMs: PERF_THRESHOLDS.rpcMs,
    });
  }
}

// ---------------------------------------------------------------------------
// Storage access denial logging
// ---------------------------------------------------------------------------

export async function logStorageDenial(
  bucket: string,
  path: string,
  reason?: string,
): Promise<void> {
  try {
    await supabase.rpc("log_storage_denial", {
      _bucket: bucket,
      _path: path,
      _reason: reason ?? null,
    });
  } catch {
    /* ignore */
  }
}

