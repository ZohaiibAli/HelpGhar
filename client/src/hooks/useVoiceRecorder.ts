import { useCallback, useEffect, useRef, useState } from "react";

/** Recorder auto-stops here; the server allows a little more for rounding. */
export const MAX_VOICE_SECONDS = 120;

// First one the browser supports wins. Chrome/Edge/Firefox take webm/ogg
// (Opus); Safari only does mp4 (AAC).
const CANDIDATE_TYPES = [
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/mp4",
  "audio/ogg;codecs=opus",
];

function pickMimeType(): string | undefined {
  if (typeof MediaRecorder === "undefined" || !MediaRecorder.isTypeSupported) return undefined;
  return CANDIDATE_TYPES.find((type) => MediaRecorder.isTypeSupported(type));
}

export type VoiceRecording = { blob: Blob; duration: number };

export function isVoiceRecordingSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof MediaRecorder !== "undefined" &&
    !!navigator.mediaDevices?.getUserMedia
  );
}

/**
 * Microphone -> Blob. `start()` asks for mic permission the first time;
 * `stop()` resolves with the recording; `cancel()` throws it away. The mic
 * is always released afterwards, so the browser's "recording" indicator
 * doesn't stay lit.
 */
export function useVoiceRecorder({ onAutoStop }: { onAutoStop?: () => void } = {}) {
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startedAtRef = useRef(0);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoStopRef = useRef(onAutoStop);
  autoStopRef.current = onAutoStop;

  const release = useCallback(() => {
    if (tickRef.current) clearInterval(tickRef.current);
    tickRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    recorderRef.current = null;
    setRecording(false);
    setElapsed(0);
  }, []);

  const start = useCallback(async () => {
    if (recorderRef.current) return;

    // Throws NotAllowedError if the user denies the mic -- the caller
    // turns that into a message.
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mimeType = pickMimeType();
    const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);

    chunksRef.current = [];
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunksRef.current.push(event.data);
    };

    streamRef.current = stream;
    recorderRef.current = recorder;
    startedAtRef.current = Date.now();

    recorder.start(250);
    setRecording(true);
    setElapsed(0);

    tickRef.current = setInterval(() => {
      const seconds = (Date.now() - startedAtRef.current) / 1000;
      setElapsed(seconds);
      if (seconds >= MAX_VOICE_SECONDS) autoStopRef.current?.();
    }, 200);
  }, []);

  const stop = useCallback(
    () =>
      new Promise<VoiceRecording | null>((resolve) => {
        const recorder = recorderRef.current;

        if (!recorder) {
          resolve(null);
          return;
        }

        const duration = Math.min((Date.now() - startedAtRef.current) / 1000, MAX_VOICE_SECONDS);

        recorder.onstop = () => {
          const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
          chunksRef.current = [];
          release();
          resolve({ blob, duration });
        };

        if (recorder.state !== "inactive") recorder.stop();
        else recorder.onstop(new Event("stop"));
      }),
    [release]
  );

  const cancel = useCallback(() => {
    const recorder = recorderRef.current;

    if (recorder) {
      recorder.onstop = null;
      if (recorder.state !== "inactive") recorder.stop();
    }

    chunksRef.current = [];
    release();
  }, [release]);

  // Switching threads or leaving the page mid-recording must free the mic.
  useEffect(() => cancel, [cancel]);

  return { recording, elapsed, start, stop, cancel };
}

export function formatVoiceTime(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}
