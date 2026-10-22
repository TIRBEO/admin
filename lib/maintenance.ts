import { apiFailure, apiGet } from "@/lib/api";
import type { Load } from "@/lib/load-state";

/* The maintenance window, as the platform currently holds it.

   GET /admin/maintenance answers the whole state in one object: whether the
   platform is closed, the message a visitor sees, when it is expected to end,
   who is allowed through anyway, and any schedule set for later.

   Writes are a separate story, and it is not a good one. PUT and DELETE both
   call `requireRole(request, "super_admin")`, but the role resolver maps the
   schema's single boolean `isAdmin` onto the string "admin" (level 3) and has
   no way to produce "super_admin" (level 4). Every admin write to this endpoint
   is therefore refused with 403. This reader exposes that as `canWrite: false`
   so the screen says it plainly instead of rendering a form that cannot save. */

type MaintenanceRaw = {
  enabled: boolean;
  message: string;
  estimatedEnd: number | null;
  allowedUsers: string[];
  startTime: number | null;
  scheduledStart: number | null;
  scheduledEnd: number | null;
};

export type MaintenanceView = MaintenanceRaw & {
  canWrite: false;
};

export async function readMaintenance(): Promise<Load<MaintenanceView>> {
  const result = await apiGet<MaintenanceRaw>("/admin/maintenance");
  if (!result.ok || !result.data) return apiFailure(result);

  const state = result.data;
  return {
    status: "ready",
    data: {
      enabled: state.enabled,
      message: state.message ?? "",
      estimatedEnd: state.estimatedEnd ?? null,
      allowedUsers: Array.isArray(state.allowedUsers) ? state.allowedUsers : [],
      startTime: state.startTime ?? null,
      scheduledStart: state.scheduledStart ?? null,
      scheduledEnd: state.scheduledEnd ?? null,
      canWrite: false,
    },
  };
}
