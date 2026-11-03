/**
 * Minimal observable value. The engine publishes state through these so the
 * UI layer (React) can subscribe with useSyncExternalStore without the engine
 * knowing anything about React.
 */
export class Observable<T> {
  private listeners = new Set<() => void>();

  constructor(private value: T) {}

  get = (): T => this.value;

  set(next: T): void {
    if (Object.is(next, this.value)) return;
    this.value = next;
    this.listeners.forEach((listener) => listener());
  }

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  clearListeners(): void {
    this.listeners.clear();
  }
}
