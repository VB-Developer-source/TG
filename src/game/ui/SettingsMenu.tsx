import { useState, type ReactNode } from "react";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { GRAPHICS_QUALITIES, SENSITIVITY_RANGE, type SettingsStore } from "../settings/settings";
import { useFullscreen, useObservable } from "./hooks";
import { Panel } from "./Panel";

interface SettingsMenuProps {
  store: SettingsStore;
  onBack: () => void;
  onInteract: () => void;
}

function Row({ label, hint, htmlFor, children }: { label: string; hint: string; htmlFor?: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-6 border-b border-border py-4 last:border-b-0">
      <div className="min-w-0">
        <label htmlFor={htmlFor} className="text-sm font-medium text-foreground">
          {label}
        </label>
        <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

const QUALITY_HINT: Record<string, string> = {
  low: "Lower resolution and short view distance",
  medium: "Balanced for laptops and phones",
  high: "Sharpest shadows and longest view distance",
};

export function SettingsMenu({ store, onBack, onInteract }: SettingsMenuProps) {
  const settings = useObservable(store);
  const { isFullscreen, supported, setFullscreen } = useFullscreen();
  const [resetNotice, setResetNotice] = useState(false);

  const update: SettingsStore["update"] = (patch) => {
    onInteract();
    setResetNotice(false);
    store.update(patch);
  };

  return (
    <Panel
      eyebrow="Configuration"
      title="Settings"
      onBack={onBack}
      footer={
        <div className="flex items-center justify-between gap-4">
          <p className="font-mono text-[0.65rem] uppercase tracking-[0.14em] text-muted-foreground" aria-live="polite">
            {resetNotice ? "Defaults restored" : "Saved on this device"}
          </p>
          <Button
            variant="rail"
            size="sm"
            onClick={() => {
              onInteract();
              store.reset();
              setResetNotice(true);
            }}
          >
            <RotateCcw /> Reset settings
          </Button>
        </div>
      }
    >
      <div className="pb-4">
        <p className="text-sm font-medium text-foreground" id="quality-label">
          Graphics quality
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">{QUALITY_HINT[settings.quality]}</p>
        <div className="segmented mt-3" role="radiogroup" aria-labelledby="quality-label">
          {GRAPHICS_QUALITIES.map((quality) => (
            <button
              key={quality}
              type="button"
              role="radio"
              aria-checked={settings.quality === quality}
              data-selected={settings.quality === quality}
              className="segmented-option"
              onClick={() => update({ quality })}
            >
              {quality}
            </button>
          ))}
        </div>
      </div>

      <div className="border-t border-border">
        <Row label="Shadows" hint="Sun shadows from canopy, masts and trees" htmlFor="setting-shadows">
          <Switch id="setting-shadows" checked={settings.shadows} onCheckedChange={(shadows) => update({ shadows })} />
        </Row>
        <Row label="Sound" hint="Menu sounds and station ambience" htmlFor="setting-sound">
          <Switch id="setting-sound" checked={settings.sound} onCheckedChange={(sound) => update({ sound })} />
        </Row>
        <Row
          label="Fullscreen"
          hint={supported ? "Hide the browser interface" : "Not supported by this browser"}
          htmlFor="setting-fullscreen"
        >
          <Switch
            id="setting-fullscreen"
            checked={isFullscreen}
            disabled={!supported}
            onCheckedChange={(on) => {
              onInteract();
              void setFullscreen(on);
            }}
          />
        </Row>
        <div className="py-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground" id="sensitivity-label">
              Camera sensitivity
            </span>
            <span className="font-mono text-sm tabular-nums text-primary">{settings.cameraSensitivity.toFixed(1)}×</span>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">Look speed when dragging in free camera</p>
          <Slider
            className="mt-4"
            aria-labelledby="sensitivity-label"
            min={SENSITIVITY_RANGE.min}
            max={SENSITIVITY_RANGE.max}
            step={SENSITIVITY_RANGE.step}
            value={[settings.cameraSensitivity]}
            onValueChange={([cameraSensitivity]) => {
              if (cameraSensitivity !== undefined) update({ cameraSensitivity });
            }}
          />
        </div>
      </div>
    </Panel>
  );
}
