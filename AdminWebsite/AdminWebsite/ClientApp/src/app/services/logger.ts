// Base class for loggers allowing us to easily change between console or app insights
//export interface Logger {
//  debug(message: string): void;
//  info(message: string): void;
//  warn(message: string): void;
//  trackEvent(eventName: string, properties: any);
//  trackException(message: string, err: Error, properties: any);
//}
export abstract class Logger {
  abstract debug(message: string): void;
  abstract info(message: string): void;
  abstract warn(message: string): void;
  abstract event(event: string, properties?: any): void;
  abstract error(message: string, err: Error, properties?: any): void;
}
