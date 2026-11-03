import { useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Compass,
  Cpu,
  Layers,
  MapPin,
  Maximize2,
  Navigation,
  Train,
  X,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { INFRASTRUCTURE_PROJECTS } from "../../railway/data/infrastructureProjects";
import { STATIONS } from "../../railway/data/stations";
import type { CorridorId, StationRecord } from "../../railway/data/types";
import { RailwayNetwork } from "../../railway/RailwayNetwork";

interface DevInspectorProps {
  currentStationId: string;
  onSelectStation: (stationId: string) => void;
  onClose: () => void;
}

export function DevInspector({
  currentStationId,
  onSelectStation,
  onClose,
}: DevInspectorProps) {
  const [activeTab, setActiveTab] = useState<"stations" | "corridors" | "projects" | "tracks" | "train">(
    "stations"
  );
  const [selectedCorridor, setSelectedCorridor] = useState<CorridorId>("CENTRAL");
  const [inspectedStation, setInspectedStation] = useState<StationRecord>(
    STATIONS[currentStationId] ?? STATIONS["DDR"]
  );
  const [isMinimized, setIsMinimized] = useState(false);

  // Train live controls
  const [trainDoors, setTrainDoors] = useState(false);
  const [trainHeadlights, setTrainHeadlights] = useState(true);
  const [trainInteriorLights, setTrainInteriorLights] = useState(true);
  const [trainWheelDemo, setTrainWheelDemo] = useState(false);
  const [trainLivery, setTrainLivery] = useState<"western" | "central" | "harbour">("western");

  const handleToggleDoors = () => {
    const next = !trainDoors;
    setTrainDoors(next);
    window.dispatchEvent(new CustomEvent("mls:train:doors", { detail: { open: next } }));
  };

  const handleToggleHeadlights = () => {
    const next = !trainHeadlights;
    setTrainHeadlights(next);
    window.dispatchEvent(
      new CustomEvent("mls:train:lights", {
        detail: { lights: { headlights: next, tail: next } },
      })
    );
  };

  const handleToggleInteriorLights = () => {
    const next = !trainInteriorLights;
    setTrainInteriorLights(next);
    window.dispatchEvent(
      new CustomEvent("mls:train:lights", {
        detail: { lights: { interior: next, destination: next } },
      })
    );
  };

  const handleToggleWheelDemo = () => {
    const next = !trainWheelDemo;
    setTrainWheelDemo(next);
    window.dispatchEvent(new CustomEvent("mls:train:wheeldemo", { detail: { active: next } }));
  };

  const handleSetLivery = (l: "western" | "central" | "harbour") => {
    setTrainLivery(l);
    window.dispatchEvent(new CustomEvent("mls:train:livery", { detail: { livery: l } }));
  };

  const handleStationClick = (stationId: string) => {
    const station = STATIONS[stationId];
    if (station) {
      setInspectedStation(station);
      onSelectStation(stationId);
    }
  };

  const corridorSequence = RailwayNetwork.getSequence(selectedCorridor);

  return (
    <div className="fixed bottom-4 right-4 z-40 flex flex-col items-end gap-2 max-w-[96vw] sm:max-w-[560px] pointer-events-auto">
      {/* Floating Toggle Pill if Minimized */}
      {isMinimized && (
        <button
          onClick={() => setIsMinimized(false)}
          className="flex items-center gap-2 rounded-full border border-amber-500/40 bg-slate-950/90 px-4 py-2 text-xs font-mono font-medium text-amber-400 shadow-xl backdrop-blur-md hover:bg-slate-900 transition-colors"
        >
          <Cpu className="h-4 w-4 animate-pulse text-amber-400" />
          <span>DEV INSPECTION MODE [SESSION 03]</span>
          <ChevronUp className="h-3.5 w-3.5" />
        </button>
      )}

      {/* Main Dev Inspector Window */}
      {!isMinimized && (
        <div className="w-full rounded-xl border border-slate-700/80 bg-slate-950/95 p-4 text-slate-100 shadow-2xl backdrop-blur-xl ring-1 ring-white/10 max-h-[85vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-amber-500/20 text-amber-400">
                <Cpu className="h-4 w-4" />
              </span>
              <div>
                <h3 className="font-mono text-sm font-bold uppercase tracking-wider text-amber-400">
                  Railway Network Inspector
                </h3>
                <p className="text-[10px] text-slate-400 font-mono">
                  Session 03 · IR Broad Gauge (1,676 mm) · 25kV AC OHE
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsMinimized(true)}
                className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
                title="Minimize"
              >
                <ChevronDown className="h-4 w-4" />
              </button>
              <button
                onClick={onClose}
                className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
                title="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex gap-1 border-b border-slate-800/80 pt-2 pb-2 text-xs font-mono">
            <button
              onClick={() => setActiveTab("stations")}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 transition-colors ${
                activeTab === "stations"
                  ? "bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30"
                  : "text-slate-400 hover:bg-slate-900 hover:text-slate-200"
              }`}
            >
              <MapPin className="h-3.5 w-3.5" />
              Stations ({Object.keys(STATIONS).length})
            </button>
            <button
              onClick={() => setActiveTab("corridors")}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 transition-colors ${
                activeTab === "corridors"
                  ? "bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30"
                  : "text-slate-400 hover:bg-slate-900 hover:text-slate-200"
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              Corridors
            </button>
            <button
              onClick={() => setActiveTab("projects")}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 transition-colors ${
                activeTab === "projects"
                  ? "bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30"
                  : "text-slate-400 hover:bg-slate-900 hover:text-slate-200"
              }`}
            >
              <Train className="h-3.5 w-3.5" />
              Projects ({INFRASTRUCTURE_PROJECTS.length})
            </button>
            <button
              onClick={() => setActiveTab("tracks")}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 transition-colors ${
                activeTab === "tracks"
                  ? "bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30"
                  : "text-slate-400 hover:bg-slate-900 hover:text-slate-200"
              }`}
            >
              <Zap className="h-3.5 w-3.5" />
              Track & OHE
            </button>
            <button
              onClick={() => setActiveTab("train")}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 transition-colors ${
                activeTab === "train"
                  ? "bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30"
                  : "text-slate-400 hover:bg-slate-900 hover:text-slate-200"
              }`}
            >
              <Train className="h-3.5 w-3.5" />
              EMU Train Model
            </button>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto pt-3 pr-1 space-y-3 font-sans text-xs">
            {/* TAB: STATIONS */}
            {activeTab === "stations" && (
              <div className="space-y-3">
                {/* Quick Teleport Hubs */}
                <div>
                  <div className="text-[11px] font-mono text-slate-400 mb-1 flex items-center gap-1">
                    <Navigation className="h-3 w-3 text-amber-400" />
                    <span>VERIFIED HUBS & STATIONS (CLICK TO TELEPORT 3D WORLD):</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5 font-mono">
                    {[
                      { id: "KYN", label: "Kalyan (KYN)", tag: "6 PF · 4 Pit" },
                      { id: "BSR", label: "Vasai Rd (BSR)", tag: "6 PF · 3 Pit" },
                      { id: "PR", label: "Parel (PR)", tag: "6 PF · 5 Pit" },
                      { id: "PNVL", label: "Panvel (PNVL)", tag: "5 PF · 4 Pit" },
                      { id: "LTT", label: "LTT Terminus", tag: "4 PF · 2 Pit" },
                      { id: "DI", label: "Dombivli (DI)", tag: "5 PF" },
                      { id: "DDR", label: "Dadar (DDR)", tag: "Origin Datum" },
                      { id: "CSMT", label: "CSMT Terminus", tag: "Historic HQ" },
                      { id: "VR", label: "Virar (VR)", tag: "PF 5A / 3A-4A" },
                    ].map((hub) => (
                      <button
                        key={hub.id}
                        onClick={() => handleStationClick(hub.id)}
                        className={`rounded-md p-2 text-left border transition-all ${
                          inspectedStation.stationId === hub.id
                            ? "border-amber-400 bg-amber-500/15 text-white"
                            : "border-slate-800 bg-slate-900/70 text-slate-300 hover:bg-slate-850 hover:border-slate-700"
                        }`}
                      >
                        <div className="font-semibold text-xs leading-tight">{hub.label}</div>
                        <div className="text-[10px] text-amber-400/80 mt-0.5">{hub.tag}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Inspected Station Card */}
                <div className="rounded-lg border border-slate-800 bg-slate-900/90 p-3.5 space-y-2.5">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-base font-bold text-white flex items-center gap-2">
                        <span>{inspectedStation.stationName}</span>
                        <span className="font-mono text-xs font-normal text-amber-400 px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/30">
                          {inspectedStation.stationCode}
                        </span>
                      </div>
                      <div className="text-sm font-semibold text-slate-300 font-devanagari">
                        {inspectedStation.stationNameDevanagari}
                      </div>
                    </div>

                    {/* Verification Badge */}
                    <div className="text-right">
                      {inspectedStation.verificationStatus === "PARTIALLY_VERIFIED" ||
                      inspectedStation.verificationStatus === "VERIFIED" ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-mono font-medium text-emerald-400">
                          <CheckCircle2 className="h-3 w-3" />
                          VERIFIED RECORD
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-[10px] font-mono font-medium text-amber-400">
                          <AlertTriangle className="h-3 w-3" />
                          PROVISIONAL GEOMETRY
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Quantitative Railway Metrics */}
                  <div className="grid grid-cols-2 gap-2 font-mono text-[11px] bg-slate-950/60 p-2.5 rounded-md border border-slate-800/80">
                    <div>
                      <span className="text-slate-400">Passenger Platforms: </span>
                      <span className="font-bold text-amber-300">
                        {inspectedStation.passengerPlatformCount !== null
                          ? inspectedStation.passengerPlatformCount
                          : "null (unverified)"}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400">Maintenance Pit Lines: </span>
                      <span className="font-bold text-amber-300">
                        {inspectedStation.pitLineCount !== null
                          ? inspectedStation.pitLineCount
                          : "null"}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400">Stabling Lines: </span>
                      <span className="font-bold text-amber-300">
                        {inspectedStation.stablingLineCount !== null
                          ? inspectedStation.stablingLineCount
                          : "null"}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400">Sick Lines: </span>
                      <span className="font-bold text-amber-300">
                        {inspectedStation.sickLineCount !== null
                          ? inspectedStation.sickLineCount
                          : "null"}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400">Track Layout: </span>
                      <span className="text-slate-200 font-semibold">
                        {inspectedStation.trackLayout}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400">Status: </span>
                      <span className="text-emerald-400 font-semibold">
                        {inspectedStation.infrastructureStatus}
                      </span>
                    </div>
                  </div>

                  {/* Junction Branches */}
                  {inspectedStation.junctionConnections &&
                    inspectedStation.junctionConnections.length > 0 && (
                      <div className="text-[11px]">
                        <span className="font-mono text-slate-400">Junction Connections: </span>
                        <span className="text-amber-300 font-mono">
                          {inspectedStation.junctionConnections.join(", ")}
                        </span>
                      </div>
                    )}

                  {/* Source Verification References */}
                  {inspectedStation.sourceReferences.length > 0 ? (
                    <div className="border-t border-slate-800 pt-2 text-[10px] space-y-1">
                      <div className="font-mono font-semibold text-slate-300">
                        Research & Government Sources:
                      </div>
                      {inspectedStation.sourceReferences.map((src, i) => (
                        <div key={i} className="text-slate-400 bg-slate-950/40 p-1.5 rounded">
                          <span className="text-slate-200 font-medium">{src.title}</span> —{" "}
                          <span className="text-amber-400">{src.organization}</span>
                          <div className="text-slate-400 mt-0.5">
                            Supported: {src.attributeSupported}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="border-t border-slate-800 pt-2 text-[10px] text-amber-400/90 italic">
                      ⚠ No specific platform count verified yet in project owner data. Strict rule:
                      platform count kept null; rendered using configurable provisional layout.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB: CORRIDORS */}
            {activeTab === "corridors" && (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-1 font-mono text-[11px]">
                  {[
                    { id: "CENTRAL" as CorridorId, label: "Central Main (CSMT-KYN)" },
                    { id: "KASARA_BRANCH" as CorridorId, label: "Kasara Branch" },
                    { id: "KARJAT_BRANCH" as CorridorId, label: "Karjat Branch" },
                    { id: "WESTERN" as CorridorId, label: "Western (CCG-VR)" },
                    { id: "HARBOUR" as CorridorId, label: "Harbour (CSMT-PNVL)" },
                    { id: "HARBOUR_WESTERN_CHORD" as CorridorId, label: "Wadala-Mahim Chord" },
                  ].map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setSelectedCorridor(c.id)}
                      className={`rounded px-2.5 py-1 transition-all ${
                        selectedCorridor === c.id
                          ? "bg-amber-500 text-slate-950 font-bold"
                          : "bg-slate-900 text-slate-300 border border-slate-800 hover:bg-slate-800"
                      }`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>

                <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3 space-y-2">
                  <div className="font-mono text-xs font-semibold text-slate-200 flex items-center justify-between">
                    <span>STATION SEQUENCE ({corridorSequence.length} STATIONS)</span>
                    <span className="text-[10px] text-slate-400">OFFICIAL IR TIMETABLE ORDER</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 max-h-[220px] overflow-y-auto pr-1">
                    {corridorSequence.map((st, idx) => (
                      <div
                        key={st.code}
                        className="flex items-center gap-2 rounded bg-slate-950/70 px-2 py-1 text-[11px] font-mono border border-slate-850"
                      >
                        <span className="text-amber-400 text-[10px] w-4">{idx + 1}</span>
                        <div className="truncate">
                          <span className="text-slate-200 font-medium">{st.name}</span>{" "}
                          <span className="text-slate-400 text-[10px]">({st.code})</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB: PROJECTS */}
            {activeTab === "projects" && (
              <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
                <div className="text-[11px] text-slate-400 font-mono">
                  13 MoR / MRVC CAPACITY EXPANSION PROJECTS (PART 05 RESEARCH):
                </div>
                {INFRASTRUCTURE_PROJECTS.map((proj) => (
                  <div
                    key={proj.id}
                    className="rounded-lg border border-slate-800 bg-slate-900/80 p-2.5 space-y-1 text-[11px]"
                  >
                    <div className="flex items-center justify-between font-mono">
                      <span className="font-bold text-slate-100">{proj.name}</span>
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                          proj.status === "UNDER_CONSTRUCTION"
                            ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                            : proj.status === "SANCTIONED_NOT_STARTED"
                            ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                            : "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                        }`}
                      >
                        {proj.status}
                      </span>
                    </div>
                    <p className="text-slate-300 text-[11px] leading-relaxed">{proj.scope}</p>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono pt-1 border-t border-slate-800/60">
                      <span>Agency: {proj.executingAgency}</span>
                      <span>Source: {proj.verifiedSource}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* TAB: TRACKS & OHE */}
            {activeTab === "tracks" && (
              <div className="space-y-3 font-mono text-xs">
                <div className="rounded-lg border border-slate-800 bg-slate-900/90 p-3 space-y-2">
                  <div className="font-bold text-amber-400 flex items-center gap-1.5">
                    <Train className="h-4 w-4" />
                    INDIAN BROAD GAUGE SPECIFICATION
                  </div>
                  <div className="space-y-1 text-[11px] text-slate-300">
                    <div>• Track Gauge: 1,676 mm between rail head running edges</div>
                    <div>• Rail Profile: UIC-60 (60 kg/m), 172 mm height</div>
                    <div>• Rail Head Width: 72 mm · Web: 17 mm · Foot: 150 mm</div>
                    <div>• PSC Sleeper: 2,750 mm length, 650 mm density spacing</div>
                    <div>• Ballast Cushion: 320 mm depth, 3,600 mm top width</div>
                    <div>• Fasteners: Pandrol Elastic Rail Clips (ERC) & rubber pads</div>
                  </div>
                </div>

                <div className="rounded-lg border border-slate-800 bg-slate-900/90 p-3 space-y-2">
                  <div className="font-bold text-amber-400 flex items-center gap-1.5">
                    <Zap className="h-4 w-4" />
                    25 kV AC OVERHEAD ELECTRIFICATION (OHE)
                  </div>
                  <div className="space-y-1 text-[11px] text-slate-300">
                    <div>• Contact Wire Height: 6.112 m above rail base</div>
                    <div>• Pantograph Alignment: Direct physical contact with EMU pan head</div>
                    <div>• Catenary Messenger Wire: 7.512 m support with parabolic sag</div>
                    <div>• Dropper Interval: 6.5 m vertical copper droppers</div>
                    <div>• Steel Lattice Portals: 24.0 m span with ceramic insulators</div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: EMU TRAIN MODEL */}
            {activeTab === "train" && (
              <div className="space-y-3 font-mono text-xs">
                {/* Train Livery Quick Selector */}
                <div className="rounded-lg border border-slate-800 bg-slate-900/90 p-3 space-y-2">
                  <div className="font-bold text-amber-400 flex items-center justify-between">
                    <span>LIVERY & RAILWAY ZONE</span>
                    <span className="text-[10px] text-slate-400">INSTANCED PBR MATERIALS</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5 font-mono text-[11px]">
                    {[
                      { id: "western" as const, label: "Western (WR)", color: "#b3176f", front: "#f5c514" },
                      { id: "central" as const, label: "Central (CR)", color: "#a1222b", front: "#f2c418" },
                      { id: "harbour" as const, label: "Harbour (HB)", color: "#1f6e66", front: "#eeba10" },
                    ].map((l) => (
                      <button
                        key={l.id}
                        onClick={() => handleSetLivery(l.id)}
                        className={`flex flex-col items-center p-2 rounded border transition-all ${
                          trainLivery === l.id
                            ? "border-amber-400 bg-slate-800 text-amber-300 font-bold"
                            : "border-slate-800 bg-slate-950/70 text-slate-300 hover:bg-slate-800"
                        }`}
                      >
                        <div className="flex gap-1 mb-1">
                          <span className="w-3 h-3 rounded-full border border-black/40" style={{ backgroundColor: l.front }} />
                          <span className="w-3 h-3 rounded-full border border-black/40" style={{ backgroundColor: l.color }} />
                        </div>
                        <span className="text-[10px] truncate">{l.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Train Interactive Systems */}
                <div className="rounded-lg border border-slate-800 bg-slate-900/90 p-3 space-y-2">
                  <div className="font-bold text-amber-400 flex items-center justify-between">
                    <span>LIVE TRAIN CONTROLS</span>
                    <span className="text-[10px] text-emerald-400 font-normal">REAL-TIME THREE.JS</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <button
                      onClick={handleToggleDoors}
                      className={`p-2 rounded border transition-colors flex items-center justify-between ${
                        trainDoors
                          ? "bg-emerald-950/60 border-emerald-500 text-emerald-300 font-bold"
                          : "bg-slate-950/80 border-slate-800 text-slate-300 hover:bg-slate-800"
                      }`}
                    >
                      <span>Sliding Doors:</span>
                      <span className={trainDoors ? "text-emerald-400" : "text-slate-500"}>
                        {trainDoors ? "OPENING [100%]" : "CLOSED [0%]"}
                      </span>
                    </button>

                    <button
                      onClick={handleToggleHeadlights}
                      className={`p-2 rounded border transition-colors flex items-center justify-between ${
                        trainHeadlights
                          ? "bg-amber-950/60 border-amber-500 text-amber-300 font-bold"
                          : "bg-slate-950/80 border-slate-800 text-slate-300 hover:bg-slate-800"
                      }`}
                    >
                      <span>250W Headlights:</span>
                      <span className={trainHeadlights ? "text-amber-400" : "text-slate-500"}>
                        {trainHeadlights ? "ON (BEAM)" : "OFF"}
                      </span>
                    </button>

                    <button
                      onClick={handleToggleInteriorLights}
                      className={`p-2 rounded border transition-colors flex items-center justify-between ${
                        trainInteriorLights
                          ? "bg-blue-950/60 border-blue-500 text-blue-300 font-bold"
                          : "bg-slate-950/80 border-slate-800 text-slate-300 hover:bg-slate-800"
                      }`}
                    >
                      <span>Interior Lights & PIS:</span>
                      <span className={trainInteriorLights ? "text-blue-400" : "text-slate-500"}>
                        {trainInteriorLights ? "ILLUMINATED" : "OFF"}
                      </span>
                    </button>

                    <button
                      onClick={handleToggleWheelDemo}
                      className={`p-2 rounded border transition-colors flex items-center justify-between ${
                        trainWheelDemo
                          ? "bg-purple-950/60 border-purple-500 text-purple-300 font-bold"
                          : "bg-slate-950/80 border-slate-800 text-slate-300 hover:bg-slate-800"
                      }`}
                    >
                      <span>Wheel Rotation Test:</span>
                      <span className={trainWheelDemo ? "text-purple-400" : "text-slate-500"}>
                        {trainWheelDemo ? "ROTATING (8 m/s)" : "STATIONARY"}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Train Mechanical & Geometric Specs */}
                <div className="rounded-lg border border-slate-800 bg-slate-900/90 p-3 space-y-1.5 text-[11px] text-slate-300">
                  <div className="font-bold text-amber-400 flex items-center justify-between pb-1 border-b border-slate-800">
                    <span>12-COACH EMU SPECIFICATION</span>
                    <span className="text-[10px] text-slate-400">ICF AERODYNAMIC SHELL</span>
                  </div>
                  <div>• Configuration: 12-Car Suburban Rake (4 Units × 3 Coaches: DTC + MC + TC)</div>
                  <div>• Wheel Gauge: Indian Broad Gauge 1,676 mm · Lathe profile wheelsets</div>
                  <div>• Coach Length: 20.0 m (20.7 m coupling pitch) · Total Rake Length: ~248 m</div>
                  <div>• Width & Height: 3.66 m outer width · 4.13 m curved tumblehome roof</div>
                  <div>• Pantographs: Single-arm 25kV AC pantographs on Motor Coaches (2, 5, 8, 11)</div>
                  <div>• Interior: Stainless grab rails, hanging straps, ceiling fans, luggage racks, PIS</div>
                  <div>• Cabin: Motorman console with throttle master controller, brake valve, dials</div>
                  <div>• Rendering: Batched InstancedMesh per (geometry, material) for solid 60 FPS</div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
