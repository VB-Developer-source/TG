/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef, useState, type ReactNode } from "react";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, ChevronsDown, ChevronsUp, Cpu, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { VirtualMove } from "../camera/FreeCameraMode";
import type { FrameStats } from "../core/Game";
import { useEscape } from "./hooks";
import { TrainDrivingDock } from "./TrainDrivingDock";

interface ExploreHudProps {
  stats: FrameStats;
  stationName: string;
  stationNameDevanagari: string;
  onExit: () => void;
  onMove: (move: VirtualMove) => void;
  onToggleDevInspector: () => void;
  isDevInspectorOpen: boolean;
}

type Axis = keyof VirtualMove;

function useCoarsePointer(): boolean {
  const [coarse, setCoarse] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(pointer: coarse)");
    const sync = () => setCoarse(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);
  return coarse;
}

export function ExploreHud({
  stats,
  stationName,
  stationNameDevanagari,
  onExit,
  onMove,
  onToggleDevInspector,
  isDevInspectorOpen,
}: ExploreHudProps) {
  useEscape(onExit);
  const coarse = useCoarsePointer();
  const move = useRef<VirtualMove>({ forward: 0, right: 0, up: 0 });
  const [activeCameraMode, setActiveCameraMode] = useState<string>("free");

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "KeyI" && !e.repeat && !e.ctrlKey && !e.metaKey && !e.altKey) {
        onToggleDevInspector();
      }
    };
    const onActiveCamera = (e: Event) => {
      const mode = (e as CustomEvent).detail?.mode;
      if (mode) setActiveCameraMode(mode);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("mls:camera:active", onActiveCamera);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("mls:camera:active", onActiveCamera);
    };
  }, [onToggleDevInspector]);

  const handleCameraChange = (mode: import("./TrainDrivingDock").CameraModeOption) => {
    window.dispatchEvent(new CustomEvent("mls:train:cameramode", { detail: { mode } }));
    setActiveCameraMode(mode);
  };

  const press = (axis: Axis, value: number) => {
    move.current = { ...move.current, [axis]: value };
    onMove(move.current);
  };

  const Pad = ({ axis, value, label, children }: { axis: Axis; value: number; label: string; children: ReactNode }) => (
    <button
      type="button"
      className="dpad-button"
      aria-label={label}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        press(axis, value);
      }}
      onPointerUp={() => press(axis, 0)}
      onPointerCancel={() => press(axis, 0)}
    >
      {children}
    </button>
  );

  return (
    <div className="pointer-events-none absolute inset-0 z-20 overflow-hidden">
      {/* Top Header Bar */}
      <div className="fade-up absolute left-4 right-4 top-4 flex items-start justify-between gap-3 sm:left-6 sm:right-6 sm:top-6">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="hud-chip">
              <span className="signal-lamp" aria-hidden />
              <span className="uppercase font-bold tracking-wide text-amber-300">
                {activeCameraMode}
              </span>{" "}
              · {stationName}{" "}
              <span className="opacity-80 font-devanagari">({stationNameDevanagari})</span>
            </span>

            <Button
              variant={isDevInspectorOpen ? "default" : "rail"}
              size="sm"
              className="pointer-events-auto h-7 text-xs font-mono gap-1.5"
              onClick={onToggleDevInspector}
            >
              <Cpu className="h-3.5 w-3.5 text-amber-400" />
              <span>Dev Inspector</span>
              <span className="kbd ml-0.5 hidden sm:inline-flex">I</span>
            </Button>
          </div>

          <span className="hud-chip text-muted-foreground text-[11px]">
            Mumbai Suburban EMU · 1,676 mm Broad Gauge · 25kV AC Traction
          </span>
        </div>

        <Button variant="rail" className="pointer-events-auto" onClick={onExit}>
          <Home /> Menu <span className="kbd ml-1 hidden sm:inline-flex">Esc</span>
        </Button>
      </div>

      {/* Interactive Collapsible Mumbai Local Train Driving Dock */}
      <TrainDrivingDock
        activeCameraMode={activeCameraMode}
        onCameraChange={handleCameraChange}
      />

      {/* Keyboard Shortcuts Hint Pill */}
      {!coarse && (
        <div className="fade-up absolute bottom-24 left-6 hidden flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px] text-slate-400 sm:flex bg-slate-950/80 px-3 py-1.5 rounded-lg border border-slate-800/70 backdrop-blur-sm pointer-events-none shadow-lg">
          <span className="flex items-center gap-1 font-mono">
            <span className="kbd">W</span>/<span className="kbd">S</span> Throttle & Brake
          </span>
          <span className="flex items-center gap-1 font-mono">
            <span className="kbd">Space</span> EMG Brake
          </span>
          <span className="flex items-center gap-1 font-mono">
            <span className="kbd">H</span> Horn
          </span>
          <span className="flex items-center gap-1 font-mono">
            <span className="kbd">D</span> Doors
          </span>
          <span className="flex items-center gap-1 font-mono">
            <span className="kbd">V</span> View
          </span>
          <span className="flex items-center gap-1 font-mono">
            <span className="kbd">I</span> Inspector
          </span>
        </div>
      )}

      {/* Mobile Touch Controls */}
      {coarse && (
        <div className="pointer-events-auto absolute bottom-24 left-4 grid grid-cols-3 gap-2">
          <span />
          <Pad axis="forward" value={1} label="Move forward">
            <ArrowUp />
          </Pad>
          <span />
          <Pad axis="right" value={-1} label="Move left">
            <ArrowLeft />
          </Pad>
          <Pad axis="forward" value={-1} label="Move back">
            <ArrowDown />
          </Pad>
          <Pad axis="right" value={1} label="Move right">
            <ArrowRight />
          </Pad>
        </div>
      )}
      {coarse && (
        <div className="pointer-events-auto absolute bottom-24 right-4 flex flex-col gap-2">
          <Pad axis="up" value={1} label="Move up">
            <ChevronsUp />
          </Pad>
          <Pad axis="up" value={-1} label="Move down">
            <ChevronsDown />
          </Pad>
        </div>
      )}

      {/* Performance & Position Telemetry */}
      <div
        className={`absolute bottom-24 flex flex-col items-end gap-1.5 ${coarse ? "right-20" : "right-6"}`}
        aria-label="Simulation telemetry"
      >
        <span className="hud-chip tabular-nums text-[10px]">
          X {stats.position[0].toFixed(1)} · Y {stats.position[1].toFixed(1)} · Z {stats.position[2].toFixed(1)}
        </span>
        <span className="hud-chip tabular-nums text-[10px]">
          {stats.fps || "--"} fps · {stats.pixelRatio.toFixed(2)}× res
        </span>
      </div>
    </div>
  );
}
