import { useSyncExternalStore } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";

// Three theme modes
export type ThemeMode = "light" | "dark" | "system";

// Set of themes
export const THEMES = [
  {
    id: "default",
    label: "Default",
    // background, card, primary, muted — generated with the CSS palettes
    swatches: {
      light: ["0 0% 100%", "0 0% 100%", "245 58% 51%", "220 14% 94%"],
      dark: ["224 25% 10%", "224 22% 13%", "245 58% 68%", "224 18% 18%"],
    },
  },
  {
    id: "rose",
    label: "Rose",
    // background, card, primary, muted — generated with the CSS palettes
    swatches: {
      light: ["336 30% 99%", "0 0% 100%", "336 72% 49%", "336 30% 95%"],
      dark: ["336 25% 10%", "336 22% 13%", "336 72% 62%", "336 18% 18%"],
    },
  },
  {
    id: "ocean",
    label: "Ocean",
    // background, card, primary, muted — generated with the CSS palettes
    swatches: {
      light: ["205 35% 99%", "0 0% 100%", "205 80% 41%", "205 35% 95%"],
      dark: ["205 30% 10%", "205 27% 13%", "205 80% 62%", "205 23% 18%"],
    },
  },
  {
    id: "iris",
    label: "Iris",
    // background, card, primary, muted — generated with the CSS palettes
    swatches: {
      light: ["262 30% 99%", "0 0% 100%", "262 62% 51%", "262 30% 95%"],
      dark: ["262 25% 10%", "262 22% 13%", "262 62% 66%", "262 18% 18%"],
    },
  },
  {
    id: "grove",
    label: "Grove",
    // background, card, primary, muted — generated with the CSS palettes
    swatches: {
      light: ["152 22% 99%", "0 0% 100%", "152 55% 33%", "152 22% 95%"],
      dark: ["152 19% 10%", "152 16% 13%", "152 55% 62%", "152 12% 18%"],
    },
  },
  {
    id: "ember",
    label: "Ember",
    // background, card, primary, muted — generated with the CSS palettes
    swatches: {
      light: ["20 35% 99%", "0 0% 100%", "20 80% 42%", "20 35% 95%"],
      dark: ["20 30% 10%", "20 27% 13%", "20 80% 62%", "20 23% 18%"],
    },
  },
] as const;

// ThemeId : one of the ids from the above themes
export type ThemeId = (typeof THEMES)[number]["id"];

// Interface for the theme store
interface ThemeStore {
  mode: ThemeMode;
  themeId: ThemeId;
  setMode: (mode: ThemeMode) => void;
  setThemeId: (id: ThemeId) => void;
}

// check if the theme in the local storage is light or dark if its null we handle the "system" theme in
// the theme store
const legacyMode = (): ThemeMode | null => {
  const v = typeof localStorage !== "undefined" ? localStorage.getItem("theme") : null;
  return v === "light" || v === "dark" ? v : null;
};

// Theme Store
export const useThemeStore = create<ThemeStore>()(
  persist(
    (set) => ({
      // if the theme isnt dark or light, its system
      mode: legacyMode() ?? "system",
      themeId: "default",
      setMode: (mode) => set({ mode }),
      setThemeId: (themeId) => set({ themeId }),
    }),

    // index.html reads this key before first paint — keep the shape in sync
    {
      name: "openbook-theme", version: 1,
      // the legacy "theme" key has been read into the store by now, so delete it
      onRehydrateStorage: () => () => {
        try { localStorage.removeItem("theme"); } catch {
          // empty log
          console.log();
        }
      },
    },
  ),
);

// we see if the window is present and if it is we see the systems/browsers set theme colour
export const prefersDark = () : boolean =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-color-scheme: dark)").matches;
// .matches is true if the users system/browser is set to dark

// true if the user picked dark, or picked system and the OS is dark
// false means the UI should be light.
export const resolveDark = (mode: ThemeMode) : boolean =>
  mode === "dark" || (mode === "system" && prefersDark());

// listen for the OS/browser switching light <-> dark and call onChange when it does.
// returns a cleanup function that removes the listener.
const subscribeToScheme = (onChange: () => void) => {
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
};

// we use the hook "useSyncExternalStore" to see if anything has changed on the os and browser level and
// if it has we pass in the "subscribeToScheme" and "prefersDark" to set the theme according to the change
// and we return false just in case if the code is not running on client side ( during server rendering)
export function useResolvedDark(): boolean {
  const mode = useThemeStore((s) => s.mode);
  const systemDark = useSyncExternalStore(subscribeToScheme, prefersDark, () => false);
  return mode === "dark" || (mode === "system" && systemDark);
}
