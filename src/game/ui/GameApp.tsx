import { useCallback, useEffect, useRef, useState } from "react";
import { Game } from "../core/Game";
import { getBrowserStorage } from "../core/PersistentStore";
import { createSelectionStore, ROUTES, TRAINS, type SelectionStore } from "../data/catalog";
import { createSettingsStore, type SettingsStore } from "../settings/settings";
import { ErrorOverlay } from "./ErrorOverlay";
import { ExploreHud } from "./ExploreHud";
import { LoadingScreen } from "./LoadingScreen";
import { MainMenu, type MenuView } from "./MainMenu";
import { useObservable } from "./hooks";
import { DevInspector } from "./DevInspector";
import { STATIONS } from "../../railway/data/stations";

interface Stores {
  settings: SettingsStore;
  selection: SelectionStore;
}

/** Mounts the engine into a full-screen container and layers the UI over it. */
export function GameApp() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [stores] = useState<Stores>(() => {
    const storage = getBrowserStorage();
    return { settings: createSettingsStore(storage), selection: createSelectionStore(storage) };
  });
  const [game, setGame] = useState<Game | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const instance = new Game(container, stores.settings);
    setGame(instance);
    void instance.start();
    const unlockAudio = () => instance.audio.unlock();
    window.addEventListener("pointerdown", unlockAudio);
    window.addEventListener("keydown", unlockAudio);

    const syncTrain = () => {
      const sel = stores.selection.get();
      const train = TRAINS.find((t) => t.id === sel.trainId);
      const route = ROUTES.find((r) => r.id === sel.routeId);
      const livery = route?.tone === "central" ? "central" : route?.tone === "harbour" ? "harbour" : "western";
      instance.setTrainRake({
        cars: train ? Math.min(train.cars, 12) : 6,
        liveryId: livery,
        trackX: 6.0,
        startZ: 20,
      });
    };
    const unsubSelection = stores.selection.subscribe(syncTrain);

    return () => {
      unsubSelection();
      window.removeEventListener("pointerdown", unlockAudio);
      window.removeEventListener("keydown", unlockAudio);
      instance.dispose();
      setGame(null);
    };
  }, [stores]);

  return (
    <div className="game-root">
      <div ref={containerRef} className="game-viewport" />
      {game && <GameOverlay game={game} stores={stores} />}
    </div>
  );
}

function GameOverlay({ game, stores }: { game: Game; stores: Stores }) {
  const loading = useObservable(game.loading);
  const scene = useObservable(game.scene);
  const error = useObservable(game.error);
  const stats = useObservable(game.stats);
  const activeStationId = useObservable(game.activeStationId);
  const [isDevInspectorOpen, setIsDevInspectorOpen] = useState(false);
  const [view, setView] = useState<MenuView>("main");

  const click = useCallback(() => game.audio.click(), [game]);
  const exitExplore = useCallback(() => {
    click();
    setView("main");
    game.goTo("menu");
  }, [game, click]);

  const currentStation = STATIONS[activeStationId] ?? STATIONS["DDR"];
  const loaderVisible = !(loading.done && (scene === "menu" || scene === "explore"));

  const handleSelectStation = useCallback(
    (stationId: string) => {
      click();
      game.switchStation(stationId);
    },
    [game, click]
  );

  return (
    <>
      {scene === "menu" && (
        <MainMenu
          view={view}
          onNavigate={setView}
          onPlay={() => game.goTo("explore")}
          onInteract={click}
          settings={stores.settings}
          selection={stores.selection}
          stats={stats}
        />
      )}
      {scene === "explore" && (
        <ExploreHud
          stats={stats}
          stationName={currentStation.stationName}
          stationNameDevanagari={currentStation.stationNameDevanagari}
          onExit={exitExplore}
          onMove={(m) => game.setVirtualMove(m)}
          onToggleDevInspector={() => setIsDevInspectorOpen((v) => !v)}
          isDevInspectorOpen={isDevInspectorOpen}
        />
      )}
      {isDevInspectorOpen && (
        <DevInspector
          currentStationId={activeStationId}
          onSelectStation={handleSelectStation}
          onClose={() => setIsDevInspectorOpen(false)}
        />
      )}
      <LoadingScreen progress={loading} visible={loaderVisible && !error?.fatal} />
      {error && <ErrorOverlay error={error} onDismiss={() => game.error.set(null)} />}
    </>
  );
}

