import { Logger } from '../../services/logger';

export class MockLogger implements Logger {
    warn(message: string): void {
        // Intentionally empty
    }
    debug(message: string): void {
        // Intentionally empty
    }
    info(message: string): void {
        // Intentionally empty
    }
    event(event: string, properties?: any): void {
        // Intentionally empty
    }
    error(message: string, err: Error, properties?: any): void {
        // Intentionally empty
    }
}
