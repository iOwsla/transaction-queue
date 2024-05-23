type TransactionCallback<T> = () => Promise<T>;
type EventType = "start" | "success" | "error" | "end" | "drain";

interface TransactionQueueOptions {
    concurrency?: number;
    autoStart?: boolean;
    delayMs?: number;
    rateLimit?: { count: number, duration: number };
}

declare class TransactionQueue {
    constructor(options?: TransactionQueueOptions);
    enqueue<T>(transaction: TransactionCallback<T>): Promise<T>;
    on(event: EventType, listener: Function): void;
    removeListener(event: EventType, listener: Function): void;
    clear(): void;
    start(): void;
    readonly length: number;
    readonly processing: boolean;
}

export { TransactionQueue, TransactionQueueOptions, TransactionCallback, EventType };
