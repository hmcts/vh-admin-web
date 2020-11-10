// Base class for loggers allowing us to easily change between console or app insights

export abstract class Logger {
    abstract debug(message: string, properties?: any): void;
    abstract info(message: string, properties?: any): void;
    abstract warn(message: string, properties?: any): void;
    abstract event(event: string, properties?: any): void;
    abstract error(message: string, err: Error, properties?: any): void;
}
