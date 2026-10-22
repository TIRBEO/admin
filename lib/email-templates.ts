import { apiFailure, apiGet, apiSend, errorMessage } from "@/lib/api";
import type { Load } from "@/lib/load-state";

import type { EmailTemplate } from "@/lib/types";

/** The Templates screen's read: GET /api/admin/email/templates.
 *
 *  This door answers with a bare array, not an object — the whole registry in
 *  one shot, each row carrying its own `html`. That is why the screen needs
 *  exactly one read: the body an operator wants to open is already in the list
 *  the page loaded, so selecting a template never costs a request.
 *
 *  `variables` is a loose JSON column, so a template might declare its slots
 *  as strings, as `{name}` objects, or not at all and simply use `{{slot}}` in
 *  the body. Both are read here — the declared list and the slots the body
 *  actually contains — because "what this mail fills in" is the question an
 *  operator is really asking, and the declared list alone can be stale. */

type ApiRow = {
  id: string;
  slug: string;
  label: string | null;
  subject: string;
  html: string;
  variables: unknown;
  createdAt: string;
  updatedAt: string;
};

export async function readTemplates(): Promise<Load<EmailTemplate[]>> {
  const result = await apiGet<ApiRow[]>("/admin/email/templates");

  if (!result.ok) return apiFailure(result);
  // A bare array is the contract; an object wrapper would mean the door changed
  // under us, and drawing the old screen's shape from a wrong payload is worse
  // than reporting the mismatch.
  if (!Array.isArray(result.data)) {
    return { status: "error", message: "The API answered with no template list in it." };
  }

  const templates = result.data.map(toTemplate);
  return templates.length === 0 ? { status: "empty" } : { status: "ready", data: templates };
}

function toTemplate(row: ApiRow): EmailTemplate {
  return {
    id: row.id,
    slug: row.slug,
    label: row.label ?? null,
    subject: row.subject ?? "",
    html: row.html ?? "",
    variables: normalizeVariables(row.variables),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function normalizeVariables(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v
    .map((item) => {
      if (typeof item === "string") return item;
      if (item && typeof item === "object") {
        const o = item as Record<string, unknown>;
        const name = o.name ?? o.key ?? o.variable;
        if (typeof name === "string") return name;
      }
      return null;
    })
    .filter((x): x is string => !!x);
}

/** The `{{slot}}` names a body actually uses. A template can declare a
 *  variable it no longer references, or reference one it forgot to declare, so
 *  this is read straight off the text rather than trusted to the list. */
export function slotsIn(...sources: string[]): string[] {
  const found = new Set<string>();
  for (const source of sources) {
    for (const match of source.matchAll(/\{\{\s*([\w.]+)\s*\}\}/g)) {
      found.add(match[1]);
    }
  }
  return [...found].sort();
}

export type WriteResult = { ok: true } | { ok: false; message: string };

/** Save a template's subject and body: PUT /api/admin/email/templates/[id].
 *
 *  The door names the body `htmlBody` on the way in and stores it as `html`,
 *  so the edit keys here match the door's request shape, not the row's. Only
 *  those two columns are sent — a partial PUT leaves `slug` and `variables`
 *  exactly as the registry holds them. */
export async function editTemplate(input: {
  id: string;
  subject: string;
  htmlBody: string;
}): Promise<WriteResult> {
  const result = await apiSend<EmailTemplate>(
    `/admin/email/templates/${encodeURIComponent(input.id)}`,
    {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ subject: input.subject, htmlBody: input.htmlBody }),
    },
  );
  return result.ok ? { ok: true } : { ok: false, message: errorMessage(result) };
}

