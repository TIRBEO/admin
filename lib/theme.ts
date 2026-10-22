"use client";

/* KEEP IN SYNC with docs/design/theme.ts.template (repo root), plus the
   one-off migration from the old "tb-theme" key this app shipped with. */

export type ThemeId = "system" | "dark" | "light";

export const THEME_KEY = "tirbeo:theme";
const LEGACY_KEY = "tb-theme";

export const DEFAULT_THEME: ThemeId = "system";

export function isThemeId(v: unknown): v is ThemeId {
  return typeof v === "string" && ["system", "dark", "light"].includes(v);
}

export function readTheme(): ThemeId {
  if (typeof window === "undefined") return DEFAULT_THEME;
  try {
    const saved = window.localStorage.getItem(THEME_KEY) ?? window.localStorage.getItem(LEGACY_KEY);
    return isThemeId(saved) ? saved : DEFAULT_THEME;
  } catch {
    return DEFAULT_THEME;
  }
}

/** `system` follows the device and falls back to light when unavailable. */
export function resolveTheme(id: ThemeId): "dark" | "light" {
  if (id !== "system") return id;
  return typeof window !== "undefined" && window.matchMedia?.("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export function applyTheme(id: ThemeId) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const concrete = resolveTheme(id);
  root.setAttribute("data-theme", concrete);
  root.style.colorScheme = concrete;
  try {
    window.localStorage.setItem(THEME_KEY, id);
    window.localStorage.removeItem(LEGACY_KEY);
  } catch {
    /* private mode — palette still applies for this session */
  }
}

/** A "system" choice tracks the device; the other two never move. */
export function onSystemThemeChange(onChange: () => void) {
  if (typeof window === "undefined" || !window.matchMedia) return () => {};
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  const handler = () => {
    if (readTheme() === "system") onChange();
  };
  mq.addEventListener("change", handler);
  return () => mq.removeEventListener("change", handler);
}

/** Inlined in <head> so the palette is correct on the very first paint.
    Also carries any legacy tb-theme choice forward. */
export const THEME_BOOT = `(function(){try{var k="tirbeo:theme";var v=localStorage.getItem(k);if(!v){v=localStorage.getItem("tb-theme");if(v)localStorage.setItem(k,v);}var t=(v==="dark"||v==="light"||v==="system")?v:"system";var a=t==="dark"||(t==="system"&&window.matchMedia&&matchMedia("(prefers-color-scheme: dark)").matches)?"dark":"light";document.documentElement.setAttribute("data-theme",a);document.documentElement.style.colorScheme=a;}catch(e){}})();`;
