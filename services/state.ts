import { cloneDeep } from "lodash";
import { Logger } from "./logger";
import { ObservableEntry, BroadcastMessage } from "lib/types";
import { generalNamesLib } from "lib/data/enum";

export class State {
  static #instance: State;
  #logger: Logger;

  private appName: string;
  private stateInitiatedAt: number;
  private requestedState: boolean = false;

  private observables: Record<string, ObservableEntry> = {};
  private observablesBroadcastChannel: BroadcastChannel;

  private constructor(appName: string) {
    this.#logger = Logger.getInstance();

    this.appName = appName;
    this.stateInitiatedAt = new Date().valueOf();

    this.observablesBroadcastChannel = new BroadcastChannel(this.appName);
    this.observablesBroadcastChannel.onmessage = (event) => {
      this.receiveBroadcastedMessage(event);
    }

    this.requestedState = true;
    this.broadcastMessage({
      type: "request-state",
      time: this.stateInitiatedAt,
      name: "state",
      data: {}
    });
    this.collectState();
  }

  public static getInstance(appName: string): State {
    return this.#instance ??= new State(appName);
  }

  private collectState(): Record<string, unknown> {
    this.#logger.debug(`---> State.collectState()`);
    let state: Record<string, unknown> = {};
    let keys = Object.keys(this.observables);
    for (let i = 0; i < keys.length; i++) {
      state[keys[i]] = cloneDeep(this.observables[keys[i]].proxy);
    }
    return state;
  }

  async broadcastMessage(msg: BroadcastMessage) {
    this.#logger.debug(`---> State.broadcastMessage()`, msg);
    this.observablesBroadcastChannel.postMessage(JSON.stringify(msg));
  }

  createObservable(observable: string, obj: object, broadcastCreation = true) {
    this.#logger.debug(`---> State.createObservable()`, observable, obj, broadcastCreation);
    let onChange = (property: string, newValue: object | undefined) => {
      this.#logger.debug(`Property '${property}' changed to ${JSON.stringify(newValue)} ... calling subscribers!:`, this.observables[observable].listeners);
      Object.keys(this.observables[observable].listeners).forEach(subscriber => {
        console.log("... calling subscriber:", subscriber, this.observables[observable].listeners[subscriber]);
        this.observables[observable].listeners[subscriber](subscriber, property, newValue)
      });
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

    this.observables[observable] = {
      proxy: proxy,
      listeners: {}
    }

    if (broadcastCreation) this.broadcastMessage({
      type: 'create-observable',
      name: observable,
      data: obj,
      time: new Date().getTime(),
    });

    this.#logger.debug("... observables:", this.observables);
  }

  async getObservable(observable: string): Promise<unknown> {
    this.#logger.debug(`---> State.getObservable(${observable})`);
    if (Object.prototype.hasOwnProperty.call(this.observables, observable)) {
      return cloneDeep(this.observables[observable].proxy);
    } else {
      return {};
    }
  }

  async getValueFromObservable(observable: string, prop: string, retry: number = 0): Promise<unknown> {
    this.#logger.debug(`---> State.getValueFromObservable(${observable}, ${prop})`);

    if (Object.prototype.hasOwnProperty.call(this.observables, observable)) {
      console.log("... getting value", this.observables[observable].proxy[prop]);
      let value = this.observables[observable].proxy[prop];
      return cloneDeep(value);
    }

    if (retry < 10) {
      await new Promise<void>((resolve) => setTimeout(resolve, 1000));
      return this.getValueFromObservable(observable, prop, retry + 1);
    }

    return null;
  }

  async receiveBroadcastedMessage(event: MessageEvent) {
    this.#logger.debug(`---> receiveBroadcastedMessage()`, event);
    let msg = JSON.parse(event.data) as BroadcastMessage;

    console.log("msg:", msg);
    switch (msg.type) {
      case generalNamesLib.BROADCAST_TYPE_REQUEST_STATE.description: {
        // if the request is from an older page, ignore it
        if (msg.time < this.stateInitiatedAt) return;

        // then collect all state data and send them!
        this.broadcastMessage({
          type: "receive-state",
          name: "state",
          data: this.collectState(),
          time: new Date().getTime(),
        });
        break;
      }
      case generalNamesLib.BROADCAST_TYPE_RECEIVE_STATE.description: {
        if (!this.requestedState) return;

        this.requestedState = false;
        let keys: string[] = Object.keys(msg.data);

        for (let i = 0; i < keys.length; i++) {
          let key: string = keys[i];
          let data = (msg.data as Record<string, any>)[key];

          if (Object.prototype.hasOwnProperty.call(this.observables, key)) {
            let props = Object.keys(data);
            for (let j = 0; j < props.length; j++) {
              let prop = props[j];
              this.updateObservable(key, prop, data[prop], false);
            }
          }
          else {
            this.createObservable(key, data, false);
          }
        }
        break;
      }
      case generalNamesLib.BROADCAST_TYPE_CREATE_OBSERVABLE.description:
        this.createObservable(msg.name, msg.data, false);
        break;
      case generalNamesLib.BROADCAST_TYPE_UPDATE_OBSERVABLE.description:
        if (msg.prop) this.updateObservable(msg.name, msg.prop, msg.data, false);
        break;
    }
  }

  async subscribeToObservable(observable: string, subscriber: string, callback: (subscriber: string, property: string, newValue: unknown) => void, retry: number = 0) {
    this.#logger.debug(`---> subscribeToObservable(${observable}, ${subscriber})`);
    if (Object.prototype.hasOwnProperty.call(this.observables, observable) && !Object.prototype.hasOwnProperty.call(this.observables[observable].listeners, subscriber)) {
      this.observables[observable].listeners[subscriber] = callback;
    }
    else {
      // Try again because initial state may not be here yet and we will miss the subscriber...
      if (retry < 10) {
        setTimeout(async () => {
          return await this.subscribeToObservable(observable, subscriber, callback, retry + 1);
        }, 1000);
      }
    }
    this.#logger.debug(`... this.observables[${observable}]:`, this.observables[observable]);
  }

  async unsubscribeFromObservable(observable: string, subscriber: string) {
    if (Object.prototype.hasOwnProperty.call(this.observables, observable) && Object.prototype.hasOwnProperty.call(this.observables[observable].listeners, subscriber)) {
      delete this.observables[observable].listeners[subscriber];
    }
  }

  async updateObservable(observable: string, prop: string, value: any, broadcastChange = true) {
    this.#logger.debug(`---> State.updateObservable(${observable}, ${prop})`, value);
    if (Object.prototype.hasOwnProperty.call(this.observables, observable)) {
      this.observables[observable].proxy[prop] = value;

      if (broadcastChange) this.broadcastMessage({
        type: "update-observable",
        name: observable,
        prop: prop,
        data: value,
        time: new Date().getTime(),
      });
    }
    this.#logger.debug(`... this.observables:`, this.observables);
  }
}
