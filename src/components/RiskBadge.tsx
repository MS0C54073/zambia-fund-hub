import { ShieldCheck, ShieldAlert, ShieldQuestion } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { assessRisk, RISK_LEVEL_STYLES } from "@/lib/riskScore";
import type { Tables } from "@/integrations/supabase/types";

interface Props {
  business: Tables<"businesses">;
  campaign?: Tables<"campaigns"> | null;
  size?: "sm" | "md";
  showScore?: boolean;
}

const ICONS = {
  low: ShieldCheck,
  medium: ShieldQuestion,
  high: ShieldAlert,
};

export default function RiskBadge({ business, campaign, size = "sm", showScore = true }: Props) {
  const risk = assessRisk(business, campaign);
  const Icon = ICONS[risk.level];
  const sizeCls = size === "sm" ? "text-[10px] px-2 py-0.5 gap-1" : "text-xs px-2.5 py-1 gap-1.5";

  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={`inline-flex items-center rounded-full border font-medium ${sizeCls} ${RISK_LEVEL_STYLES[risk.level]}`}
          >
            <Icon size={size === "sm" ? 11 : 13} />
            {risk.label}
            {showScore && <span className="opacity-70">· {risk.score}</span>}
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <p className="font-medium mb-1">Risk score: {risk.score}/100</p>
          <ul className="space-y-0.5 text-xs">
            {risk.factors.map((f, i) => (
              <li key={i} className={f.positive ? "text-green-400" : "text-yellow-400"}>
                {f.positive ? "✓" : "!"} {f.label}
              </li>
            ))}
          </ul>
          <p className="text-[10px] text-muted-foreground mt-2">
            Heuristic estimate based on verification, completeness, and traction. Not financial advice.
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
