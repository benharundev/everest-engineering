import Redis from 'ioredis';
export declare class RedisStockService {
    private readonly redis;
    private readonly logger;
    constructor(redis: Redis);
    atomicDecrement(productId: string, quantity: number): Promise<boolean>;
    increment(productId: string, quantity: number): Promise<void>;
    setStock(productId: string, availableStock: number): Promise<void>;
    getStock(productId: string): Promise<number | null>;
    ping(): Promise<boolean>;
    private stockKey;
}
