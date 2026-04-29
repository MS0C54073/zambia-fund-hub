import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import type { QueryClient } from "@tanstack/react-query";
import { reportPerf, PERF_THRESHOLDS } from "@/lib/errorLog";

/**
 * Records how long each route takes from URL change to first paint after the
 * lazy chunk + initial data resolve. We use a double rAF as a lightweight
 * "settled" signal — accurate enough to flag slow routes without TTFB tooling.
 */
export function useRouteLoadTimer() {
  const location = useLocation();
  const startRef = useRef<number>(performance.now());

  useEffect(() => {
    startRef.current = performance.now();
    let raf1 = 0;
    let raf2 = 0;
    raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        const dur = performance.now() - startRef.current;
        reportPerf({
          kind: "route",
          label: location.pathname,
          durationMs: dur,
          thresholdMs: PERF_THRESHOLDS.routeLoadMs,
        });
      });
    });
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, [location.pathname]);
}

/**
 * Observe React Query cache and report queries that exceed the slow threshold.
 * Attached once at app boot.
 */
export function attachQueryPerfObserver(client: QueryClient): () => void {
  const cache = client.getQueryCache();
  const startTimes = new Map<string, number>();

  return cache.subscribe((event) => {
    if (!event) return;
    const hash = event.query.queryHash;
    const state = event.query.state;

    if (state.fetchStatus === "fetching" && !startTimes.has(hash)) {
      startTimes.set(hash, performance.now());
      return;
    }
    if (state.fetchStatus === "idle" && startTimes.has(hash)) {
      const dur = performance.now() - (startTimes.get(hash) ?? 0);
      startTimes.delete(hash);
      reportPerf({
        kind: "query",
        label: Array.isArray(event.query.queryKey)
          ? event.query.queryKey.map((p) => (typeof p === "string" ? p : JSON.stringify(p))).join("/")
          : String(event.query.queryKey),
        durationMs: dur,
        thresholdMs: PERF_THRESHOLDS.queryMs,
        extra: { status: state.status },
      });
    }
  });
}
