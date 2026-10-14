import { useEffect } from "react";
import { resolveDark, useThemeStore } from "@/store/themeStore";
import { useSettingsStore } from "@/store/settingsStore";

/** "H S% L%" (a CSS custom property) → "#rrggbb". */
function hslVarToHex(value: string): string | null {
  const m = value.trim().match(/^([\d.]+)\s+([\d.]+)%\s+([\d.]+)%$/);
  if (!m) return null;
  const h = Number(m[1]) / 360;
  const s = Number(m[2]) / 100;
  const l = Number(m[3]) / 100;
  const hue = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  let r = l, g = l, b = l;
  if (s !== 0) {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue(p, q, h + 1 / 3);
    g = hue(p, q, h);
    b = hue(p, q, h - 1 / 3);
  }
  const to = (x: number) => Math.round(x * 255).toString(16).padStart(2, "0");
  return `#${to(r)}${to(g)}${to(b)}`;
}

/**
 * Applies the theme to <html> and keeps the native window in step: the
 * Windows/Linux window buttons and Electron's native theme (dialogs, the
 * folder picker, scrollbars) cannot be styled by CSS.
 */
export function useApplyTheme() {
  const mode = useThemeStore((s) => s.mode);
  const themeId = useThemeStore((s) => s.themeId);
  // high contrast changes the navbar colour, so the window buttons must follow
  const highContrast = useSettingsStore((s) => s.highContrast);

  useEffect(() => {
    const root = document.documentElement;

    const apply = () => {
      root.classList.toggle("dark", resolveDark(mode));
      root.classList.remove("light"); // left behind by the old toggle
      if (themeId === "default") root.removeAttribute("data-theme-id");
      else root.setAttribute("data-theme-id", themeId);

      const css = getComputedStyle(root);
      const color = hslVarToHex(css.getPropertyValue("--card"));
      const symbolColor = hslVarToHex(css.getPropertyValue("--foreground"));
      if (color && symbolColor) {
        window.openbook?.setAppearance?.({ color, symbolColor, mode });
      }
    };

    apply();

    // in System mode, follow the OS as it changes (e.g. sunset auto-dark)
    if (mode !== "system") return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, [mode, themeId, highContrast]);
}
