import { cloneDeep } from "lodash";
import { Logger } from "./logger";

type ObservableEntry = {
  proxy: Record<string, object>;
  listeners: Record<string, (subscriber: string, property: string, newValue: object | undefined) => void>;
};

export type BroadcastMessageType = 'create-observable' | 'receive-state' | 'request-state' | 'update-observable';
export type BroadcastMessage = {
  type: BroadcastMessageType;
  name: string,
  data: object
}

export class State {
  static #instance: State;
  #logger: Logger;

  #appName: string;
  #pageRunAt: number;

  #observables: Record<string, ObservableEntry> = {};
  #observablesBroadcastChannel: BroadcastChannel;

  private constructor(appName: string) {
    this.#logger = Logger.getInstance();

    this.#appName = appName;
    this.#pageRunAt = new Date().valueOf();

    this.#observablesBroadcastChannel = new BroadcastChannel(this.#appName);
  }

  public static getInstance(appName: string): State {
    if (!State.#instance) {
      State.#instance = new State(appName);
    }

    return State.#instance;
  }

  private collectState(): Record<string, unknown> {
    this.#logger.debug(`---> collectState()`);
    let state: Record<string, unknown> = {};
    let keys = Object.keys(this.#observables);
    for (let i = 0; i < keys.length; i++) {
      state[keys[i]] = cloneDeep(this.#observables[keys[i]].proxy);
    }
    return state;
  }

  async broadcastMessage(msg: BroadcastMessage) {
    this.#observablesBroadcastChannel.postMessage(JSON.stringify(msg));
  }

  createObservable(observable: string, obj: object, broadcastCreation = true) {
    let onChange = (property: string, newValue: object | undefined) => {
      this.#logger.debug(`Property '${property}' changed to ${JSON.stringify(newValue)} ... calling subscribers!`);
      Object.keys(this.#observables[observable].listeners).forEach(subscriber =>
        this.#observables[observable].listeners[subscriber](subscriber, property, newValue)
      );
    };

    let proxy = new Proxy(obj as Record<string, any>, {
      get(target, prop, receiver) {
        const value = target[prop as string];
        if (value instanceof Function) {
          return function (...args: unknown[]) {
            return value.apply(State.#instance === receiver ? target : State.#instance, args);
          };
        }
        return value;
      },
      set(target, prop, value, receiver) {
        if (target[prop as string] !== value) {
          onChange(prop as string, value);
        }
        return Reflect.set(target, prop, value, receiver);
      },
      deleteProperty(target, prop) {
        onChange(prop as string, undefined);
        return Reflect.deleteProperty(target, prop);
      }
    });

    this.#observables[observable] = {
      proxy: proxy,
      listeners: {}
    }

    if (broadcastCreation) this.broadcastMessage({
      type: 'create-observable',
      name: observable,
      data: obj
    });
  }
}
