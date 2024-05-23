type TransactionCallback<T> = () => Promise<T>;
type EventType = "start" | "success" | "error" | "end" | "drain";
interface TransactionQueueOptions {
    concurrency?: number;
    autoStart?: boolean;
    delayMs?: number;
    rateLimit?: {
        count: number;
        duration: number;
    };
}
declare class TransactionQueue {
    private queue;
    private isProcessing;
    private concurrency;
    private delayMs;
    private rateLimit?;
    private eventListeners;
    private processedCount;
    private rateLimitStartTime;
    constructor(options?: TransactionQueueOptions);
    enqueue<T>(transaction: TransactionCallback<T>): Promise<T>;
    private processQueue;
    on(event: EventType, listener: Function): void;
    removeListener(event: EventType, listener: Function): void;
    private emit;
    clear(): void;
    start(): void;
    get length(): number;
    get processing(): boolean;
}
export { TransactionQueue, TransactionQueueOptions, TransactionCallback, EventType };
