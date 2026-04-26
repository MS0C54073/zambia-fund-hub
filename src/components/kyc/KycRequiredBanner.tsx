import { Link } from "react-router-dom";
import { ShieldAlert, Clock, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { KycStatus } from "@/hooks/useKyc";

interface Props {
  status: KycStatus;
  to?: string;
  compact?: boolean;
}

const messages: Record<KycStatus, { title: string; body: string; tone: string; Icon: typeof ShieldAlert }> = {
  not_submitted: {
    title: "Verify your identity to invest",
    body: "Zambian SEC regulations require NRC verification before you can place investments.",
    tone: "border-yellow-500/30 bg-yellow-500/5 text-yellow-400",
    Icon: ShieldAlert,
  },
  pending: {
    title: "Verification in progress",
    body: "We're reviewing your NRC submission. Investing unlocks once approved (usually within 24h).",
    tone: "border-yellow-500/30 bg-yellow-500/5 text-yellow-400",
    Icon: Clock,
  },
  rejected: {
    title: "Verification rejected",
    body: "Please update your KYC submission and resubmit for review.",
    tone: "border-destructive/30 bg-destructive/5 text-destructive",
    Icon: XCircle,
  },
  approved: {
    title: "",
    body: "",
    tone: "",
    Icon: ShieldAlert,
  },
};

export default function KycRequiredBanner({ status, to = "/dashboard?tab=verification", compact }: Props) {
  if (status === "approved") return null;
  const m = messages[status];
  const Icon = m.Icon;

  return (
    <div className={`flex items-start gap-3 p-3 rounded-lg border ${m.tone} ${compact ? "text-xs" : "text-sm"}`}>
      <Icon size={compact ? 14 : 16} className="mt-0.5 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="font-medium">{m.title}</p>
        <p className="opacity-80 mt-0.5">{m.body}</p>
      </div>
      {status !== "pending" && (
        <Button asChild size="sm" variant="outline" className="shrink-0">
          <Link to={to}>{status === "rejected" ? "Update KYC" : "Verify now"}</Link>
        </Button>
      )}
    </div>
  );
}
