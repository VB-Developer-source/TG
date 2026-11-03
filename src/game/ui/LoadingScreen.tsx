import { useEffect, useState } from "react";
import type { LoadProgress } from "../core/AssetManager";
import { cn } from "@/lib/utils";

const FADE_MS = 900;

interface LoadingScreenProps {
  progress: LoadProgress;
  visible: boolean;
}

export function LoadingScreen({ progress, visible }: LoadingScreenProps) {
  const [mounted, setMounted] = useState(true);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      return;
    }
    const id = setTimeout(() => setMounted(false), FADE_MS);
    return () => clearTimeout(id);
  }, [visible]);

  if (!mounted) return null;
  const percent = Math.round(progress.progress * 100);

  return (
    <div
      className={cn(
        "loading-backdrop absolute inset-0 z-30 flex flex-col items-center justify-center px-6 transition-opacity duration-[900ms]",
        visible ? "opacity-100" : "pointer-events-none opacity-0",
      )}
      role="status"
      aria-live="polite"
      aria-busy={visible}
    >
      <div className="fade-up flex w-full max-w-xl flex-col items-center text-center">
        <div className="flex items-center gap-3">
          <span className="signal-lamp" aria-hidden />
          <p className="eyebrow">Western · Central · Harbour</p>
        </div>
        <h1 className="title-display mt-5 text-6xl sm:text-7xl md:text-8xl">
          Mumbai Local
          <span className="block text-primary">Train Simulator</span>
        </h1>
        <p className="mt-4 text-sm text-muted-foreground">Experience the lifeline of Mumbai.</p>

        <div className="mt-12 w-full">
          <div className="mb-3 flex items-end justify-between gap-4 font-mono text-xs uppercase tracking-[0.14em]">
            <span className="truncate text-muted-foreground">{progress.message}…</span>
            <span className="text-2xl font-medium tabular-nums text-foreground">
              {percent}
              <span className="text-sm text-muted-foreground">%</span>
            </span>
          </div>
          <div
            className="track-loader"
            role="progressbar"
            aria-label="Loading"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={percent}
          >
            <div className="track-loader-fill" style={{ width: `${percent}%` }} />
            <div className="track-loader-train" style={{ left: `${Math.max(percent, 4)}%` }} />
          </div>
          <div className="mt-3 flex justify-between font-mono text-[0.65rem] uppercase tracking-[0.14em] text-muted-foreground">
            <span>
              Step {Math.min(progress.completed + 1, Math.max(progress.total, 1))} / {Math.max(progress.total, 1)}
            </span>
            {progress.failures.length > 0 && (
              <span className="text-signal">Optional skipped: {progress.failures.length}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
