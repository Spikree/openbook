import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useSettingsStore } from "@/store/settingsStore";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  Bot,
  Accessibility,
  BookOpen,
  Heart,
  ExternalLink,
} from "lucide-react";

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsSheet({ open, onOpenChange }: SettingsDialogProps) {
  const {
    ollamaUrl,
    ollamaModel,
    dyslexiaFont,
    fontSize,
    lineHeight,
    highContrast,
    readingRuler,
    setOllamaUrl,
    setOllamaModel,
    toggleDyslexiaFont,
    setFontSize,
    setLineHeight,
    toggleHighContrast,
    toggleReadingRuler,
  } = useSettingsStore();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>

        <div className="space-y-8 pb-4">
          {/* AI Configuration */}
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <Bot className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-semibold text-foreground">
                AI Configuration
              </h2>
            </div>
            <Separator />
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">
                  Ollama URL
                </label>
                <input
                  type="text"
                  value={ollamaUrl}
                  onChange={(e) => setOllamaUrl(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-md border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <p className="text-xs text-muted-foreground">
                  The URL where your Ollama instance is running
                </p>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">
                  Model
                </label>
                <input
                  type="text"
                  value={ollamaModel}
                  onChange={(e) => setOllamaModel(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-md border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <p className="text-xs text-muted-foreground">
                  e.g. llama3.2, gemma4:e2b, mistral
                </p>
              </div>
            </div>
          </section>

          {/* Accessibility */}
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <Accessibility className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-semibold text-foreground">
                Accessibility
              </h2>
            </div>
            <Separator />
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Dyslexia-friendly font
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Uses OpenDyslexic font
                  </p>
                </div>
                <button
                  onClick={toggleDyslexiaFont}
                  className={`relative w-10 h-5 rounded-full transition-colors ${dyslexiaFont ? "bg-primary" : "bg-muted"}`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${dyslexiaFont ? "translate-x-5" : "translate-x-0"}`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    High contrast mode
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Increases contrast for readability
                  </p>
                </div>
                <button
                  onClick={toggleHighContrast}
                  className={`relative w-10 h-5 rounded-full transition-colors ${highContrast ? "bg-primary" : "bg-muted"}`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${highContrast ? "translate-x-5" : "translate-x-0"}`}
                  />
                </button>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-foreground">
                    Font size
                  </p>
                  <span className="text-xs text-muted-foreground">
                    {fontSize}px
                  </span>
                </div>
                <input
                  type="range"
                  min={12}
                  max={24}
                  value={fontSize}
                  onChange={(e) => setFontSize(Number(e.target.value))}
                  className="w-full accent-primary"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>12px</span>
                  <span>24px</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-foreground">
                    Line height
                  </p>
                  <span className="text-xs text-muted-foreground">
                    {lineHeight}
                  </span>
                </div>
                <input
                  type="range"
                  min={1.2}
                  max={2.4}
                  step={0.1}
                  value={lineHeight}
                  onChange={(e) => setLineHeight(Number(e.target.value))}
                  className="w-full accent-primary"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Compact</span>
                  <span>Spacious</span>
                </div>
              </div>
            </div>
          </section>

          {/* Reading Ruler */}
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-semibold text-foreground">
                Reading Ruler
              </h2>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">
                  Enable reading ruler
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Highlights the current line
                </p>
              </div>
              <button
                onClick={toggleReadingRuler}
                className={`relative w-10 h-5 rounded-full transition-colors ${readingRuler ? "bg-primary" : "bg-muted"}`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${readingRuler ? "translate-x-5" : "translate-x-0"}`}
                />
              </button>
            </div>
          </section>

          {/* Support */}
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <Heart className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-semibold text-foreground">
                Support the Developer
              </h2>
            </div>
            <Separator />
            <div className="rounded-lg border border-border bg-card p-4 space-y-4 text-center">
              <p className="text-sm text-muted-foreground leading-relaxed">
                OpenBook is free and open source. If it helps you, consider
                supporting its development.
              </p>
              <div className="flex justify-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => window.open("https://github.com", "_blank")}
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Star on GitHub
                </Button>
                <Button
                  size="sm"
                  className="gap-2"
                  onClick={() => window.open("https://ko-fi.com", "_blank")}
                >
                  <Heart className="w-3.5 h-3.5" />
                  Buy me a coffee
                </Button>
              </div>
            </div>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
