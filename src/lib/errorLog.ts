import { supabase } from "@/integrations/supabase/client";

export type ErrorCategory = "rpc" | "rls" | "payment" | "transaction" | "auth" | "other";

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
