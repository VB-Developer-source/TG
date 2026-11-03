import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { GameError } from "../core/Game";

export function ErrorOverlay({ error, onDismiss }: { error: GameError; onDismiss: () => void }) {
  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-background/80 px-6" role="alert">
      <div className="panel panel-enter w-full max-w-md overflow-hidden rounded-lg">
        <div className="hazard-stripe h-1.5" aria-hidden />
        <div className="p-6">
          <div className="flex items-center gap-3 text-signal">
            <AlertTriangle className="size-5" />
            <p className="eyebrow text-signal">{error.fatal ? "Signal failure" : "Caution"}</p>
          </div>
          <h2 className="title-display mt-3 text-3xl">
            {error.fatal ? "The simulator stopped" : "Something needs attention"}
          </h2>
          <p className="mt-3 text-sm text-muted-foreground">{error.message}</p>
          <div className="mt-6 flex gap-2">
            {error.fatal ? (
              <Button variant="hero" onClick={() => window.location.reload()}>
                Reload
              </Button>
            ) : (
              <Button variant="rail" onClick={onDismiss}>
                Dismiss
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
