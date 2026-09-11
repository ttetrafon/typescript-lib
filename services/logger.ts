export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

export class Logger {
  static #instance: Logger | undefined;
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

  private formatMsg(msg: Error | string, module?: string): string {
    let res: string;
    let stack: string | undefined = undefined;

    if (msg instanceof Error) {
      res = msg.message;
      stack = msg.stack;
    } else {
      res = msg;
    }

    const timestamp = new Date().toISOString();
    const modulePart = module ? `::${module}` : '';
    const baseMsg = `[${timestamp}${modulePart}] ${res}`;

    return stack ? `${baseMsg}\n${stack}` : baseMsg;
  }

  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[this.#logLevel];
  }

  public debug(msg: string | Error, module?: string): void {
    if (this.shouldLog('debug')) {
      console.debug(this.formatMsg(msg, module));
    }
  }

  public info(msg: string | Error, module?: string): void {
    if (this.shouldLog('info')) {
      console.info(this.formatMsg(msg, module));
    }
  }

  public warn(msg: string | Error, module?: string): void {
    if (this.shouldLog('warn')) {
      console.warn(this.formatMsg(msg, module));
    }
  }

  public error(msg: string | Error, module?: string): void {
    if (this.shouldLog('error')) {
      console.error(this.formatMsg(msg, module));
    }
  }
}
