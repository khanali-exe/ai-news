import { ShieldCheck, Shield, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import type { VerificationStatus } from "@/types";

const CONFIG: Record<VerificationStatus, {
  label: string;
  icon: React.ElementType;
  className: string;
}> = {
  verified: {
    label: "Verified",
    icon: ShieldCheck,
    className: "text-emerald-400 bg-emerald-500/10 border-emerald-500/25",
  },
  confirmed: {
    label: "Confirmed",
    icon: Shield,
    className: "text-sky-400 bg-sky-500/10 border-sky-500/25",
  },
  unverified: {
    label: "Unverified",
    icon: ShieldAlert,
    className: "text-zinc-500 bg-zinc-500/10 border-zinc-500/25",
  },
};

export function FactCheckBadge({
  status,
  showLabel = true,
}: {
  status: VerificationStatus;
  showLabel?: boolean;
}) {
  const config = CONFIG[status] ?? CONFIG.unverified;
  const Icon = config.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium",
        config.className
      )}
      title={config.label}
    >
      <Icon className="h-3 w-3 shrink-0" />
      {showLabel && <span>{config.label}</span>}
    </span>
  );
}
