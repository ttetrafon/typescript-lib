import { cloneDeep } from "lodash";
import { Listener } from "lib/types";

export class Observable {
  private name: string;
  private value: any;
  // TODO: listeners should listen for specific keys maybe, so not all updates propagate everywhere, and also components can have multiple listeners for specific properties set...
  private listeners: Record<string, Set<Listener>>;

  constructor(name: string, value: any) {
    this.name = name;
    this.value = value;
    this.listeners = {};
  }

  get(path?: string): any {
    let v: any = this.value;
    if (!path) return cloneDeep(v);

    if (path !== this.name) {
      const parts: string[] = path.split(".");
      for (let i = 1; i < parts.length; i++) {
        if (v === null || v === undefined) {
          throw new Error(`Cannot read property '${parts[i]}' of ${v}`);
        }
        if (typeof v !== 'object' || v === null) {
          throw new Error(`Cannot read property '${parts[i]}' of ${typeof v}`);
        }
        v = (v as Record<string, any>)[parts[i]];
      }
    }
    return cloneDeep(v);
  }

  set(path: string, value: any) {
    if (path === this.name || !path) {
      this.value = value;
      this.notifyListeners(this.name);
      return;
    }

    const parts: string[] = path.split(".");
    const l: number = parts.length;
    let wrapper: any = this.value;
    for (let i = 2; i < l - 1; i++) {
      if (wrapper === null || wrapper === undefined) {
        throw new Error(`Cannot read property '${parts[i]}' of ${wrapper}`);
      }
      if (typeof wrapper !== 'object' || wrapper === null) {
        throw new Error(`Cannot read property '${parts[i]}' of ${typeof wrapper}`);
      }
      wrapper = (wrapper as Record<string, any>)[parts[i]];
    }
    wrapper[parts[1]] = value;
  }

  async subscribe(subscriber: string, listener: Listener) {
    if (!this.listeners.hasOwnProperty(subscriber)) {
      this.listeners[subscriber] = new Set();
    }
    this.listeners[subscriber].add(listener);
  }

  async unsubscribe(subscriber: string, listener: Listener) {
    this.listeners[subscriber]?.delete(listener);
  }

  private notifyListeners(path: string) {
    // get the actual value
    const v: any = this.get(path);
    // notify subscribers
    for (const [sub, listeners] of Object.entries(this.listeners)) {
      listeners.forEach(l => l(sub, path, v));
    }
  }
}
