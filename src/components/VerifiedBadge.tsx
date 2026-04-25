import { BadgeCheck, AlertCircle } from "lucide-react";

interface Props {
  verified: boolean;
  size?: "sm" | "md";
  showUnverified?: boolean;
}

export default function VerifiedBadge({ verified, size = "sm", showUnverified = false }: Props) {
  const px = size === "sm" ? 12 : 14;

  if (verified) {
    return (
      <span
        title="Verified business"
        className="inline-flex items-center gap-1 text-primary text-xs font-medium"
      >
        <BadgeCheck size={px} />
        Verified
      </span>
    );
  }
  if (!showUnverified) return null;
  return (
    <span
      title="This business has not yet been verified by ZamFund admins."
      className="inline-flex items-center gap-1 text-yellow-400 text-xs font-medium"
    >
      <AlertCircle size={px} />
      Unverified
    </span>
  );
}
