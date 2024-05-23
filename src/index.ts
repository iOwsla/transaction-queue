type TransactionCallback<T> = () => Promise<T>;
type EventType = "start" | "success" | "error" | "end" | "drain";

interface TransactionQueueOptions {
    concurrency?: number;
    autoStart?: boolean;
    delayMs?: number;
    rateLimit?: { count: number, duration: number };
}

class TransactionQueue {
    private queue: TransactionCallback<any>[];
    private isProcessing: boolean;
    private concurrency: number;
    private delayMs: number;
    private rateLimit?: { count: number, duration: number };
    private eventListeners: { [event in EventType]?: Function[] };
    private processedCount: number;
    private rateLimitStartTime: number;

    constructor(options?: TransactionQueueOptions) {
        this.queue = [];
        this.isProcessing = false;
        this.concurrency = options?.concurrency || 1;
        this.delayMs = options?.delayMs || 0;
        this.rateLimit = options?.rateLimit;
        this.eventListeners = {};
        this.processedCount = 0;
        this.rateLimitStartTime = Date.now();

        if (options?.autoStart !== false) {
            this.processQueue();
        }
    }

    public async enqueue<T>(transaction: TransactionCallback<T>): Promise<T> {
        return new Promise((resolve, reject) => {
            this.queue.push(async () => {
                try {
                    const result = await transaction();
                    resolve(result);
                    return result;
                } catch (error) {
                    reject(error);
                    throw error;
                }
            });

            if (!this.isProcessing) {
                this.processQueue();
            }
        });
    }

    private async processQueue(): Promise<void> {
        if (this.isProcessing) return;

        this.isProcessing = true;
        this.emit('start');

        while (this.queue.length > 0) {
            const currentTime = Date.now();

            // Oran sınırı kontrolü
            if (this.rateLimit) {
                const elapsedTime = currentTime - this.rateLimitStartTime;
                if (elapsedTime > this.rateLimit.duration) {
                    this.processedCount = 0;
                    this.rateLimitStartTime = currentTime;
                }

                if (this.processedCount >= this.rateLimit.count) {
                    const waitTime = this.rateLimit.duration - elapsedTime;
                    await new Promise(resolve => setTimeout(resolve, waitTime));
                    this.processedCount = 0;
                    this.rateLimitStartTime = Date.now();
                }
            }

            const concurrentTransactions: Promise<any>[] = [];

            while (this.queue.length > 0 && concurrentTransactions.length < this.concurrency) {
                const transaction = this.queue.shift();
                if (transaction) {
                    concurrentTransactions.push(transaction());
                    this.processedCount++;
                }
            }

            try {
                const results = await Promise.all(concurrentTransactions);
                this.emit('success', results);
            } catch (error) {
                this.emit('error', error);
                console.error('Error processing transactions:', error);
            }

            if (this.delayMs > 0) {
                await new Promise(resolve => setTimeout(resolve, this.delayMs));
            }
        }

        this.isProcessing = false;
        this.emit('end');
        this.emit('drain');
    }

    public on(event: EventType, listener: Function): void {
        if (!this.eventListeners[event]) {
            this.eventListeners[event] = [];
        }
        this.eventListeners[event]!.push(listener);
    }

    public removeListener(event: EventType, listener: Function): void {
        const listeners = this.eventListeners[event];
        if (listeners) {
            const index = listeners.indexOf(listener);
            if (index !== -1) {
                listeners.splice(index, 1);
            }
        }
    }

    private emit(event: EventType, ...args: any[]): void {
        const listeners = this.eventListeners[event];
        if (listeners) {
            listeners.forEach(listener => listener(...args));
        }
    }

    public clear(): void {
        this.queue = [];
    }

    public start(): void {
        this.processQueue();
    }

    public get length(): number {
        return this.queue.length;
    }

    public get processing(): boolean {
        return this.isProcessing;
    }
}

export { TransactionQueue, TransactionQueueOptions, TransactionCallback, EventType };
