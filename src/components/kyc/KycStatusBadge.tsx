import { CheckCircle2, Clock, XCircle, ShieldAlert } from "lucide-react";
import type { KycStatus } from "@/hooks/useKyc";

const config: Record<
  KycStatus,
  { label: string; icon: typeof CheckCircle2; className: string }
> = {
  approved: {
    label: "KYC Verified",
    icon: CheckCircle2,
    className: "bg-green-500/10 text-green-400 border-green-500/30",
  },
  pending: {
    label: "KYC Pending Review",
    icon: Clock,
    className: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30",
  },
  rejected: {
    label: "KYC Rejected",
    icon: XCircle,
    className: "bg-destructive/10 text-destructive border-destructive/30",
  },
  not_submitted: {
    label: "KYC Required",
    icon: ShieldAlert,
    className: "bg-muted text-muted-foreground border-border",
  },
};

interface Props {
  status: KycStatus;
  size?: "sm" | "md";
}

export default function KycStatusBadge({ status, size = "sm" }: Props) {
  const c = config[status];
  const Icon = c.icon;
  const text = size === "md" ? "text-sm px-3 py-1" : "text-xs px-2 py-0.5";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border ${c.className} ${text} font-medium`}
    >
      <Icon size={size === "md" ? 14 : 12} /> {c.label}
    </span>
  );
}
