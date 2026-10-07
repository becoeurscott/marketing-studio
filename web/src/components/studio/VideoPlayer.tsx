"use client";

import { Pause, Play, Volume2, VolumeX } from "lucide-react";
import { useRef, useState } from "react";
import { IconButton } from "@/components/ui/IconButton";
import type { VideoResult } from "@/lib/api";
import { cn } from "@/lib/utils";
import { RATIO_CLASS } from "./constants";

function fmt(s: number) {
  const m = Math.floor(s / 60);
  const r = Math.floor(s % 60);
  return `${m}:${r.toString().padStart(2, "0")}`;
}

/** Mock player: <video> with the sample clip, poster fallback, play overlay, scrubber and duration. Playback is clamped to the generated duration. */
export function VideoPlayer({ result, className, heightClass = "h-[max(14rem,70dvh)]", maxHeightClass = "max-h-[max(14rem,70dvh)]" }: { result: VideoResult; className?: string; heightClass?: string; maxHeightClass?: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const [time, setTime] = useState(0);
  const [failed, setFailed] = useState(false);
  const duration = result.durationSec;

  const toggle = () => {
    const v = ref.current;
    if (!v || failed) return;
    if (v.paused) { void v.play().catch(() => setFailed(true)); } else v.pause();
  };
  const onTime = () => {
    const v = ref.current;
    if (!v) return;
    if (v.currentTime >= duration) { v.pause(); v.currentTime = 0; setTime(0); setPlaying(false); return; }
    setTime(v.currentTime);
  };
  const seek = (t: number) => { if (ref.current) { ref.current.currentTime = t; } setTime(t); };

  return (
    <div className={cn("relative rounded-xl overflow-hidden bg-black border border-border shadow-card group", className)}>
      <div className={cn("relative mx-auto max-w-full", maxHeightClass, RATIO_CLASS[result.ratio], result.ratio === "9:16" || result.ratio === "4:5" ? heightClass : "w-full")}>
        {!failed ? (
          <video
            ref={ref}
            src={result.url}
            poster={result.poster}
            muted={muted}
            playsInline
            preload="metadata"
            className="size-full object-cover"
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            onTimeUpdate={onTime}
            onError={() => setFailed(true)}
            onClick={toggle}
          />
        ) : (
          <img src={result.poster} alt="Aperçu de la vidéo" className="size-full object-cover" />
        )}
        {!playing && (
          <button onClick={toggle} className="absolute inset-0 flex items-center justify-center bg-black/25 hover:bg-black/35 transition-colors" aria-label="Lire">
            <span className="size-16 rounded-full bg-white/90 text-black flex items-center justify-center shadow-float"><Play className="size-7 ml-1 fill-current" /></span>
          </button>
        )}
        <span className="absolute top-3 right-3 h-6 px-2 rounded-full bg-black/60 text-[11px] font-medium text-white inline-flex items-center">{duration}s · {result.ratio}</span>
      </div>
      {/* controls */}
      <div className="flex items-center gap-2 px-3 py-2 bg-card border-t border-border">
        <IconButton size="sm" label={playing ? "Pause" : "Lire"} onClick={toggle}>{playing ? <Pause /> : <Play />}</IconButton>
        <span className="text-[11px] tabular-nums text-text2 w-8">{fmt(time)}</span>
        <input type="range" min={0} max={duration} step={0.1} value={Math.min(time, duration)} onChange={(e) => seek(Number(e.target.value))} className="flex-1 accent-[#d1fe17]" aria-label="Position de lecture" />
        <span className="text-[11px] tabular-nums text-text2 w-8 text-right">{fmt(duration)}</span>
        <IconButton size="sm" label={muted ? "Activer le son" : "Couper le son"} onClick={() => setMuted((m) => !m)}>{muted ? <VolumeX /> : <Volume2 />}</IconButton>
      </div>
    </div>
  );
}
