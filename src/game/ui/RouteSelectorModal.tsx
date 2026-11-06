/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from "react";
import {
  Check,
  ChevronRight,
  Compass,
  MapPin,
  Navigation,
  Route,
  Train,
  X,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PlayableRoute, StationWaypoint } from "../railway/RailwayNetworkModels";
import {
  AVAILABLE_ROUTES,
  ROUTE_CENTRAL_LOCAL_PLAYABLE,
  ROUTE_CENTRAL_MAINLINE,
  ROUTE_WESTERN_MAINLINE,
  ROUTE_HARBOUR_MAINLINE,
} from "../railway/RouteDatabase";

interface RouteSelectorModalProps {
  isOpen: boolean;
  activeRouteId: string;
  onClose: () => void;
  onSelectRoute: (route: PlayableRoute) => void;
  onJumpToStation?: (stationCode: string) => void;
}

export function RouteSelectorModal({
  isOpen,
  activeRouteId,
  onClose,
  onSelectRoute,
  onJumpToStation,
}: RouteSelectorModalProps) {
  const [selectedCorridorTab, setSelectedCorridorTab] = useState<"CENTRAL" | "WESTERN" | "HARBOUR">("CENTRAL");
  const [selectedRouteId, setSelectedRouteId] = useState<string>(activeRouteId);

  if (!isOpen) return null;

  const currentRoute =
    AVAILABLE_ROUTES.find((r) => r.routeId === selectedRouteId) ?? ROUTE_CENTRAL_LOCAL_PLAYABLE;

  const corridorRoutes = AVAILABLE_ROUTES.filter((r) => {
    if (selectedCorridorTab === "CENTRAL") {
      return (
        r.corridorId === "CENTRAL" ||
        r.corridorId === "KASARA_BRANCH" ||
        r.corridorId === "KARJAT_BRANCH" ||
        r.corridorId === "KHOPOLI_BRANCH"
      );
    }
    if (selectedCorridorTab === "WESTERN") {
      return r.corridorId === "WESTERN" || r.corridorId === "WESTERN_DAHANU";
    }
    if (selectedCorridorTab === "HARBOUR") {
      return (
        r.corridorId === "HARBOUR" ||
        r.corridorId === "HARBOUR_WESTERN_CHORD" ||
        r.corridorId === "TRANS_HARBOUR"
      );
    }
    return false;
  });

  const handleActivateRoute = (route: PlayableRoute) => {
    setSelectedRouteId(route.routeId);
    onSelectRoute(route);
  };

  const handleStationClick = (station: StationWaypoint) => {
    if (onJumpToStation) {
      onJumpToStation(station.stationCode);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200 pointer-events-auto">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/90">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
              <Route className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold tracking-tight text-white flex items-center gap-2">
                <span>Mumbai Suburban Railway Network</span>
                <span className="text-[10px] font-mono uppercase bg-emerald-950 text-emerald-400 border border-emerald-700 px-2 py-0.5 rounded-full">
                  Phase 5 Operational
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Continuous track graph, verified station coordinates, and multi-corridor 3D world
              </p>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg cursor-pointer"
            aria-label="Close route selector"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Corridor Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950/50 px-5 pt-2 gap-2 overflow-x-auto">
          <button
            type="button"
            onClick={() => {
              setSelectedCorridorTab("CENTRAL");
              setSelectedRouteId("central-local-parel-sion");
            }}
            className={`px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-colors border-t border-x cursor-pointer flex items-center gap-2 ${
              selectedCorridorTab === "CENTRAL"
                ? "bg-slate-900 border-slate-700 text-amber-400 border-b-transparent -mb-px"
                : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-red-500" />
            <span>Central Line (CR)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setSelectedCorridorTab("WESTERN");
              setSelectedRouteId("western-suburban-churchgate-bandra");
            }}
            className={`px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-colors border-t border-x cursor-pointer flex items-center gap-2 ${
              selectedCorridorTab === "WESTERN"
                ? "bg-slate-900 border-slate-700 text-amber-400 border-b-transparent -mb-px"
                : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-magenta-500 bg-[#b3176f]" />
            <span>Western Line (WR)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setSelectedCorridorTab("HARBOUR");
              setSelectedRouteId("harbour-chord-csmt-mahim");
            }}
            className={`px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-colors border-t border-x cursor-pointer flex items-center gap-2 ${
              selectedCorridorTab === "HARBOUR"
                ? "bg-slate-900 border-slate-700 text-amber-400 border-b-transparent -mb-px"
                : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-teal-500" />
            <span>Harbour Line (HB)</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Active Route Selection Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {corridorRoutes.map((route) => {
              const isSelected = route.routeId === selectedRouteId;
              const isActive = route.routeId === activeRouteId;
              const is3DPlayable = Boolean(route.curvePoints && route.curvePoints.length >= 2);

              return (
                <div
                  key={route.routeId}
                  onClick={() => handleActivateRoute(route)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between gap-2.5 ${
                    isSelected
                      ? "bg-slate-800/90 border-amber-500/80 shadow-md ring-1 ring-amber-500/50"
                      : "bg-slate-950/60 border-slate-800 hover:bg-slate-800/50 hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-white tracking-wide">{route.name}</span>
                        {is3DPlayable && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-amber-950 text-amber-400 border border-amber-600">
                            FULL 3D CONTINUOUS
                          </span>
                        )}
                        {isActive && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-emerald-950 text-emerald-400 border border-emerald-600 flex items-center gap-1">
                            <Check className="w-2.5 h-2.5" /> ACTIVE
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5 font-mono">
                        {route.lineTypeLabel}
                      </p>
                    </div>

                    <span className="text-xs font-mono font-bold text-slate-300 whitespace-nowrap">
                      {route.verifiedLengthKm ? `${route.verifiedLengthKm} km` : "Verified"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/80">
                    <span className="flex items-center gap-1">
                      <Compass className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{route.directionLabel}</span>
                    </span>

                    <span className="text-[10px] text-slate-500">
                      {route.stations.length} Key Stations
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Route Specification Summary */}
          <div className="bg-slate-950/80 rounded-xl p-4 border border-slate-800/90 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Train className="w-4 h-4 text-amber-400" />
                <span>Station Navigation & Stopping Positions — {currentRoute.shortName}</span>
              </h3>
              <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono">
                <span className="flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 text-amber-400" /> {currentRoute.electrification}
                </span>
                <span>•</span>
                <span>Gauge: 1,676 mm</span>
              </div>
            </div>

            {/* Station Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 text-[10px] uppercase tracking-wider">
                    <th className="py-2 px-2.5">Code</th>
                    <th className="py-2 px-2.5">Station Name</th>
                    <th className="py-2 px-2.5">Platform</th>
                    <th className="py-2 px-2.5">Side</th>
                    <th className="py-2 px-2.5">Distance</th>
                    <th className="py-2 px-2.5">Interchange</th>
                    <th className="py-2 px-2.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {currentRoute.stations.map((st, idx) => (
                    <tr
                      key={st.stationId}
                      className="hover:bg-slate-800/40 transition-colors group"
                    >
                      <td className="py-2 px-2.5 font-bold text-amber-400">{st.stationCode}</td>
                      <td className="py-2 px-2.5">
                        <span className="font-sans font-semibold text-white">{st.name}</span>{" "}
                        <span className="text-[11px] text-slate-400 font-devanagari">
                          ({st.nameDevanagari})
                        </span>
                      </td>
                      <td className="py-2 px-2.5 text-slate-300">{st.platformNumber}</td>
                      <td className="py-2 px-2.5">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            st.platformSide === "LEFT"
                              ? "bg-cyan-950 text-cyan-300 border border-cyan-800"
                              : "bg-emerald-950 text-emerald-300 border border-emerald-800"
                          }`}
                        >
                          {st.platformSide}
                        </span>
                      </td>
                      <td className="py-2 px-2.5 tabular-nums text-slate-400">
                        {st.stopDistanceM >= 1000
                          ? `${(st.stopDistanceM / 1000).toFixed(2)} km`
                          : `${st.stopDistanceM.toFixed(0)} m`}
                      </td>
                      <td className="py-2 px-2.5 text-[11px] text-slate-400">
                        {st.interchange?.join(", ") ?? "Local Corridor"}
                      </td>
                      <td className="py-2 px-2.5 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleStationClick(st)}
                          className="h-6 px-2 text-[10px] text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 gap-1 rounded font-mono"
                          title={`Navigate EMU train to ${st.name} Platform`}
                        >
                          <MapPin className="w-3 h-3" />
                          <span>STOP HERE</span>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Corridor Intermediate Station Ribbon */}
            <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400">
              <span className="text-slate-500 uppercase tracking-widest text-[9px] font-mono block mb-1">
                Full Corridor Sequence ({currentRoute.intermediateStations.length} Stations):
              </span>
              <div className="flex flex-wrap items-center gap-1.5 font-sans">
                {currentRoute.intermediateStations.map((st, i) => (
                  <span key={st.code} className="inline-flex items-center gap-1 bg-slate-900 px-2 py-0.5 rounded border border-slate-800 text-slate-300 text-[11px]">
                    <span className="font-mono text-amber-400/90 font-bold text-[10px]">{st.code}</span>
                    <span>{st.name}</span>
                    {i < currentRoute.intermediateStations.length - 1 && (
                      <ChevronRight className="w-2.5 h-2.5 text-slate-600" />
                    )}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-slate-800 bg-slate-950/90 text-xs">
          <div className="flex items-center gap-2 text-slate-400 text-[11px]">
            <Navigation className="w-4 h-4 text-amber-400" />
            <span>
              Continuous Track Following: Broad Gauge 1676 mm · Multi-Coach Articulation
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              className="h-8 text-xs font-mono"
            >
              Cancel
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={() => {
                onSelectRoute(currentRoute);
                onClose();
              }}
              className="h-8 text-xs font-mono bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold"
            >
              Confirm Route Selection
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
