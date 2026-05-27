import { useEffect } from "react";
import { useSettingsStore } from "@/store/settingsStore";

export function useApplySettings() {
  const { dyslexiaFont, fontSize, lineHeight, highContrast, readingRuler } =
    useSettingsStore();

  useEffect(() => {
    const root = document.documentElement;

    root.style.fontSize = `${fontSize}px`;

    if (dyslexiaFont) {
      root.classList.add("dyslexia-mode");
    } else {
      root.classList.remove("dyslexia-mode");
    }

    if (highContrast) {
      root.classList.add("high-contrast");
    } else {
      root.classList.remove("high-contrast");
    }

    document.body.style.setProperty(
      "line-height",
      `${lineHeight}`,
      "important",
    );
  }, [dyslexiaFont, fontSize, lineHeight, highContrast]);

  return { readingRuler };
}
