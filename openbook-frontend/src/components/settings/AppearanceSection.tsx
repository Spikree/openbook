import { Check, Monitor, Moon, Palette, Sun } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import {
  THEMES,
  useResolvedDark,
  useThemeStore,
  type ThemeMode,
} from "@/store/themeStore";
import { cn } from "@/lib/utils";

const MODES: { id: ThemeMode; label: string; Icon: typeof Sun }[] = [
  { id: "light", label: "Light", Icon: Sun },
  { id: "dark", label: "Dark", Icon: Moon },
  { id: "system", label: "System", Icon: Monitor },
];

const hsl = (v: string) => `hsl(${v})`;

export function AppearanceSection() {
  // use {mode, themeId, setMode, setThemeId, isDark} from themeStore.ts
  // used selector method instead of no selectors for no unnecessary rerenders
  const mode = useThemeStore((s) => s.mode);
  const themeId = useThemeStore((s) => s.themeId);
  const setMode = useThemeStore((s) => s.setMode);
  const setThemeId = useThemeStore((s) => s.setThemeId);
  const isDark = useResolvedDark();

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <Palette className="w-4 h-4 text-primary" />
        <h2 className="text-sm font-semibold text-foreground">Appearance</h2>
      </div>
      <Separator />

      <div className="space-y-2">
        <p className="text-xs font-medium text-foreground">Mode</p>
        <div
          role="radiogroup"
          aria-label="Colour mode"
          className="inline-flex rounded-lg border border-border p-0.5 bg-muted/50"
        >
          {MODES.map(({ id, label, Icon }) => (
            <button
              key={id}
              role="radio"
              aria-checked={mode === id}
              onClick={() => setMode(id)}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs transition-colors",
                mode === id
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>
        {mode === "system" && (
          <p className="text-[11px] text-muted-foreground">
            Follows your computer — currently {isDark ? "dark" : "light"}.
          </p>
        )}
      </div>

      <div className="space-y-2">
        <p className="text-xs font-medium text-foreground">Theme</p>
        <div role="radiogroup" aria-label="Theme" className="grid grid-cols-3 gap-2">
          {THEMES.map((t) => {
            const [bg, card, primary, muted] = isDark
              ? t.swatches.dark
              : t.swatches.light;
            const selected = themeId === t.id;
            return (
              <button
                key={t.id}
                role="radio"
                aria-checked={selected}
                onClick={() => setThemeId(t.id)}
                className={cn(
                  "rounded-lg border p-1.5 text-left transition-colors",
                  selected
                    ? "border-primary ring-2 ring-primary/30"
                    : "border-border hover:border-muted-foreground/40",
                )}
              >
                {/* a miniature of the app in this theme */}
                <div
                  className="h-14 rounded-md border overflow-hidden flex"
                  style={{ background: hsl(bg), borderColor: hsl(muted) }}
                >
                  <div className="w-1/3 h-full" style={{ background: hsl(card) }} />
                  <div className="flex-1 p-1.5 flex flex-col gap-1">
                    <div className="h-1.5 w-3/4 rounded-full" style={{ background: hsl(muted) }} />
                    <div className="h-1.5 w-1/2 rounded-full" style={{ background: hsl(muted) }} />
                    <div
                      className="mt-auto h-2.5 w-1/2 rounded-full self-end"
                      style={{ background: hsl(primary) }}
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between px-0.5 pt-1.5">
                  <span className="text-xs text-foreground">{t.label}</span>
                  {selected && <Check className="w-3.5 h-3.5 text-primary" />}
                </div>
              </button>
            );
          })}
        </div>
        <p className="text-[11px] text-muted-foreground">
          High contrast
          mode (below) overrides the theme.
        </p>
      </div>
    </section>
  );
}
