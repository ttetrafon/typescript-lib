export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

export class Logger {
  static #instance: Logger;
  #logLevel: LogLevel;

  private constructor(logLevel: LogLevel) {
    this.#logLevel = logLevel;
  }

  public static getInstance(): Logger {
    if (!Logger.#instance) {
      Logger.#instance = new Logger('info');
    }

    return Logger.#instance;
  }

  public setLevel(level: LogLevel): void {
    this.#logLevel = level;
  }

  private formatMsg(...msgs: unknown[]): unknown[] {
    const timestamp = new Date().toISOString();
    const baseMsg = `[${timestamp}]`;
    let res: unknown[] = [baseMsg];

    for (let i = 0; i < msgs.length; i++) {
      let msg: unknown = msgs[i];

      if (msg instanceof Error) {
        res.push("Error message:", msg.name);
        res.push("Error message:", msg.message);
        if (msg.cause) res.push("Error cause:", msg.cause);
        if (msg.stack) res.push("Error stack:", msg.stack);
      }
      else {
        res.push(msg);
      }
    }

    return res;
  }

  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[this.#logLevel];
  }

  public debug(...msgs: unknown[]): void {
    if (this.shouldLog('debug')) {
      console.debug(...this.formatMsg(...msgs));
    }
  }

  public info(...msgs: unknown[]): void {
    if (this.shouldLog('info')) {
      console.info(...this.formatMsg(...msgs));
    }
  }

  public warn(...msgs: unknown[]): void {
    if (this.shouldLog('warn')) {
      console.warn(...this.formatMsg(...msgs));
    }
  }

  public error(...msgs: unknown[]): void {
    if (this.shouldLog('error')) {
      console.error(...this.formatMsg(...msgs));
    }
  }
}
