import { useEffect, useState } from "react";
import {
  Volume2,
  Download,
  Check,
  Loader2,
  Square,
  Play,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { api, type TtsStatus } from "@/api/client";
import { useSettingsStore } from "@/store/settingsStore";
import { useTTS } from "@/hooks/useTTS";
import { cn } from "@/lib/utils";
import { trackVoiceDownload } from "@/lib/voiceDownload";

const PREVIEW =
  "Hi! This is how your study assistant will sound when it reads an answer to you.";

export function ReadAloudSection({ open }: { open: boolean }) {
  const ttsEngine = useSettingsStore((s) => s.ttsEngine);
  const ttsVoice = useSettingsStore((s) => s.ttsVoice);
  const ttsSpeed = useSettingsStore((s) => s.ttsSpeed);
  const setTtsEngine = useSettingsStore((s) => s.setTtsEngine);
  const setTtsVoice = useSettingsStore((s) => s.setTtsVoice);
  const setTtsSpeed = useSettingsStore((s) => s.setTtsSpeed);
  const { speak, stop, isSpeaking } = useTTS();

  const [status, setStatus] = useState<TtsStatus | null>(null);
  // bumped to restart polling after a download is started
  const [pollKey, setPollKey] = useState(0);
  // delete takes two clicks; the first arms it for a few seconds
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!confirmDelete) return;
    const t = setTimeout(() => setConfirmDelete(false), 4000);
    return () => clearTimeout(t);
  }, [confirmDelete]);

  const remove = async () => {
    if (!confirmDelete) return setConfirmDelete(true);
    setConfirmDelete(false);
    setDeleting(true);
    stop();
    const freed = status?.diskBytes;
    try {
      setStatus(await api.ttsDelete());
      // otherwise the next Listen would quietly download it all again
      setTtsEngine("system");
      toast.success("Natural voice deleted", {
        description: `${freed ? `Freed ${Math.round(freed / 1_000_000)} MB. ` : ""}Read aloud now uses the system voice. You can download it again any time.`,
      });
    } catch (err) {
      toast.error("Could not delete the voice", {
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setDeleting(false);
    }
  };

  // poll while the dialog is open and a download is running
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    const tick = async () => {
      try {
        const s = await api.ttsStatus();
        if (cancelled) return;
        setStatus(s);
        if (s.state === "downloading") timer = setTimeout(tick, 1000);
      } catch {
        if (!cancelled) setStatus(null);
      }
    };
    tick();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [open, pollKey]);

  const download = async () => {
    try {
      setStatus(await api.ttsPrepare());
      setPollKey((k) => k + 1);
      trackVoiceDownload();
    } catch {
      /* status stays as it was; the button remains available */
    }
  };

  const state = status?.state;

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <Volume2 className="w-4 h-4 text-primary" />
        <h2 className="text-sm font-semibold text-foreground">Read aloud</h2>
      </div>
      <Separator />

      <div className="grid gap-2 sm:grid-cols-2">
        {(
          [
            {
              id: "kokoro",
              title: "Natural voice",
              body: "Kokoro, open source. Runs on this computer — your text never leaves it. One-time download of about 100 MB.",
            },
            {
              id: "system",
              title: "System voice",
              body: "Your computer's built-in voice. Works instantly, but sounds robotic.",
            },
          ] as const
        ).map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => setTtsEngine(opt.id)}
            aria-pressed={ttsEngine === opt.id}
            className={cn(
              "text-left rounded-lg border p-3 transition-colors",
              ttsEngine === opt.id
                ? "border-primary bg-primary/5"
                : "border-border hover:bg-muted/50",
            )}
          >
            <p className="text-sm font-medium text-foreground">{opt.title}</p>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              {opt.body}
            </p>
          </button>
        ))}
      </div>

      {ttsEngine === "kokoro" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2">
            <div className="text-xs text-muted-foreground min-w-0">
              {!status && "Checking the voice…"}
              {state === "ready" && (
                <span className="flex items-center gap-1.5 text-foreground">
                  <Check className="w-3.5 h-3.5 text-primary" /> Voice downloaded
                  {status?.diskBytes ? (
                    <span className="text-muted-foreground">
                      · {Math.round(status.diskBytes / 1_000_000)} MB
                    </span>
                  ) : null}
                </span>
              )}
              {state === "absent" &&
                "Not downloaded yet — until it is, the system voice is used."}
              {state === "downloading" && (
                <span className="flex items-center gap-1.5">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Downloading… {Math.round((status?.progress ?? 0) * 100)}%
                </span>
              )}
              {state === "error" && (
                <span>Download failed: {status?.error ?? "unknown error"}</span>
              )}
            </div>
            {state === "ready" && (
              <Button
                size="sm"
                variant="outline"
                className={cn(
                  "gap-2 shrink-0",
                  confirmDelete && "border-destructive text-destructive hover:text-destructive",
                )}
                onClick={remove}
                disabled={deleting}
              >
                {deleting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5" />
                )}
                {deleting ? "Deleting…" : confirmDelete ? "Click to confirm" : "Delete"}
              </Button>
            )}
            {(state === "absent" || state === "error") && (
              <Button size="sm" variant="outline" className="gap-2 shrink-0" onClick={download}>
                <Download className="w-3.5 h-3.5" />
                {state === "error" ? "Retry" : "Download"}
              </Button>
            )}
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">Voice</p>
            <select
              value={ttsVoice}
              onChange={(e) => setTtsVoice(e.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {(status?.voices ?? []).map((v) => (
                <option key={v.id} value={v.id}>
                  {v.label} — {v.accent}
                </option>
              ))}
              {/* keep the saved choice selectable before the list loads */}
              {!status && <option value={ttsVoice}>{ttsVoice}</option>}
            </select>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-foreground">Speed</p>
          <span className="text-xs text-muted-foreground">{ttsSpeed.toFixed(2)}×</span>
        </div>
        <input
          type="range"
          min={0.6}
          max={1.4}
          step={0.05}
          value={ttsSpeed}
          onChange={(e) => setTtsSpeed(Number(e.target.value))}
          className="w-full accent-primary"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Slower</span>
          <span>Faster</span>
        </div>
      </div>

      <Button
        variant="outline"
        size="sm"
        className="gap-2"
        onClick={() => (isSpeaking ? stop() : speak(PREVIEW))}
      >
        {isSpeaking ? <Square className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
        {isSpeaking ? "Stop" : "Preview"}
      </Button>
    </section>
  );
}
