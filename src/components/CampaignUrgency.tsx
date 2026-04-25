import { differenceInDays, differenceInHours, formatDistanceToNowStrict } from "date-fns";
import { Clock, AlertTriangle } from "lucide-react";

interface Props {
  endDate: string | null | undefined;
  size?: "sm" | "md";
}

export default function CampaignUrgency({ endDate, size = "sm" }: Props) {
  if (!endDate) return null;

  const now = new Date();
  const end = new Date(endDate);
  if (Number.isNaN(end.getTime())) return null;

  const hoursLeft = differenceInHours(end, now);
  if (hoursLeft <= 0) {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
        <Clock size={10} /> Closed
      </span>
    );
  }

  const daysLeft = differenceInDays(end, now);
  const urgent = daysLeft <= 3;
  const Icon = urgent ? AlertTriangle : Clock;
  const cls = urgent
    ? "text-destructive bg-destructive/10"
    : daysLeft <= 14
      ? "text-yellow-400 bg-yellow-500/10"
      : "text-muted-foreground bg-secondary";

  const px = size === "sm" ? 10 : 12;
  const txtSize = size === "sm" ? "text-[10px]" : "text-xs";

  return (
    <span className={`inline-flex items-center gap-1 font-medium px-2 py-0.5 rounded-full ${cls} ${txtSize}`}>
      <Icon size={px} />
      {formatDistanceToNowStrict(end)} left
    </span>
  );
}
