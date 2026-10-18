"use client";

import { useEffect, useState } from "react";
import { Laptop, Moon, Sun } from "lucide-react";

import { applyTheme, onSystemThemeChange, readTheme, type ThemeId } from "@/lib/theme";

const ORDER: ThemeId[] = ["system", "dark", "light"];
const ICON = { system: Laptop, dark: Moon, light: Sun };
const LABEL = { system: "Auto", dark: "Dark", light: "Light" };

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
      className="inline-flex size-8 items-center justify-center rounded-lg text-[var(--tb-text-muted)] transition-colors hover:bg-[var(--tb-surface-2)] hover:text-[var(--tb-text-primary)]"
    >
      <Icon size={15} aria-hidden />
    </button>
  );
}
