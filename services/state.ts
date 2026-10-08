import { cloneDeep } from "lodash";
import { Logger } from "./logger";
import { BroadcastMessage, Listener } from "lib/types";
import { Observable } from "lib/wrappers/Observable";

export class State {
  static #instance: State;
  #logger: Logger;

  private appName: string;
  private stateInitiatedAt: number;
  private requestedState: boolean = false;

  private observables: Record<string, Observable> = {};
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
      data: null
    });
  }

  public static getInstance(appName: string): State {
    return this.#instance ??= new State(appName);
  }

  private collectState(): Record<string, any> {
    this.#logger.debug(`---> State.collectState()`);
    let state: Record<string, any> = {};
    let keys = Object.keys(this.observables);
    for (let i = 0; i < keys.length; i++) {
      state[keys[i]] = cloneDeep(this.observables[keys[i]].get(keys[i]));
    }
    return state;
  }

  private async broadcastMessage(msg: BroadcastMessage) {
    this.#logger.debug(`---> State.broadcastMessage()`, msg);
    this.observablesBroadcastChannel.postMessage(msg);
  }

  /**
   * Create a new observable
   * @param {string} observable: the observable's name
   * @param {any} value: the observable's value
   * @param {boolean} broadcastCreation: if this is to be broadcast within the browser (using the broadcast channel API); default=true
   */
  createObservable(observable: string, value: any, broadcastCreation: boolean = true) {
    this.#logger.debug(`---> State.createObservable()`, observable, value, broadcastCreation);

    if (this.observables.hasOwnProperty(observable)) {
      // throw new EvalError(`Observable ${observable} already exists and should not be created multiple times; did you mean to update it?`);
      console.log("... observables", this.observables);
      return;
    }

    this.observables[observable] = new Observable(observable, value);

    if (broadcastCreation) this.broadcastMessage({
      type: 'create-observable',
      name: observable,
      data: value,
      time: new Date().getTime(),
    });

    this.#logger.debug("... observables:", this.observables);
  }

  /**
   * Get an observable or a specific property value from it.
   * @param {string} path: the name of the observable object, including a possible required path; e.g: "user", "user.username", "game-system.checks.difficulty", etc
   * @param {number} retry: for internal, recursive usage, in case the initial state is not yet here; default = 0
   * @returns
   */
  async getValueFromObservable<T>(path: string, retry: number = 0): Promise<T | null> {
    this.#logger.debug(`---> State.getValueFromObservable(${path})`);
    const dot: number = path.indexOf(".");
    const observable: string = dot < 0 ? path : path.substring(0, dot);

    const obs: Observable = this.observables[observable];
    console.log("observable:", observable, obs);
    if (obs) {
      return obs.get(path);
    }

    if (retry < 10) {
      await new Promise<void>((resolve) => setTimeout(resolve, 1000));
      return this.getValueFromObservable(path, retry + 1);
    }

    return null;
  }

  private async receiveBroadcastedMessage(event: MessageEvent) {
    this.#logger.debug(`---> receiveBroadcastedMessage()`, event);
    let msg = event.data as BroadcastMessage;

    console.log("msg:", msg);
    switch (msg.type) {
      case "request-state": {
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
      case "receive-state": {
        if (!this.requestedState) return;

        this.requestedState = false;
        let keys: string[] = Object.keys(msg.data);

        for (let i = 0; i < keys.length; i++) {
          let key: string = keys[i];

          if (Object.prototype.hasOwnProperty.call(this.observables, key)) {
            this.updateObservable(key, msg.data[key], false);
          }
          else {
            this.createObservable(key, msg.data[key], false);
          }
        }
        break;
      }
      case "create-observable": {
        this.createObservable(msg.name, msg.data, false);
        break;
      }
      case "update-observable": {
        this.updateObservable(msg.name, msg.data, false);
        break;
      }
    }
  }

  /**
   * Subscribe to an observable and be notified of value changes.
   * @param {string} observable: the name of the observable
   * @param {string} subscriber: the name of the
   * @param {function} callback: to be called when the observable is updated - don't forget to use .bind(this)
   * @param {number} retry: for internal, recursive usage, in case the initial state is not yet here
   */
  async subscribeToObservable(observable: string, subscriber: string, listeners: Record<string, Listener>, retry: number = 0) {
    this.#logger.debug(`---> subscribeToObservable(${observable}, ${subscriber})`);
    const obs: Observable = this.observables[observable];
    if (obs) {
      obs.subscribe(subscriber, listeners);
      return;
    }

    if (retry < 10) {
      setTimeout(async () => {
        return await this.subscribeToObservable(observable, subscriber, listeners, retry + 1);
      }, 1000);
    }
    this.#logger.debug(`... this.observables[${observable}]:`, this.observables[observable]);
  }

  /**
   * Unsubscribe a specific listener from an observable.
   * @param {string} observable: the observable's name
   * @param {string} subscriber: the subscriber's name
   */
  async unsubscribeFromObservable(observable: string, subscriber: string, listeners?: string[]) {
    this.#logger.debug(`---> unsubscribeFromObservable(${observable}, ${subscriber})`);
    const obs: Observable = this.observables[observable];
    if (obs) {
      obs.unsubscribe(subscriber, listeners);
    }
  }

  /**
   * Update an observable or some specific property within it.
   * @param {string} path: the name of the observable object, including a possible required path; e.g: "user", "user.username", "game-system.checks.difficulty", etc
   * @param {any} value: the updated value
   * @param {boolean} broadcastChange: if this is to be broadcast within the browser (using the broadcast channel API); default=true
   */
  async updateObservable(path: string, value: any, broadcastChange: boolean = true) {
    this.#logger.debug(`---> State.updateObservable(${path}`, value);
    const dot: number = path.indexOf(".");
    const observable: string = dot < 0 ? path : path.substring(0, dot);

    const obs: Observable = this.observables[observable];
    if (obs) {
      obs.set(path, value);
    }
    this.#logger.debug(`... this.observables[${observable}] updated:`, this.observables[observable]);

    if (broadcastChange) this.broadcastMessage({
      type: "update-observable",
      name: path,
      data: value,
      time: new Date().getTime(),
    });
  }
}
