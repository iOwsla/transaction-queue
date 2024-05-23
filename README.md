# TransactionQueue

TransactionQueue is a TypeScript library that provides a flexible and easy-to-use queue system for handling asynchronous transactions with concurrency control and rate limiting.

## Features

- **Concurrency Control**: Manage how many transactions are processed concurrently.
- **Rate Limiting**: Limit the number of transactions processed within a specific time frame to avoid hitting API rate limits.
- **Event Listeners**: Listen to different events such as `start`, `success`, `error`, `end`, and `drain` for better control over the transaction flow.
- **Auto Start**: Automatically start processing the queue as soon as transactions are enqueued.

## Installation

You can install TransactionQueue using npm:

```sh
npm install transaction-queue
```

## Usage

### Basic Usage

Here's a simple example demonstrating how to use TransactionQueue:

```typescript
import { TransactionQueue } from 'transaction-queue';

const queue = new TransactionQueue({ autoStart: true, concurrency: 2 });

const transaction1 = async () => {
    console.log('Processing transaction 1');
    return 'Result 1';
};

const transaction2 = async () => {
    console.log('Processing transaction 2');
    return 'Result 2';
};

queue.enqueue(transaction1);
queue.enqueue(transaction2);

queue.on('end', () => {
    console.log('All transactions have been processed');
});
```

### Using Concurrency and Rate Limiting

You can control the concurrency and rate limit of the queue by passing options to the constructor:

```typescript
import { TransactionQueue } from 'transaction-queue';

const queue = new TransactionQueue({
    autoStart: true,
    concurrency: 1,
    rateLimit: { count: 10, duration: 10000 } // Max 10 transactions per 10 seconds
});

const transaction = async () => {
    console.log('Processing transaction');
    return 'Result';
};

for (let i = 0; i < 20; i++) {
    queue.enqueue(transaction);
}

queue.on('end', () => {
    console.log('All transactions have been processed');
});
```

### Event Listeners

TransactionQueue supports various events that you can listen to:

- `start`: Emitted when the queue starts processing.
- `success`: Emitted when a batch of transactions is successfully processed.
- `error`: Emitted when an error occurs during transaction processing.
- `end`: Emitted when all transactions in the queue have been processed.
- `drain`: Emitted when the queue is completely drained.

Example:

```typescript
import { TransactionQueue } from 'transaction-queue';

const queue = new TransactionQueue({ autoStart: true, concurrency: 2 });

queue.on('start', () => {
    console.log('Queue processing started');
});

queue.on('success', (results) => {
    console.log('Batch processed successfully', results);
});

queue.on('error', (error) => {
    console.error('Error processing transactions', error);
});

queue.on('end', () => {
    console.log('All transactions have been processed');
});

queue.on('drain', () => {
    console.log('Queue has been drained');
});
```

## API

### TransactionQueue

#### Constructor

```typescript
constructor(options?: TransactionQueueOptions)
```

- `options`:
  - `concurrency`: Number of transactions to process concurrently. Default is `1`.
  - `autoStart`: Whether to start processing the queue automatically. Default is `true`.
  - `delayMs`: Delay in milliseconds between processing batches. Default is `0`.
  - `rateLimit`: Object containing `count` and `duration` for rate limiting. Default is `undefined`.

#### Methods

- `enqueue<T>(transaction: TransactionCallback<T>): Promise<T>`
  Enqueue a new transaction.

- `on(event: EventType, listener: Function): void`
  Add an event listener.

- `removeListener(event: EventType, listener: Function): void`
  Remove an event listener.

- `clear(): void`
  Clear all transactions from the queue.

- `start(): void`
  Start processing the queue.

- `readonly length: number`
  Get the number of transactions in the queue.

- `readonly processing: boolean`
  Get whether the queue is currently processing.

### Types

#### TransactionQueueOptions

```typescript
interface TransactionQueueOptions {
    concurrency?: number;
    autoStart?: boolean;
    delayMs?: number;
    rateLimit?: { count: number, duration: number };
}
```

#### TransactionCallback

```typescript
type TransactionCallback<T> = () => Promise<T>;
```

#### EventType

```typescript
type EventType = "start" | "success" | "error" | "end" | "drain";
```

## License

MIT