import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SettingsStore {
  ollamaUrl: string;
  ollamaModel: string;
  dyslexiaFont: boolean;
  fontSize: number;
  lineHeight: number;
  highContrast: boolean;
  readingRuler: boolean;

  setOllamaUrl: (url: string) => void;
  setOllamaModel: (model: string) => void;
  toggleDyslexiaFont: () => void;
  setFontSize: (size: number) => void;
  setLineHeight: (height: number) => void;
  toggleHighContrast: () => void;
  toggleReadingRuler: () => void;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      ollamaUrl: "http://localhost:11434",
      ollamaModel: "gemma4:e2b",
      dyslexiaFont: false,
      fontSize: 16,
      lineHeight: 1.6,
      highContrast: false,
      readingRuler: false,

      setOllamaUrl: (url) => set({ ollamaUrl: url }),
      setOllamaModel: (model) => set({ ollamaModel: model }),
      toggleDyslexiaFont: () => set((s) => ({ dyslexiaFont: !s.dyslexiaFont })),
      setFontSize: (size) => set({ fontSize: size }),
      setLineHeight: (height) => set({ lineHeight: height }),
      toggleHighContrast: () => set((s) => ({ highContrast: !s.highContrast })),
      toggleReadingRuler: () => set((s) => ({ readingRuler: !s.readingRuler })),
    }),
    { name: "openbook-settings" },
  ),
);
