export type LogLevel = 'debug' | 'info' | 'error';

export class Logger {
  #instance: Logger | undefined = undefined;
  #logLevel: LogLevel;
  #appName: string;

  constructor(logLevel: LogLevel, appName: string) {
    if (!this.#instance) {
      this.#instance = this;
    }

    this.#logLevel = logLevel;
    this.#appName = appName;
    return this.#instance;
  }

  formatMsg(msg: Error | string, module: string | undefined) {
    let res: string;

    if (msg instanceof Error) {
      res = msg.message;
    }
    else {
      res = msg;
    }

    return `[${new Date().toUTCString()}::${this.#appName}${module ? '::' + module : ''}] ${res}`;
  }

  async log(msg: string | Error, module: string | undefined = undefined): Promise<void> {
    if (this.#logLevel === 'error' || this.#logLevel === 'info') return;

    console.log(this.formatMsg(msg, module));
  }

  async warn(msg: string | Error, module: string | undefined = undefined): Promise<void> {
    if (this.#logLevel == 'error') return;

    console.warn(this.formatMsg(msg, module));
  }

  async error(msg: string | Error, module: string | undefined = undefined): Promise<void> {
    console.log(this.formatMsg(msg, module));
  }
}
