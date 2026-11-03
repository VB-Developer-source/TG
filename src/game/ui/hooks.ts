import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import type { Observable } from "../core/Observable";

export function useObservable<T>(observable: Observable<T>): T {
  return useSyncExternalStore(observable.subscribe, observable.get, observable.get);
}

export function useFullscreen() {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    setSupported(Boolean(document.fullscreenEnabled));
    const sync = () => setIsFullscreen(Boolean(document.fullscreenElement));
    sync();
    document.addEventListener("fullscreenchange", sync);
    return () => document.removeEventListener("fullscreenchange", sync);
  }, []);

  const setFullscreen = useCallback(async (on: boolean) => {
    try {
      if (on && !document.fullscreenElement) await document.documentElement.requestFullscreen();
      if (!on && document.fullscreenElement) await document.exitFullscreen();
    } catch {
      /* the browser refused (not triggered by a user gesture, or blocked by policy) */
    }
  }, []);

  return { isFullscreen, supported, setFullscreen };
}

/** Indian Standard Time clock, updated every second. */
export function useMumbaiClock(): string {
  const [time, setTime] = useState("");
  useEffect(() => {
    const format = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Kolkata",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
    const tick = () => setTime(format.format(new Date()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return time;
}

export function useEscape(handler: () => void, enabled = true): void {
  useEffect(() => {
    if (!enabled) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") handler();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handler, enabled]);
}
