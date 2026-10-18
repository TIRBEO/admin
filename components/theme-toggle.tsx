"use client";

import { useEffect, useState } from "react";
import { Laptop, Moon, Sun } from "lucide-react";

import { applyTheme, onSystemThemeChange, readTheme, type ThemeId } from "@/lib/theme";

const ORDER: ThemeId[] = ["system", "dark", "light"];
const ICON = { system: Laptop, dark: Moon, light: Sun };
const LABEL = { system: "Auto", dark: "Dark", light: "Light" };

/* Segmented control in the iOS settings voice: a tinted track with the
   active segment lifted on a white plate. Cycles Auto → Dark → Light. */
export function ThemeToggle() {
  const [theme, setTheme] = useState<ThemeId>("system");

  useEffect(() => {
    const current = readTheme();
    setTheme(current);
    applyTheme(current);
    return onSystemThemeChange(() => {
      if (readTheme() === "system") applyTheme("system");
    });
  }, []);

  function cycle() {
    const next = ORDER[(ORDER.indexOf(theme) + 1) % ORDER.length];
    setTheme(next);
    applyTheme(next);
  }

  const Icon = ICON[theme];

  return (
    <button
      type="button"
      onClick={cycle}
      aria-label={`Theme: ${LABEL[theme]}. Click to change.`}
      title={`Theme: ${LABEL[theme]}`}
      className="inline-flex items-center gap-1.5 rounded-full border border-[var(--tb-border)] bg-[var(--tb-surface-1)]/60 py-1 pl-2.5 pr-3 text-[13px] font-medium text-[var(--tb-text-secondary)] transition-colors hover:bg-[var(--tb-surface-2)]"
    >
      <Icon size={14} aria-hidden className="text-[var(--tb-text-muted)]" />
      <span className="hidden sm:inline">{LABEL[theme]}</span>
    </button>
  );
}
