import { HealthIndicator, HealthIndicatorResult } from '@nestjs/terminus';
import { RedisStockService } from '../infrastructure/redis/redis-stock.service';
export declare class RedisHealthIndicator extends HealthIndicator {
    private readonly redisStock;
    constructor(redisStock: RedisStockService);
    isHealthy(key: string): Promise<HealthIndicatorResult>;
}
