class Logger {
  private static instance: Logger = new Logger();
  private static logLevel: string = __APP_ENV__ === 'DEV' ? 'debug' : 'info';

  private constructor() {

  }

  private static ensureInitialized() {
    if (!this.instance) {
      this.instance = new Logger();
    }
  }

  /*private static getCallerInfo(): string {
    const e = new Error();
    const stackLines = e.stack?.split("\n") || [];
    const relevantLines = stackLines.filter(line => !line.includes('Logger.ts') && line.includes('at '));
  
    const relevantLine = relevantLines[0];
  
    if (relevantLine) {
      const match = relevantLine.match(/\((.*src\/[^:]+):(\d+):\d+\)/) || relevantLine.match(/at\s+(.*src\/[^:]+):(\d+):\d+/);
        
      if (match && match[1]) {
        const path = this.extractPath(match[1].replace(/^.*[\/\\](src[\/\\].*?)\?.*$/, '$1'));
        const line = match[2] !== undefined ? ' : ' + match[2] : '';
        return `/${path}${line}`;
      }
    }
    return '[Unknown]';
  }*/

  /*private static extractPath(url: string): string {
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('//')) {
      const parsedUrl = new URL(url);
      return parsedUrl.pathname;
    } else {
      return url;
    }
  }*/

  private static logMethod(loggerFunction: (...args: any[]) => void, method: string, color: string, message?: any, ...optionalParams: any[]): void {
    //const callerInfo = this.getCallerInfo();  [${callerInfo}]
    if (typeof message === 'object') {
      loggerFunction(`%c${method.toUpperCase()} ${new Date().toLocaleTimeString()}:`, `color: ${color};`, message, ...optionalParams);
    } else {
      loggerFunction(`%c${method.toUpperCase()} ${new Date().toLocaleTimeString()}: ${message}`, `color: ${color};`, ...optionalParams);
    }
  }

  public static info(message?: any, ...optionalParams: any[]): void {
    this.ensureInitialized();
    this.logMethod(console.log, 'info', 'blue', message, ...optionalParams);
  }

  public static warn(message?: any, ...optionalParams: any[]): void {
    this.ensureInitialized();
    this.logMethod(console.warn, 'warn', 'orange', message, ...optionalParams);
  }

  public static error(message?: any, ...optionalParams: any[]): void {
    this.ensureInitialized();
    this.logMethod(console.error, 'error', 'red', message, ...optionalParams);
  }

  public static debug(message?: any, ...optionalParams: any[]): void {
    this.ensureInitialized();
    if (this.logLevel !== 'debug') {
      return;
    }
    this.logMethod(console.log, 'debug', 'gray', message, ...optionalParams);
  }
}

export default Logger;
