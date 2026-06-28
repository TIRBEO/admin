import type { AdminRole } from "../../lib/roles";
import { ROLE_LABELS, ROLE_COLORS, ROLE_ICONS } from "../../lib/roles";

const colorClasses: Record<string, string> = {
  amber: "bg-amber-50 text-amber-700 border-amber-200",
  red: "bg-red-50 text-red-700 border-red-200",
  blue: "bg-blue-50 text-blue-700 border-blue-200",
  green: "bg-green-50 text-green-700 border-green-200",
  neutral: "bg-gray-50 text-gray-600 border-gray-200",
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
