import { Logger } from '../../services/logger';

export class MockLogger implements Logger {
    warn(message: string): void {}
    debug(message: string): void {}
    info(message: string): void {}
    event(event: string, properties?: any): void {}
    error(message: string, err: Error, properties?: any): void {}
}
