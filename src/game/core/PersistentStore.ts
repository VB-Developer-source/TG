import { Observable } from "./Observable";

/** The subset of the Web Storage API the stores need (easy to fake in tests). */
export interface KeyValueStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

/** Returns window.localStorage when it is usable (private modes can throw). */
export function getBrowserStorage(): KeyValueStorage | null {
  try {
    if (typeof window === "undefined") return null;
    const storage = window.localStorage;
    const probe = "__mls_probe__";
    storage.setItem(probe, "1");
    storage.removeItem(probe);
    return storage;
  } catch {
    return null;
  }
}

/**
 * An observable value persisted as JSON. Every write is sanitized, so a
 * corrupted or outdated stored value can never reach the game.
 */
export class PersistentStore<T extends object> extends Observable<T> {
  constructor(
    private readonly storage: KeyValueStorage | null,
    private readonly key: string,
    private readonly sanitize: (raw: unknown) => T,
    private readonly defaults: T,
  ) {
    super(PersistentStore.read(storage, key, sanitize, defaults));
  }

  private static read<V>(
    storage: KeyValueStorage | null,
    key: string,
    sanitize: (raw: unknown) => V,
    defaults: V,
  ): V {
    if (!storage) return sanitize(defaults);
    try {
      const raw = storage.getItem(key);
      if (raw === null) return sanitize(defaults);
      return sanitize(JSON.parse(raw));
    } catch {
      return sanitize(defaults);
    }
  }

  update(patch: Partial<T>): void {
    this.set(this.sanitize({ ...this.get(), ...patch }));
    this.persist();
  }

  reset(): void {
    this.set(this.sanitize({ ...this.defaults }));
    try {
      this.storage?.removeItem(this.key);
    } catch {
      /* storage unavailable: in-memory value still resets */
    }
  }

  private persist(): void {
    try {
      this.storage?.setItem(this.key, JSON.stringify(this.get()));
    } catch {
      /* quota or privacy mode: keep the in-memory value */
    }
  }
}
