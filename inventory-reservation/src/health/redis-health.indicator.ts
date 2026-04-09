import { Injectable } from '@nestjs/common';
import {
  HealthIndicator,
  HealthIndicatorResult,
  HealthCheckError,
} from '@nestjs/terminus';
import { RedisStockService } from '../infrastructure/redis/redis-stock.service';

@Injectable()
export class RedisHealthIndicator extends HealthIndicator {
  constructor(private readonly redisStock: RedisStockService) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      await this.redisStock.ping();
      return this.getStatus(key, true);
    } catch {
      throw new HealthCheckError(
        'Redis health check failed',
        this.getStatus(key, false),
      );
    }
  }
}
