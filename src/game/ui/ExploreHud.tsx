/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  AlertTriangle,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  CheckCircle2,
  ChevronsDown,
  ChevronsUp,
  Cpu,
  Home,
  MapPin,
  Radio,
  Route,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { VirtualMove } from "../camera/FreeCameraMode";
import type { FrameStats } from "../core/Game";
import { useEscape } from "./hooks";
import { TrainDrivingDock } from "./TrainDrivingDock";
import { RouteSelectorModal } from "./RouteSelectorModal";
import { defaultTrackPath, type StationApproachTelemetry } from "../train/TrackPath";
import { trainPhysics, type TrainPhysicsState } from "../train/TrainPhysics";
import type { PlayableRoute, BlockSignal } from "../railway/RailwayNetworkModels";

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

  // Route & Navigation State
  const [isRouteModalOpen, setIsRouteModalOpen] = useState(false);
  const [activeRoute, setActiveRoute] = useState<PlayableRoute>(defaultTrackPath.getActiveRoute());
  const [stationTelemetry, setStationTelemetry] = useState<StationApproachTelemetry | null>(null);
  const [signalAhead, setSignalAhead] = useState<{ signal: BlockSignal; distanceToSignal: number } | null>(null);
  const [speedLimitKmh, setSpeedLimitKmh] = useState<number>(105);
  const [pState, setPState] = useState<TrainPhysicsState>(trainPhysics.getState());

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "KeyI" && !e.repeat && !e.ctrlKey && !e.metaKey && !e.altKey) {
        onToggleDevInspector();
      }
      if (e.code === "KeyR" && e.shiftKey) {
        setIsRouteModalOpen(true);
      }
    };
    const onActiveCamera = (e: Event) => {
      const mode = (e as CustomEvent).detail?.mode;
      if (mode) setActiveCameraMode(mode);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("mls:camera:active", onActiveCamera);

    const unsubPhysics = trainPhysics.subscribe((s) => {
      setPState({ ...s });
      // Calculate train position along continuous route
      const trainDist = defaultTrackPath.getStationStopDistance() + s.distance;
      const tel = defaultTrackPath.getUpcomingStation(trainDist, s.reverser >= 0);
      setStationTelemetry(tel);

      const sig = defaultTrackPath.getSignalAhead(trainDist, s.reverser >= 0);
      setSignalAhead(sig);

      const limit = defaultTrackPath.getSpeedLimitAt(trainDist);
      setSpeedLimitKmh(limit);
    });

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("mls:camera:active", onActiveCamera);
      unsubPhysics();
    };
  }, [onToggleDevInspector]);

  const handleCameraChange = (mode: import("./TrainDrivingDock").CameraModeOption) => {
    window.dispatchEvent(new CustomEvent("mls:train:cameramode", { detail: { mode } }));
    setActiveCameraMode(mode);
  };

  const handleRouteSelect = (route: PlayableRoute) => {
    defaultTrackPath.setRoute(route);
    setActiveRoute(route);
    window.dispatchEvent(new CustomEvent("mls:route:select", { detail: { route } }));
  };

  const handleJumpToStation = (stationCode: string) => {
    const targetDist = defaultTrackPath.getStationStopDistance(stationCode);
    const currentOffset = defaultTrackPath.getStationStopDistance();
    // Align distance so trainDist becomes targetDist
    trainPhysics.setDistance(targetDist - currentOffset);
    window.dispatchEvent(new CustomEvent("mls:station:jump", { detail: { stationCode, targetDist } }));
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
        {/* Left Side: System Metadata */}
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
              variant="rail"
              size="sm"
              className="pointer-events-auto h-7 text-xs font-mono gap-1.5 bg-amber-950/40 hover:bg-amber-900/60 border-amber-600/60 text-amber-300"
              onClick={() => setIsRouteModalOpen(true)}
              title="Open Mumbai Railway Corridor & Route Selector"
            >
              <Route className="h-3.5 w-3.5 text-amber-400" />
              <span>{activeRoute.shortName}</span>
              <span className="text-[10px] text-amber-500 font-sans hidden md:inline">({activeRoute.directionLabel.split(" ")[0]})</span>
            </Button>

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
            Mumbai Suburban EMU · 1,676 mm Broad Gauge · 25kV AC · MPS {speedLimitKmh} km/h
          </span>
        </div>

        {/* Center: Real-Time Station Approach & Stopping Alignment Guidance */}
        {stationTelemetry && (
          <div className="hidden lg:flex flex-col items-center bg-slate-950/90 border border-slate-800/90 rounded-xl px-4 py-2 shadow-2xl backdrop-blur-md text-white min-w-[320px]">
            <div className="flex items-center gap-2 text-xs">
              <MapPin className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span className="font-mono text-slate-400 text-[10px] uppercase tracking-wider">NEXT STATION:</span>
              <span className="font-bold text-white tracking-wide">{stationTelemetry.station.name}</span>
              <span className="text-[11px] text-amber-400 font-devanagari">({stationTelemetry.station.nameDevanagari})</span>
              <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-slate-800 text-cyan-300 border border-slate-700">
                {stationTelemetry.station.platformNumber} ({stationTelemetry.correctPlatformSide})
              </span>
            </div>

            <div className="flex items-center gap-3 mt-1 text-[11px] font-mono">
              <div className="flex items-baseline gap-1">
                <span className="text-slate-400">DIST:</span>
                <span className={`font-bold tabular-nums ${stationTelemetry.isAligned ? "text-emerald-400" : "text-amber-300"}`}>
                  {Math.abs(stationTelemetry.distanceToStop) >= 1000
                    ? `${(stationTelemetry.distanceToStop / 1000).toFixed(2)} km`
                    : `${stationTelemetry.distanceToStop.toFixed(0)} m`}
                </span>
              </div>

              <span>•</span>

              <div className="flex items-center gap-1.5">
                {stationTelemetry.isAligned ? (
                  <span className="flex items-center gap-1 text-emerald-400 font-bold animate-pulse">
                    <CheckCircle2 className="w-3.5 h-3.5" /> ALIGNED AT PLATFORM — SAFE TO OPEN DOORS
                  </span>
                ) : stationTelemetry.status === "OVERSHOT" ? (
                  <span className="text-red-400 font-bold flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" /> OVERSHOT PLATFORM MARKER
                  </span>
                ) : stationTelemetry.status === "BRAKING_ZONE" ? (
                  <span className="text-orange-400 font-bold">
                    BRAKING ZONE · TARGET: 20 KM/H
                  </span>
                ) : (
                  <span className="text-slate-300">
                    REC: <strong className="text-cyan-300">{stationTelemetry.recommendedSpeedKmh} KM/H</strong>
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Right Side: Block Signal Aspect & Menu Exit */}
        <div className="flex items-center gap-2">
          {signalAhead && (
            <div className="hidden sm:flex items-center gap-2 bg-slate-950/80 px-2.5 py-1.5 rounded-lg border border-slate-800/80 text-xs font-mono">
              <span
                className={`w-3 h-3 rounded-full shadow-lg ${
                  signalAhead.signal.aspect === "GREEN"
                    ? "bg-emerald-500 shadow-emerald-500/50"
                    : signalAhead.signal.aspect === "DOUBLE_YELLOW"
                    ? "bg-amber-400 shadow-amber-400/50"
                    : signalAhead.signal.aspect === "YELLOW"
                    ? "bg-amber-500 shadow-amber-500/50"
                    : "bg-red-500 shadow-red-500/50 animate-pulse"
                }`}
              />
              <div className="flex flex-col text-[10px] leading-tight">
                <span className="font-bold text-white uppercase">{signalAhead.signal.aspect}</span>
                <span className="text-slate-400 tabular-nums">{(signalAhead.distanceToSignal).toFixed(0)}m ahead</span>
              </div>
            </div>
          )}

          <Button variant="rail" className="pointer-events-auto h-8 text-xs font-mono" onClick={onExit}>
            <Home className="w-3.5 h-3.5" /> Menu <span className="kbd ml-1 hidden sm:inline-flex">Esc</span>
          </Button>
        </div>
      </div>

      {/* Safety Alert Banners */}
      {pState.doorsOpen && pState.speed > 0.3 && (
        <div className="fade-up absolute top-24 left-1/2 -translate-x-1/2 z-30 bg-red-950/95 border border-red-600 px-4 py-2 rounded-xl text-red-200 text-xs font-mono font-bold flex items-center gap-2 shadow-2xl animate-bounce">
          <AlertTriangle className="w-4 h-4 text-red-400" />
          <span>SAFETY WARNING: PASSENGER DOORS OPEN WHILE TRAIN IN MOTION! TRACTION INTERLOCK ACTIVE</span>
        </div>
      )}

      {/* Interactive Collapsible Mumbai Local Train Driving Dock */}
      <TrainDrivingDock
        activeCameraMode={activeCameraMode}
        onCameraChange={handleCameraChange}
        onOpenRouteSelector={() => setIsRouteModalOpen(true)}
        activeRouteLabel={activeRoute.shortName}
        stationTelemetry={
          stationTelemetry
            ? {
                nextStationName: stationTelemetry.station.name,
                distanceToStop: stationTelemetry.distanceToStop,
                platformSide: stationTelemetry.correctPlatformSide,
                isAligned: stationTelemetry.isAligned,
              }
            : null
        }
      />

      {/* Route & Corridor Selector Modal */}
      <RouteSelectorModal
        isOpen={isRouteModalOpen}
        activeRouteId={activeRoute.routeId}
        onClose={() => setIsRouteModalOpen(false)}
        onSelectRoute={handleRouteSelect}
        onJumpToStation={handleJumpToStation}
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
        <div className="pointer-events-auto absolute bottom-6 right-6 flex flex-col items-center gap-2 select-none">
          <div className="grid grid-cols-3 gap-2">
            <div />
            <Pad axis="forward" value={1} label="Forward">
              <ArrowUp />
            </Pad>
            <div />
            <Pad axis="right" value={-1} label="Left">
              <ArrowLeft />
            </Pad>
            <Pad axis="forward" value={-1} label="Backward">
              <ArrowDown />
            </Pad>
            <Pad axis="right" value={1} label="Right">
              <ArrowRight />
            </Pad>
          </div>
          <div className="flex gap-2">
            <Pad axis="up" value={1} label="Up">
              <ChevronsUp />
            </Pad>
            <Pad axis="up" value={-1} label="Down">
              <ChevronsDown />
            </Pad>
          </div>
        </div>
      )}
    </div>
  );
}
