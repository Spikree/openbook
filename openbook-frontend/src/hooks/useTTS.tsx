import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { api } from "@/api/client";
import { speakableText, speechChunks } from "@/lib/speech";
import { trackVoiceDownload } from "@/lib/voiceDownload";
import { useSettingsStore } from "@/store/settingsStore";

/** One read-aloud run; flipping `cancelled` stops it between steps. */
interface Run {
  cancelled: boolean;
  abort: AbortController;
  audio: HTMLAudioElement | null;
  /** resolves the in-flight wait so a stop never leaves a promise hanging */
  interrupt: (() => void) | null;
}

const SYSTEM_PREFERRED = [
  "Google UK English Female",
  "Google US English",
  "Samantha",
  "Karen",
  "Daniel",
  "Moira",
];

/** The operating system's voice — instant, always available, robotic. */
function speakWithSystem(text: string, speed: number, run: Run): Promise<void> {
  return new Promise((resolve) => {
    if (!window.speechSynthesis || run.cancelled) return resolve();
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    const best = SYSTEM_PREFERRED.map((n) => voices.find((v) => v.name === n)).find(
      Boolean,
    );
    if (best) utterance.voice = best;
    utterance.rate = speed;
    utterance.onend = () => resolve();
    utterance.onerror = () => resolve();
    run.interrupt = () => {
      window.speechSynthesis.cancel();
      resolve();
    };
    window.speechSynthesis.speak(utterance);
  });
}

function playBlob(blob: Blob, run: Run): Promise<void> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    run.audio = audio;
    const done = (err?: Error) => {
      URL.revokeObjectURL(url);
      run.audio = null;
      run.interrupt = null;
      if (err) reject(err);
      else resolve();
    };
    run.interrupt = () => {
      audio.pause();
      done();
    };
    audio.onended = () => done();
    audio.onerror = () => done(new Error("Could not play the audio"));
    audio.play().catch((err: Error) => done(err));
  });
}

/**
 * Read text aloud. Uses the local Kokoro voice when it is chosen and
 * downloaded, fetching one chunk ahead so there is no gap between sentences;
 * otherwise, or if Kokoro fails part-way, the system voice finishes the job.
 */
export function useTTS() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const runRef = useRef<Run | null>(null);

  const stop = useCallback(() => {
    const run = runRef.current;
    if (!run) return;
    run.cancelled = true;
    run.abort.abort();
    run.interrupt?.();
    window.speechSynthesis?.cancel();
    runRef.current = null;
    setIsSpeaking(false);
  }, []);

  // never keep talking after the component that started it is gone
  useEffect(() => stop, [stop]);

  const speak = useCallback(
    async (text: string, onEnd?: () => void) => {
      stop();
      const run: Run = {
        cancelled: false,
        abort: new AbortController(),
        audio: null,
        interrupt: null,
      };
      runRef.current = run;
      setIsSpeaking(true);

      const { ttsEngine, ttsVoice, ttsSpeed } = useSettingsStore.getState();
      const chunks = speechChunks(speakableText(text));

      const finish = () => {
        if (runRef.current === run) {
          runRef.current = null;
          setIsSpeaking(false);
        }
        onEnd?.();
      };

      const systemFrom = async (start: number) => {
        for (let i = start; i < chunks.length && !run.cancelled; i++) {
          await speakWithSystem(chunks[i], ttsSpeed, run);
        }
      };

      if (!chunks.length) return finish();

      if (ttsEngine === "system") {
        await systemFrom(0);
        return finish();
      }

      // Kokoro is only used once downloaded; a first click starts the
      // download and this answer is read by the system voice meanwhile
      let ready = false;
      try {
        const status = await api.ttsStatus();
        ready = status.state === "ready";
        if (!ready) {
          if (status.state !== "downloading") await api.ttsPrepare();
          // one live progress toast, however many times Listen is pressed
          trackVoiceDownload();
        }
      } catch {
        /* backend unreachable — `ready` stays false: system voice */
      }
      if (run.cancelled) return;
      if (!ready) {
        await systemFrom(0);
        return finish();
      }

      const fetchChunk = (i: number) =>
        api.ttsSpeak(chunks[i], ttsVoice, ttsSpeed, run.abort.signal);

      let next: Promise<Blob> | null = fetchChunk(0);
      for (let i = 0; i < chunks.length; i++) {
        let blob: Blob;
        try {
          blob = await next!;
        } catch (err) {
          if (run.cancelled) return;
          toast.error("The natural voice stopped — continuing with the system voice", {
            description: err instanceof Error ? err.message : undefined,
          });
          await systemFrom(i);
          return finish();
        }
        if (run.cancelled) return;
        // generate the next sentence while this one plays
        next = i + 1 < chunks.length ? fetchChunk(i + 1) : null;
        // an abandoned prefetch must not surface as an unhandled rejection
        next?.catch(() => {});
        try {
          await playBlob(blob, run);
        } catch {
          if (run.cancelled) return;
          await systemFrom(i);
          return finish();
        }
        if (run.cancelled) return;
      }
      finish();
    },
    [stop],
  );

  return { speak, stop, isSpeaking };
}
