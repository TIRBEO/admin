import type { AdminRole } from "../../lib/roles";
import { ROLE_LABELS, ROLE_COLORS, ROLE_ICONS } from "../../lib/roles";

const colorClasses: Record<string, string> = {
  amber: "bg-amber-500/10 text-amber-400 border-amber-800",
  red: "bg-red-500/10 text-red-400 border-red-800",
  blue: "bg-blue-500/10 text-blue-400 border-blue-800",
  green: "bg-green-500/10 text-green-400 border-green-800",
  neutral: "bg-neutral-800 text-neutral-300 border-neutral-700",
};

export function RoleBadge({ role, size = "md", showIcon = true, showLabel = true }: {
  role: AdminRole;
  size?: "sm" | "md" | "lg";
  showIcon?: boolean;
  showLabel?: boolean;
}) {
  const sizes = { sm: "px-2 py-0.5 text-xs", md: "px-3 py-1 text-sm", lg: "px-4 py-1.5 text-base" };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border font-medium ${sizes[size]} ${colorClasses[ROLE_COLORS[role]] || "text-gray-500 bg-gray-50"}`}>
      {showIcon && <span>{ROLE_ICONS[role]}</span>}
      {showLabel && <span>{ROLE_LABELS[role]}</span>}
    </span>
  );
}
