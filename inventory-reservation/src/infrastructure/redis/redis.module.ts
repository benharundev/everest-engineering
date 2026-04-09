import { Module, Global } from '@nestjs/common';
import Redis from 'ioredis';
import { RedisStockService } from './redis-stock.service';
import { REDIS_CLIENT } from './redis.constants';

export { REDIS_CLIENT } from './redis.constants';

@Global()
@Module({
  providers: [
    {
      provide: REDIS_CLIENT,
      useFactory: (): Redis => {
        return new Redis({
          host: process.env.REDIS_HOST ?? 'localhost',
          port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
          lazyConnect: true,
          enableOfflineQueue: false, // Fail fast when Redis is down
          maxRetriesPerRequest: 1,
        });
      },
    },
    RedisStockService,
  ],
  exports: [REDIS_CLIENT, RedisStockService],
})
export class RedisModule {}
