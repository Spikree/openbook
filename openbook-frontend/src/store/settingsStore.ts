import { create } from "zustand";
import { persist } from "zustand/middleware";

// Provider IDs, added a custom provider at the end
export type ProviderId = "ollama" | "claude" | "codex" | `custom:${string}`;

// Interface for settings store
interface SettingsStore {
  // MODEL SELECTION
  // for selecting model provider
  provider: ProviderId;
  // remember models choosen by the provider, so when we switch providers we remember which model was
  // used before
  modelByProvider: Partial<Record<ProviderId, string>>;
  /** keyed `${provider}:${model}`; unset = the model's own default */
  effortByModel: Record<string, string>;
  // The models can use the file library as well as the internet (only with supported models)
  allowWeb: boolean;

  // ── ollama ──
  ollamaUrl: string;
  selectedModelCapabilities: string[];

  // ── read aloud ──
  // Read aloud models, kokoro is a opensource text to speech model and system is the OS speech model
  ttsEngine: "kokoro" | "system";
  ttsVoice: string;
  // 1 = normal, applies to both engines
  ttsSpeed: number;

  // ── accessibility ──
  dyslexiaFont: boolean;
  fontSize: number;
  lineHeight: number;
  highContrast: boolean;
  readingRuler: boolean;

  setProvider: (provider: ProviderId) => void;
  setModel: (provider: ProviderId, model: string) => void;
  setEffort: (provider: ProviderId, model: string, effort: string | null) => void;
  setAllowWeb: (allow: boolean) => void;
  setTtsEngine: (engine: "kokoro" | "system") => void;
  setTtsVoice: (voice: string) => void;
  setTtsSpeed: (speed: number) => void;
  setOllamaUrl: (url: string) => void;
  setSelectedModelCapabilities: (caps: string[]) => void;
  toggleDyslexiaFont: () => void;
  setFontSize: (size: number) => void;
  setLineHeight: (height: number) => void;
  toggleHighContrast: () => void;
  toggleReadingRuler: () => void;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      provider: "claude",
      modelByProvider: { claude: "claude-sonnet-5" },
      effortByModel: {},
      // library-only by default, nothing leaves for the open web unasked
      allowWeb: false,

      ollamaUrl: "http://localhost:11434",
      ollamaModel: "",
      selectedModelCapabilities: [],

      ttsEngine: "kokoro",
      ttsVoice: "af_heart",
      // a little slower than normal
      ttsSpeed: 0.9,

      dyslexiaFont: false,
      fontSize: 16,
      lineHeight: 1.6,
      highContrast: false,
      readingRuler: false,

      // This sets the provider,
      setProvider: (provider) => set({ provider }),
      setModel: (provider, model) =>
        set((s) => ({
          modelByProvider: { ...s.modelByProvider, [provider]: model }
        })),
      setEffort: (provider, model, effort) =>
        set((s) => {
          const key = `${provider}:${model}`;
          const next = { ...s.effortByModel };
          if (effort) next[key] = effort;
          else delete next[key];
          return { effortByModel: next };
        }),
      setAllowWeb: (allow) => set({ allowWeb: allow }),
      setTtsEngine: (engine) => set({ ttsEngine: engine }),
      setTtsVoice: (voice) => set({ ttsVoice: voice }),
      setTtsSpeed: (speed) => set({ ttsSpeed: speed }),
      setOllamaUrl: (url) => set({ ollamaUrl: url }),

      setSelectedModelCapabilities: (caps) =>
        set({ selectedModelCapabilities: caps }),

      toggleDyslexiaFont: () => set((s) => ({ dyslexiaFont: !s.dyslexiaFont })),
      setFontSize: (size) => set({ fontSize: size }),
      setLineHeight: (height) => set({ lineHeight: height }),
      toggleHighContrast: () => set((s) => ({ highContrast: !s.highContrast })),
      toggleReadingRuler: () => set((s) => ({ readingRuler: !s.readingRuler })),
    }),
    {
      name: "openbook-settings",
      version: 0,
    },
  ),
);

/** The model currently in effect for the selected provider. */
export const useActiveModel = () =>
  useSettingsStore((s) => s.modelByProvider[s.provider] ?? "");
