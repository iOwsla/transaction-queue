"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionQueue = void 0;
class TransactionQueue {
    constructor(options) {
        this.queue = [];
        this.isProcessing = false;
        this.concurrency = (options === null || options === void 0 ? void 0 : options.concurrency) || 1;
        this.delayMs = (options === null || options === void 0 ? void 0 : options.delayMs) || 0;
        this.rateLimit = options === null || options === void 0 ? void 0 : options.rateLimit;
        this.eventListeners = {};
        this.processedCount = 0;
        this.rateLimitStartTime = Date.now();
        if ((options === null || options === void 0 ? void 0 : options.autoStart) !== false) {
            this.processQueue();
        }
    }
    enqueue(transaction) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                this.queue.push(() => __awaiter(this, void 0, void 0, function* () {
                    try {
                        const result = yield transaction();
                        resolve(result);
                        return result;
                    }
                    catch (error) {
                        reject(error);
                        throw error;
                    }
                }));
                if (!this.isProcessing) {
                    this.processQueue();
                }
            });
        });
    }
    processQueue() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.isProcessing)
                return;
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
                        yield new Promise(resolve => setTimeout(resolve, waitTime));
                        this.processedCount = 0;
                        this.rateLimitStartTime = Date.now();
                    }
                }
                const concurrentTransactions = [];
                while (this.queue.length > 0 && concurrentTransactions.length < this.concurrency) {
                    const transaction = this.queue.shift();
                    if (transaction) {
                        concurrentTransactions.push(transaction());
                        this.processedCount++;
                    }
                }
                try {
                    const results = yield Promise.all(concurrentTransactions);
                    this.emit('success', results);
                }
                catch (error) {
                    this.emit('error', error);
                    console.error('Error processing transactions:', error);
                }
                if (this.delayMs > 0) {
                    yield new Promise(resolve => setTimeout(resolve, this.delayMs));
                }
            }
            this.isProcessing = false;
            this.emit('end');
            this.emit('drain');
        });
    }
    on(event, listener) {
        if (!this.eventListeners[event]) {
            this.eventListeners[event] = [];
        }
        this.eventListeners[event].push(listener);
    }
    removeListener(event, listener) {
        const listeners = this.eventListeners[event];
        if (listeners) {
            const index = listeners.indexOf(listener);
            if (index !== -1) {
                listeners.splice(index, 1);
            }
        }
    }
    emit(event, ...args) {
        const listeners = this.eventListeners[event];
        if (listeners) {
            listeners.forEach(listener => listener(...args));
        }
    }
    clear() {
        this.queue = [];
    }
    start() {
        this.processQueue();
    }
    get length() {
        return this.queue.length;
    }
    get processing() {
        return this.isProcessing;
    }
}
exports.TransactionQueue = TransactionQueue;
