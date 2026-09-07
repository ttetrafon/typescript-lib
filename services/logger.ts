class Logger {
  _instance: Logger | undefined = undefined;

  constructor() {
    if (!this._instance) {
      this._instance = this;
    }
    return this._instance;
  }
}
