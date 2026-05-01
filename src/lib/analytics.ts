import { supabase } from "@/integrations/supabase/client";

/**
 * Lightweight, fire-and-forget analytics. Writes to public.analytics_events
 * via the `track_event` RPC. Never throws, never blocks UI.
 *
 * Usage:
 *   track("journey_stage_click", { surface: "journey_showcase", label: "pitch" });
 */

const SESSION_KEY = "zf_session_id";

function getSessionId(): string {
  if (typeof window === "undefined") return "ssr";
  try {
    let id = window.sessionStorage.getItem(SESSION_KEY);
    if (!id) {
      id =
        (crypto as Crypto & { randomUUID?: () => string })?.randomUUID?.() ??
        `s_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
      window.sessionStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return "nostorage";
  }
}

// Per-event dedupe window (ms) to avoid double-fires from rapid clicks.
const DEDUPE_MS = 400;
const lastFired = new Map<string, number>();

export interface TrackOptions {
  surface?: string;
  label?: string;
  properties?: Record<string, unknown>;
}

export function track(event: string, opts: TrackOptions = {}): void {
  if (!event) return;
  const key = `${event}|${opts.surface ?? ""}|${opts.label ?? ""}`;
  const now = Date.now();
  const prev = lastFired.get(key) ?? 0;
  if (now - prev < DEDUPE_MS) return;
  lastFired.set(key, now);

  void (async () => {
    try {
      // Cast: types.ts regenerates after this migration; cast keeps build green meanwhile.
      await (supabase.rpc as unknown as (
        name: string,
        args: Record<string, unknown>,
      ) => Promise<unknown>)("track_event", {
        _event_name: event,
        _surface: opts.surface ?? null,
        _label: opts.label ?? null,
        _session_id: getSessionId(),
        _properties: opts.properties ?? {},
      });
    } catch {
      /* swallow — analytics must never break UX */
    }
  })();
}
