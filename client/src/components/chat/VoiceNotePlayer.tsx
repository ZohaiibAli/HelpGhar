import { useEffect, useRef, useState } from "react";
import { Loader2, Mic, Pause, Play } from "lucide-react";
import type { ChatAttachment } from "@/services/messagingService";
import { formatVoiceTime } from "@/hooks/useVoiceRecorder";

// Starting one voice note pauses whichever other one is playing.
const PLAY_EVENT = "hg-voice-note-play";

export function VoiceNotePlayer({ attachment, mine }: { attachment: ChatAttachment; mine: boolean }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(attachment.duration ?? 0);
  const [error, setError] = useState(false);

  useEffect(() => {
    const onOtherPlay = (event: Event) => {
      if ((event as CustomEvent).detail !== audioRef.current) audioRef.current?.pause();
    };
    window.addEventListener(PLAY_EVENT, onOtherPlay);
    return () => window.removeEventListener(PLAY_EVENT, onOtherPlay);
  }, []);

  const toggle = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (!audio.paused) {
      audio.pause();
      return;
    }

    window.dispatchEvent(new CustomEvent(PLAY_EVENT, { detail: audio }));
    setLoading(true);
    try {
      await audio.play();
      setError(false);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const seek = (event: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const ratio = Math.min(Math.max((event.clientX - rect.left) / rect.width, 0), 1);
    audio.currentTime = ratio * duration;
    setCurrent(audio.currentTime);
  };

  const progress = duration ? Math.min(current / duration, 1) * 100 : 0;

  return (
    <div className="flex w-56 max-w-full items-center gap-3 py-0.5 sm:w-64">
      <audio
        ref={audioRef}
        preload="metadata"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => {
          setPlaying(false);
          setCurrent(0);
        }}
        onTimeUpdate={(event) => setCurrent(event.currentTarget.currentTime)}
        onLoadedMetadata={(event) => {
          // MediaRecorder webm often reports Infinity until fully read --
          // keep the server-measured length in that case.
          const d = event.currentTarget.duration;
          if (Number.isFinite(d) && d > 0) setDuration(d);
        }}
        onError={() => setError(true)}
      >
        {/* mp3 first: it plays everywhere, including iOS Safari. */}
        {attachment.playbackUrl && <source src={attachment.playbackUrl} type="audio/mpeg" />}
        <source src={attachment.url} type={attachment.mime} />
      </audio>

      <button
        type="button"
        onClick={toggle}
        aria-label={playing ? "Pause voice message" : "Play voice message"}
        className={`grid h-9 w-9 shrink-0 place-items-center rounded-full transition ${
          mine
            ? "bg-primary-foreground text-primary hover:bg-primary-foreground/90"
            : "bg-primary text-primary-foreground hover:bg-primary-dark"
        }`}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : playing ? (
          <Pause className="h-4 w-4 fill-current" />
        ) : (
          <Play className="ml-0.5 h-4 w-4 fill-current" />
        )}
      </button>

      <div className="min-w-0 flex-1">
        <div
          role="slider"
          aria-label="Voice message position"
          aria-valuemin={0}
          aria-valuemax={Math.round(duration)}
          aria-valuenow={Math.round(current)}
          tabIndex={-1}
          onClick={seek}
          className="relative h-1.5 cursor-pointer rounded-full"
          style={{ backgroundColor: "color-mix(in srgb, currentColor 20%, transparent)" }}
        >
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-current"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="mt-1 flex items-center justify-between text-[10px] opacity-75">
          <span className="inline-flex items-center gap-1">
            <Mic className="h-3 w-3" />
            {error ? "Can't play" : formatVoiceTime(playing || current > 0 ? current : duration)}
          </span>
          {(playing || current > 0) && <span>{formatVoiceTime(duration)}</span>}
        </div>
      </div>
    </div>
  );
}
