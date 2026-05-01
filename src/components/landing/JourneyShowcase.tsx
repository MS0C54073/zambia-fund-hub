import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { track } from "@/lib/analytics";
import {
  FileText,
  Search,
  HandCoins,
  TrendingUp,
  Sprout,
  LineChart,
  Users,
  Banknote,
  ShieldCheck,
  Briefcase,
} from "lucide-react";

/**
 * "A Day at ZamFund" — synchronized two-panel storytelling loop.
 * Left  = Process stage (founder/investor work)
 * Right = Outcome stage (real result)
 *
 * Pure CSS + Framer-Motion (already in deps). GPU-friendly transforms only.
 * Theme-aware via semantic tokens. Honors prefers-reduced-motion (handled
 * globally in index.css).
 */

type Stage = {
  key: string;
  emoji: string;
  title: string;
  subtitle: string;
  process: { icon: typeof FileText; label: string }[];
  outcome: { icon: typeof TrendingUp; label: string; metric: string };
};

const STAGES: Stage[] = [
  {
    key: "pitch",
    emoji: "📝",
    title: "Pitch Prepared",
    subtitle: "Founders craft a compelling story backed by data",
    process: [
      { icon: FileText, label: "Business plan drafted" },
      { icon: ShieldCheck, label: "KYC & verification" },
      { icon: Briefcase, label: "Campaign launched" },
    ],
    outcome: { icon: Users, label: "Live on marketplace", metric: "500+ verified" },
  },
  {
    key: "discover",
    emoji: "🔍",
    title: "Investors Discover",
    subtitle: "Local & diaspora investors browse curated opportunities",
    process: [
      { icon: Search, label: "Sector filtering" },
      { icon: LineChart, label: "Risk score reviewed" },
      { icon: Users, label: "Founder Q&A" },
    ],
    outcome: { icon: TrendingUp, label: "Shortlist built", metric: "K12.4M browsed" },
  },
  {
    key: "fund",
    emoji: "💰",
    title: "Capital Committed",
    subtitle: "Equity, revenue share, crowdfunding & loan options",
    process: [
      { icon: HandCoins, label: "Investment placed" },
      { icon: ShieldCheck, label: "Escrow secured" },
      { icon: Banknote, label: "Funds released" },
    ],
    outcome: { icon: Banknote, label: "Round closed", metric: "K2.8M raised" },
  },
  {
    key: "grow",
    emoji: "🌱",
    title: "Business Grows",
    subtitle: "Founders execute. Investors track milestones in real time.",
    process: [
      { icon: Sprout, label: "Hiring & expansion" },
      { icon: LineChart, label: "Revenue scaling" },
      { icon: Briefcase, label: "Quarterly updates" },
    ],
    outcome: { icon: TrendingUp, label: "Revenue up", metric: "+38% QoQ" },
  },
  {
    key: "returns",
    emoji: "📈",
    title: "Returns Distributed",
    subtitle: "Payouts flow back to investors — automatically.",
    process: [
      { icon: Banknote, label: "Payout calculated" },
      { icon: ShieldCheck, label: "Compliance check" },
      { icon: HandCoins, label: "Wallet credited" },
    ],
    outcome: { icon: TrendingUp, label: "ROI realised", metric: "18.2% IRR" },
  },
];

const CYCLE_MS = 4200;
const SURFACE = "journey_showcase";

const JourneyShowcase = () => {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const sectionRef = useRef<HTMLElement | null>(null);
  const impressionFiredRef = useRef(false);
  const stageEnteredAtRef = useRef<number>(performance.now());

  // Fire a one-shot "viewed" event the first time the section enters the viewport.
  useEffect(() => {
    const el = sectionRef.current;
    if (!el || impressionFiredRef.current) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting && !impressionFiredRef.current) {
            impressionFiredRef.current = true;
            track("journey_showcase_viewed", { surface: SURFACE });
            io.disconnect();
            break;
          }
        }
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Auto-advance loop. Pauses on hover/focus so the chip click metric stays clean.
  useEffect(() => {
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce || paused) return;
    const id = window.setInterval(() => {
      setIndex((i) => {
        const next = (i + 1) % STAGES.length;
        track("journey_stage_advance", {
          surface: SURFACE,
          label: STAGES[next].key,
          properties: {
            from: STAGES[i].key,
            to: STAGES[next].key,
            trigger: "auto",
            dwell_ms: Math.round(performance.now() - stageEnteredAtRef.current),
          },
        });
        stageEnteredAtRef.current = performance.now();
        return next;
      });
    }, CYCLE_MS);
    return () => window.clearInterval(id);
  }, [paused]);

  const goToStage = (nextIdx: number, trigger: "click" | "keyboard") => {
    if (nextIdx === index) return;
    const from = STAGES[index].key;
    const to = STAGES[nextIdx].key;
    track("journey_stage_click", {
      surface: SURFACE,
      label: to,
      properties: {
        from,
        to,
        trigger,
        from_index: index,
        to_index: nextIdx,
        dwell_ms: Math.round(performance.now() - stageEnteredAtRef.current),
      },
    });
    stageEnteredAtRef.current = performance.now();
    setIndex(nextIdx);
  };

  const stage = STAGES[index];

  return (
    <section
      ref={sectionRef}
      aria-label="A day at ZamFund — the investment journey"
      className="relative py-20 md:py-28 bg-background overflow-hidden"
      onMouseEnter={() => {
        setPaused(true);
        track("journey_carousel_pause", { surface: SURFACE, properties: { reason: "hover" } });
      }}
      onMouseLeave={() => {
        setPaused(false);
        track("journey_carousel_resume", { surface: SURFACE, properties: { reason: "hover_end" } });
      }}
      onFocus={() => setPaused(true)}
      onBlur={(e) => {
        // only resume if focus has actually left the section
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setPaused(false);
      }}
    >
      <div className="container px-4">
        {/* Heading */}
        <div className="max-w-2xl mx-auto text-center mb-12">
          <span className="inline-block px-4 py-1.5 rounded-full border border-primary/30 text-primary text-sm font-medium mb-4">
            A Day at ZamFund
          </span>
          <h2 className="text-3xl md:text-5xl font-display font-bold mb-4">
            From <span className="text-gradient-gold">pitch</span> to{" "}
            <span className="text-gradient-gold">payout</span>
          </h2>
          <p className="text-muted-foreground text-base md:text-lg">
            Watch how founders and investors move together through every stage of a
            funded venture.
          </p>
        </div>

        {/* Stage indicator chips */}
        <div
          role="tablist"
          aria-label="Journey stages"
          className="flex flex-wrap items-center justify-center gap-2 mb-10"
        >
          {STAGES.map((s, i) => {
            const active = i === index;
            return (
              <button
                key={s.key}
                role="tab"
                aria-selected={active}
                aria-label={`${s.emoji} ${s.title}`}
                onClick={() => goToStage(i, "click")}
                className={[
                  "px-3 py-1.5 rounded-full text-xs md:text-sm font-medium border transition-all",
                  active
                    ? "border-primary/60 bg-primary/10 text-foreground shadow-[0_0_0_3px_hsl(var(--primary)/0.08)]"
                    : "border-border text-muted-foreground hover:text-foreground hover:border-primary/30",
                ].join(" ")}
              >
                <span className="mr-1.5" aria-hidden>
                  {s.emoji}
                </span>
                {s.title}
              </button>
            );
          })}
        </div>

        {/* Two-panel synchronized storytelling */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-6 lg:gap-4 items-stretch">
          {/* LEFT — process */}
          <Panel
            label="Process"
            tone="muted"
            stageKey={stage.key + "-process"}
            heading={stage.title}
            sub={stage.subtitle}
          >
            <ul className="space-y-3">
              {stage.process.map((step, i) => (
                <motion.li
                  key={step.label}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 + i * 0.12, duration: 0.45, ease: "easeOut" }}
                  className="flex items-center gap-3 rounded-lg border border-border/60 bg-surface/60 px-3 py-2.5"
                >
                  <span className="w-9 h-9 rounded-md bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                    <step.icon size={18} />
                  </span>
                  <span className="text-sm text-foreground">{step.label}</span>
                </motion.li>
              ))}
            </ul>
          </Panel>

          {/* CONNECTOR — animated arrow */}
          <div
            aria-hidden
            className="hidden lg:flex items-center justify-center w-20"
          >
            <div className="relative w-full h-px">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
              <motion.div
                key={stage.key + "-dot"}
                initial={{ x: 0, opacity: 0 }}
                animate={{ x: "100%", opacity: [0, 1, 1, 0] }}
                transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -top-1 w-2 h-2 rounded-full bg-primary shadow-[0_0_12px_hsl(var(--primary)/0.8)]"
              />
            </div>
          </div>

          {/* RIGHT — outcome */}
          <Panel
            label="Outcome"
            tone="primary"
            stageKey={stage.key + "-outcome"}
            heading={stage.outcome.label}
            sub="Result delivered on the marketplace"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="rounded-xl border border-primary/30 bg-gradient-card p-5 flex items-center gap-4"
            >
              <span className="w-14 h-14 rounded-xl bg-primary/15 text-primary flex items-center justify-center flex-shrink-0">
                <stage.outcome.icon size={28} />
              </span>
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
                  {stage.title}
                </p>
                <p className="text-2xl md:text-3xl font-display font-bold text-gradient-gold leading-tight">
                  {stage.outcome.metric}
                </p>
              </div>
            </motion.div>

            {/* Subtle pulsing rings to suggest live activity */}
            <div className="relative mt-5 h-16" aria-hidden>
              <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-primary" />
              <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-primary/40 mp-ring" />
              <span
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-primary/40 mp-ring"
                style={{ animationDelay: "1.2s" }}
              />
            </div>
          </Panel>
        </div>

        {/* Progress bar */}
        <div className="mt-10 max-w-xl mx-auto">
          <div className="h-1 w-full rounded-full bg-border/60 overflow-hidden">
            <motion.div
              key={stage.key + "-bar"}
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: CYCLE_MS / 1000, ease: "linear" }}
              className="h-full bg-gradient-gold"
            />
          </div>
          <p className="mt-3 text-center text-xs text-muted-foreground">
            Stage {index + 1} of {STAGES.length} · auto-advancing
          </p>
        </div>
      </div>
    </section>
  );
};

/* ---------- Panel ---------- */

const Panel = ({
  label,
  tone,
  stageKey,
  heading,
  sub,
  children,
}: {
  label: string;
  tone: "muted" | "primary";
  stageKey: string;
  heading: string;
  sub: string;
  children: React.ReactNode;
}) => {
  return (
    <div
      className={[
        "relative rounded-2xl border p-5 md:p-6 min-h-[280px] overflow-hidden",
        tone === "primary"
          ? "border-primary/25 bg-gradient-card"
          : "border-border bg-card/60",
      ].join(" ")}
    >
      <div className="flex items-center justify-between mb-4">
        <span className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          {label}
        </span>
        <span
          className={[
            "h-2 w-2 rounded-full",
            tone === "primary" ? "bg-primary" : "bg-muted-foreground/50",
          ].join(" ")}
          aria-hidden
        />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={stageKey}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          <h3 className="text-xl md:text-2xl font-display font-semibold mb-1.5">
            {heading}
          </h3>
          <p className="text-sm text-muted-foreground mb-5">{sub}</p>
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default JourneyShowcase;
