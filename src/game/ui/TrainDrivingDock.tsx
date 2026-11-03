/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from "react";
import {
  AlertTriangle,
  Camera,
  ChevronDown,
  ChevronUp,
  DoorClosed,
  DoorOpen,
  Gauge,
  Lightbulb,
  Radio,
  Volume2,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { trainPhysics, type TrainPhysicsState } from "../train/TrainPhysics";

export type CameraModeOption = "free" | "cab" | "passenger" | "follow" | "railfan" | "drone";

interface TrainDrivingDockProps {
  activeCameraMode: string;
  onCameraChange: (mode: CameraModeOption) => void;
}

export function TrainDrivingDock({ activeCameraMode, onCameraChange }: TrainDrivingDockProps) {
  const [pState, setPState] = useState<TrainPhysicsState>(trainPhysics.getState());
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    return trainPhysics.subscribe((s) => {
      setPState({ ...s });
    });
  }, []);

  const handleThrottleUp = () => {
    trainPhysics.increaseThrottle();
  };

  const handleThrottleDown = () => {
    trainPhysics.decreaseThrottle();
  };

  const handleCoast = () => {
    trainPhysics.setCoast();
  };

  const handleEmergency = () => {
    window.dispatchEvent(new CustomEvent("mls:train:emergency"));
  };

  const handleHorn = () => {
    window.dispatchEvent(new CustomEvent("mls:train:horn"));
  };

  const handleDoors = () => {
    window.dispatchEvent(new CustomEvent("mls:train:doors"));
  };

  const handleHeadlights = () => {
    window.dispatchEvent(
      new KeyboardEvent("keydown", { code: "KeyL", bubbles: true })
    );
  };

  const handleReverser = () => {
    if (Math.abs(pState.speed) < 0.1) {
      trainPhysics.setReverser(pState.reverser === 1 ? -1 : 1);
    }
  };

  const cycleCamera = () => {
    const modes: CameraModeOption[] = ["free", "cab", "passenger", "follow", "railfan", "drone"];
    const nextIdx = (modes.indexOf(activeCameraMode as any) + 1) % modes.length;
    onCameraChange(modes[nextIdx]);
  };

  return (
    <div
      className="pointer-events-auto absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center transition-all duration-300"
      style={{ maxWidth: "min(960px, 96vw)" }}
    >
      {/* Collapse / Expand Toggle Tab */}
      <button
        type="button"
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center gap-1.5 px-3 py-1 bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-mono rounded-t-md border-t border-x border-slate-700/80 shadow-md backdrop-blur-sm transition-colors cursor-pointer"
        aria-label={collapsed ? "Expand Driving Controls" : "Collapse Driving Controls"}
      >
        {collapsed ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        <span>{collapsed ? "DRIVER CONTROLS" : "HIDE CONTROLS"}</span>
        <span className="text-[10px] text-amber-400 font-sans tracking-wide">
          {pState.speedKmh.toFixed(0)} KM/H
        </span>
      </button>

      {/* Main Glassmorphic Control Dock */}
      {!collapsed && (
        <div className="w-full bg-slate-950/92 backdrop-blur-md border border-slate-800 rounded-b-xl rounded-t-sm p-2.5 sm:p-3 shadow-2xl flex flex-wrap items-center justify-between gap-3 text-white">
          {/* 1. Speedometer & Traveled Distance Readout */}
          <div className="flex items-center gap-2.5 sm:gap-3 bg-slate-900/90 px-3 py-2 rounded-lg border border-slate-800/80">
            <div className="flex flex-col items-center justify-center min-w-[72px]">
              <div className="flex items-baseline gap-0.5">
                <span className="font-mono text-2xl sm:text-3xl font-extrabold tracking-tight text-amber-400 tabular-nums">
                  {pState.speedKmh.toFixed(0)}
                </span>
                <span className="text-[10px] text-slate-400 font-bold uppercase">km/h</span>
              </div>
              <span className="text-[9px] text-slate-400 uppercase tracking-widest font-mono">
                {pState.acceleration >= 0.05
                  ? `+${pState.acceleration.toFixed(2)} m/s²`
                  : pState.acceleration <= -0.05
                  ? `${pState.acceleration.toFixed(2)} m/s²`
                  : "0.00 m/s²"}
              </span>
            </div>

            <div className="h-9 w-px bg-slate-800" />

            {/* Controller Notch & Brake Pipe Info */}
            <div className="flex flex-col gap-0.5 text-xs font-mono">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-slate-400">NOTCH:</span>
                <span
                  className={`px-1.5 py-0.2 rounded font-bold text-[11px] ${
                    pState.emergencyBrakeActive
                      ? "bg-red-950 text-red-400 border border-red-700"
                      : pState.controllerMode === "TRACTION"
                      ? "bg-amber-950 text-amber-300 border border-amber-600/80"
                      : pState.controllerMode === "SERVICE_BRAKE"
                      ? "bg-orange-950 text-orange-400 border border-orange-700"
                      : "bg-slate-800 text-slate-300"
                  }`}
                >
                  {pState.emergencyBrakeActive
                    ? "EMG"
                    : pState.controllerMode === "TRACTION"
                    ? `P${pState.tractionNotch}`
                    : pState.controllerMode === "SERVICE_BRAKE"
                    ? `B${pState.brakeNotch}`
                    : "COAST"}
                </span>
                <button
                  type="button"
                  onClick={handleReverser}
                  title="Click to toggle Reverser (Standstill only)"
                  className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700"
                >
                  {pState.reverser === 1 ? "FWD" : pState.reverser === -1 ? "REV" : "NEU"}
                </button>
              </div>

              <div className="flex items-center gap-2 text-[10px] text-slate-400">
                <span>
                  BP: <strong className="text-emerald-400">{pState.brakePipePressureBar.toFixed(1)} bar</strong>
                </span>
                <span>
                  BC: <strong className="text-orange-400">{pState.brakeCylinderBar.toFixed(1)} bar</strong>
                </span>
              </div>
            </div>
          </div>

          {/* 2. Throttle & Brake Controller Buttons */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <div className="flex items-center bg-slate-900 rounded-lg p-0.5 border border-slate-800">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleThrottleUp}
                className="h-8 px-2.5 text-xs font-mono font-bold hover:bg-amber-500/20 text-amber-400 hover:text-amber-300 gap-1"
                title="Increase Traction Notch (Key: W or Up Arrow)"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>POWER +</span>
                <span className="text-[10px] text-slate-500 hidden sm:inline">W</span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleCoast}
                className={`h-8 px-2 text-xs font-mono ${
                  pState.controllerMode === "COAST" ? "bg-slate-800 text-white font-bold" : "text-slate-400"
                }`}
                title="Coast (Zero power and zero brake)"
              >
                COAST
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleThrottleDown}
                className="h-8 px-2.5 text-xs font-mono font-bold hover:bg-orange-500/20 text-orange-400 hover:text-orange-300 gap-1"
                title="Apply Service Brake / Lower Power (Key: S or Down Arrow)"
              >
                <span>BRAKE -</span>
                <span className="text-[10px] text-slate-500 hidden sm:inline">S</span>
              </Button>
            </div>

            <Button
              variant={pState.emergencyBrakeActive ? "destructive" : "rail"}
              size="sm"
              onClick={handleEmergency}
              className={`h-8 px-2.5 text-xs font-mono font-bold gap-1 ${
                pState.emergencyBrakeActive ? "animate-pulse" : "border-red-900/60 text-red-400 hover:bg-red-950/60"
              }`}
              title="Toggle Emergency Air Brake (Key: Space)"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>EMG</span>
              <span className="text-[10px] text-slate-400 hidden sm:inline">Space</span>
            </Button>
          </div>

          {/* 3. Train Subsystem Controls (Horn, Doors, Headlights, Camera) */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <Button
              variant="rail"
              size="sm"
              onClick={handleHorn}
              className="h-8 px-2.5 text-xs font-mono gap-1 text-amber-300 hover:bg-amber-950/50 border-amber-900/60"
              title="Sound Dual-Tone Pneumatic Horn (Key: H)"
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>HORN</span>
              <span className="text-[10px] text-slate-500 hidden sm:inline">H</span>
            </Button>

            <Button
              variant={pState.doorsOpen ? "destructive" : "rail"}
              size="sm"
              onClick={handleDoors}
              className={`h-8 px-2.5 text-xs font-mono gap-1 ${
                pState.doorsOpen
                  ? "border-amber-500/80 text-amber-300"
                  : "text-slate-300 hover:text-white"
              }`}
              title="Toggle Passenger Doors (Key: Shift+D or D)"
            >
              {pState.doorsOpen ? <DoorOpen className="w-3.5 h-3.5" /> : <DoorClosed className="w-3.5 h-3.5" />}
              <span>{pState.doorsOpen ? "DOORS OPEN" : "DOORS"}</span>
              <span className="text-[10px] text-slate-500 hidden sm:inline">D</span>
            </Button>

            <Button
              variant="rail"
              size="sm"
              onClick={handleHeadlights}
              className="h-8 px-2 text-xs font-mono gap-1 text-slate-300 hover:text-white"
              title="Toggle Cab Headlights (Key: L)"
            >
              <Lightbulb className="w-3.5 h-3.5" />
              <span className="text-[10px] text-slate-500 hidden sm:inline">L</span>
            </Button>

            <Button
              variant="default"
              size="sm"
              onClick={cycleCamera}
              className="h-8 px-2.5 text-xs font-mono gap-1 bg-cyan-900/60 hover:bg-cyan-800/80 border border-cyan-700/80 text-cyan-200"
              title="Cycle Camera Mode: Free Cam, Driver Cab, Follow, Railfan (Key: V)"
            >
              <Camera className="w-3.5 h-3.5" />
              <span className="uppercase text-[11px] font-bold">{activeCameraMode}</span>
              <span className="text-[10px] text-cyan-400 hidden sm:inline">V</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
