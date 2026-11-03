import { ROUTES, TRAINS, type SelectionStore } from "../data/catalog";
import type { FrameStats } from "../core/Game";
import type { SettingsStore } from "../settings/settings";
import { useMumbaiClock, useObservable } from "./hooks";
import { AboutPanel } from "./AboutPanel";
import { RouteSelect, TrainSelect } from "./SelectPanels";
import { SettingsMenu } from "./SettingsMenu";

export type MenuView = "main" | "routes" | "trains" | "settings" | "about";

interface MainMenuProps {
  view: MenuView;
  onNavigate: (view: MenuView) => void;
  onPlay: () => void;
  onInteract: () => void;
  settings: SettingsStore;
  selection: SelectionStore;
  stats: FrameStats;
}

export function MainMenu({ view, onNavigate, onPlay, onInteract, settings, selection, stats }: MainMenuProps) {
  const chosen = useObservable(selection);
  const clock = useMumbaiClock();
  const route = ROUTES.find((r) => r.id === chosen.routeId);
  const train = TRAINS.find((t) => t.id === chosen.trainId);
  const back = () => {
    onInteract();
    onNavigate("main");
  };

  const items: { id: MenuView | "play"; label: string; meta: string; action: () => void }[] = [
    { id: "play", label: "Play", meta: "Free camera · Dadar", action: onPlay },
    { id: "routes", label: "Route select", meta: route?.name ?? "", action: () => onNavigate("routes") },
    { id: "trains", label: "Train select", meta: train?.name ?? "", action: () => onNavigate("trains") },
    { id: "settings", label: "Settings", meta: "Graphics · Sound · Camera", action: () => onNavigate("settings") },
    { id: "about", label: "About", meta: "Section 01 build", action: () => onNavigate("about") },
  ];

  return (
    <div className="absolute inset-0 z-20">
      <div className="vignette pointer-events-none absolute inset-0" aria-hidden />
      <div className="scrim-menu pointer-events-none absolute inset-0" aria-hidden />
      <div className="scrim-bottom pointer-events-none absolute inset-x-0 bottom-0 h-40" aria-hidden />

      <div className="relative flex h-full flex-col px-6 pb-5 pt-8 sm:px-10 md:px-14 md:pt-12">
        <div className="flex min-h-0 flex-1 flex-col gap-8 md:flex-row md:items-stretch md:justify-between">
          <div
            className={`flex flex-col ${view === "main" ? "" : "hidden md:flex md:opacity-60"} transition-opacity duration-300`}
          >
            <header className="fade-up">
              <div className="flex items-center gap-3">
                <span className="signal-lamp" aria-hidden />
                <p className="eyebrow">Dadar · Island platform 2 / 3</p>
              </div>
              <h1 className="title-display mt-4 text-[clamp(3.5rem,9vw,7.5rem)]">
                Mumbai Local
                <span className="block text-primary">Train Simulator</span>
              </h1>
              <p className="mt-4 max-w-sm text-base text-foreground/80">Experience the lifeline of Mumbai.</p>
            </header>

            <nav className="stagger mt-8 flex max-w-md flex-col md:mt-12" aria-label="Main menu">
              {items.map((item, index) => (
                <button
                  key={item.id}
                  type="button"
                  className="menu-item"
                  data-active={view === item.id}
                  onClick={() => {
                    onInteract();
                    item.action();
                  }}
                >
                  <span className="menu-item-index">{String(index + 1).padStart(2, "0")}</span>
                  <span className="menu-item-label">{item.label}</span>
                  <span className="menu-item-meta hidden sm:inline">{item.meta}</span>
                </button>
              ))}
            </nav>
          </div>

          {view !== "main" && (
            <div className="flex min-h-0 flex-1 items-start justify-end md:items-center">
              {view === "settings" && <SettingsMenu store={settings} onBack={back} onInteract={onInteract} />}
              {view === "routes" && <RouteSelect store={selection} onBack={back} onInteract={onInteract} />}
              {view === "trains" && <TrainSelect store={selection} onBack={back} onInteract={onInteract} />}
              {view === "about" && <AboutPanel onBack={back} />}
            </div>
          )}
        </div>

        <footer className="relative mt-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="hud-chip">
              <span className="h-2 w-2 rounded-full bg-primary" aria-hidden /> Section 01 · Foundation
            </span>
            <span className="hud-chip hidden sm:inline-flex">{route?.termini}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="hud-chip tabular-nums">{stats.fps || "--"} fps</span>
            <span className="hud-chip tabular-nums" aria-label="Mumbai time">
              IST {clock}
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
}
