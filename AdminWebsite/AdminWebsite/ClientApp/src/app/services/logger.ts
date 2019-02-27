// Base class for loggers allowing us to easily change between console or app insights
export interface Logger {
  trackEvent(eventName: string, properties: any);
  trackException(message: string, err: Error, properties: any);
}
