import { LogAdapter } from './log-adapter';
import { Injectable } from "@angular/core";

@Injectable()
export class ConsoleLogger implements LogAdapter {
  debug(message: string): void {
    console.log(`[DEBUG] ${message}`);
  }

  info(message: string): void {
    console.log(`[INFO] ${message}`);
  }

  warn(message: string): void {
    console.log(`[WARN] ${message}`);
  }

  trackEvent(eventName: string, properties: any = null) {
    const propertiesFormatted = properties ? JSON.stringify(properties) : '';
    console.log(`[EVENT:${eventName}] ${propertiesFormatted}`.trim());
  }

  trackException(message: string, err: Error, properties: any = null) {
    console.error(`[ERROR] ${message}`, err);
    if (properties) {
      console.log(`Properties: ${JSON.stringify(properties)}`);
    }
  }
}
