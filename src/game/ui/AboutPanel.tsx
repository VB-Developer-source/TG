import { Panel } from "./Panel";

const CONTROLS: [string, string][] = [
  ["W A S D", "Fly forward, left, back, right"],
  ["Q / E", "Down / up"],
  ["Shift", "Move faster"],
  ["Drag", "Look around"],
  ["Wheel / pinch", "Dolly in and out"],
  ["Esc", "Back to menu"],
];

export function AboutPanel({ onBack }: { onBack: () => void }) {
  return (
    <Panel eyebrow="Section 01 · Foundation" title="About" onBack={onBack}>
      <div className="space-y-4 text-sm leading-relaxed text-foreground/85">
        <p>
          Mumbai Local Train Simulator recreates the city&apos;s suburban railway in the browser: broad-gauge track,
          25 kV overhead wires, island platforms and the neighbourhoods that crowd the line.
        </p>
        <p>
          This first build is the foundation: the 3D station at Dadar, the camera system, menus and settings.
          Trains, routes, signals and passengers arrive in later builds.
        </p>
        <p className="text-muted-foreground">
          Every model and texture is generated in code, so the station loads without downloads.
        </p>
      </div>
      <h3 className="eyebrow mt-6">Free camera controls</h3>
      <dl className="mt-3 divide-y divide-border rounded-md border border-border">
        {CONTROLS.map(([keys, action]) => (
          <div key={keys} className="flex items-center justify-between gap-4 px-3 py-2">
            <dt className="kbd">{keys}</dt>
            <dd className="text-right text-xs text-muted-foreground">{action}</dd>
          </div>
        ))}
      </dl>
    </Panel>
  );
}
