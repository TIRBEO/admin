import type { AdminRole } from "../../lib/roles";
import { ROLE_LABELS, ROLE_COLORS, ROLE_ICONS } from "../../lib/roles";

const colorClasses: Record<string, string> = {
  amber: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  red: "bg-red-500/20 text-red-400 border-red-500/30",
  blue: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  green: "bg-green-500/20 text-green-400 border-green-500/30",
  neutral: "bg-neutral-500/20 text-neutral-400 border-neutral-500/30",
};

export function RoleBadge({ role, size = "md", showIcon = true, showLabel = true }: {
  role: AdminRole;
  size?: "sm" | "md" | "lg";
  showIcon?: boolean;
  showLabel?: boolean;
}) {
  const sizes = { sm: "px-2 py-0.5 text-xs", md: "px-3 py-1 text-sm", lg: "px-4 py-1.5 text-base" };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border font-medium ${sizes[size]} ${colorClasses[ROLE_COLORS[role]] || "text-neutral-500"}`}>
      {showIcon && <span>{ROLE_ICONS[role]}</span>}
      {showLabel && <span>{ROLE_LABELS[role]}</span>}
    </span>
  );
}
