import { Check } from "lucide-react";
import { ROUTES, TRAINS, type RouteInfo, type SelectionStore } from "../data/catalog";
import { useObservable } from "./hooks";
import { Panel } from "./Panel";

interface SelectPanelProps {
  store: SelectionStore;
  onBack: () => void;
  onInteract: () => void;
}

const LINE_TONE: Record<RouteInfo["tone"], string> = {
  western: "bg-line-western",
  central: "bg-line-central",
  harbour: "bg-line-harbour",
  transharbour: "bg-line-transharbour",
};

function PreviewNote() {
  return (
    <p className="mb-4 rounded-md border border-border bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
      Your choice is saved for when driving opens in a later build. For now, Play opens the free camera at Dadar.
    </p>
  );
}

function SelectedMark({ selected }: { selected: boolean }) {
  if (!selected) return null;
  return (
    <span className="inline-flex items-center gap-1 font-mono text-[0.65rem] uppercase tracking-[0.14em] text-primary">
      <Check className="size-3.5" /> Selected
    </span>
  );
}

export function RouteSelect({ store, onBack, onInteract }: SelectPanelProps) {
  const selection = useObservable(store);
  return (
    <Panel eyebrow="Suburban network" title="Route select" onBack={onBack}>
      <PreviewNote />
      <div className="space-y-3" role="radiogroup" aria-label="Routes">
        {ROUTES.map((route) => {
          const selected = selection.routeId === route.id;
          return (
            <button
              key={route.id}
              type="button"
              role="radio"
              aria-checked={selected}
              data-selected={selected}
              className="option-card"
              onClick={() => {
                onInteract();
                store.update({ routeId: route.id });
              }}
            >
              <span className={`absolute inset-y-3 left-0 w-1 rounded-r ${LINE_TONE[route.tone]}`} aria-hidden />
              <span className="flex items-center justify-between gap-3">
                <span className="title-display text-2xl">{route.name}</span>
                <SelectedMark selected={selected} />
              </span>
              <span className="mt-1 block font-mono text-xs uppercase tracking-[0.1em] text-muted-foreground">
                {route.termini}
              </span>
              <span className="mt-2 block text-sm text-foreground/80">{route.description}</span>
            </button>
          );
        })}
      </div>
    </Panel>
  );
}

export function TrainSelect({ store, onBack, onInteract }: SelectPanelProps) {
  const selection = useObservable(store);
  return (
    <Panel eyebrow="Rolling stock" title="Train select" onBack={onBack}>
      <PreviewNote />
      <div className="space-y-3" role="radiogroup" aria-label="Trains">
        {TRAINS.map((train) => {
          const selected = selection.trainId === train.id;
          return (
            <button
              key={train.id}
              type="button"
              role="radio"
              aria-checked={selected}
              data-selected={selected}
              className="option-card"
              onClick={() => {
                onInteract();
                store.update({ trainId: train.id });
              }}
            >
              <span className="flex items-center justify-between gap-3">
                <span className="title-display text-2xl">{train.name}</span>
                <SelectedMark selected={selected} />
              </span>
              <span className="mt-3 flex gap-[3px]" aria-label={`${train.cars} cars`}>
                {Array.from({ length: train.cars }, (_, i) => (
                  <span
                    key={i}
                    className={`h-2 flex-1 rounded-[1px] ${i === 0 || i === train.cars - 1 ? "bg-primary" : "bg-foreground/25"}`}
                  />
                ))}
              </span>
              <span className="mt-3 block text-sm text-foreground/80">{train.description}</span>
              <span className="mt-3 flex flex-wrap gap-2">
                {train.traits.map((trait) => (
                  <span key={trait} className="hud-chip py-0.5">
                    {trait}
                  </span>
                ))}
              </span>
            </button>
          );
        })}
      </div>
    </Panel>
  );
}
