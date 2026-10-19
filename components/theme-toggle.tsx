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
      className="btn btn-secondary btn-sm"
    >
      <Icon size={14} aria-hidden />
      <span className="hidden sm:inline">{LABEL[theme]}</span>
    </button>
  );
}
