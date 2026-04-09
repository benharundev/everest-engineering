import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import {
  HealthCheck,
  HealthCheckService,
  TypeOrmHealthIndicator,
} from '@nestjs/terminus';
import { SkipThrottle } from '@nestjs/throttler';
import { RedisHealthIndicator } from './redis-health.indicator';
import { CircuitBreakerService } from '../infrastructure/circuit-breaker/circuit-breaker.service';

@ApiTags('health')
@Controller('health')
@SkipThrottle()
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly db: TypeOrmHealthIndicator,
    private readonly redis: RedisHealthIndicator,
    private readonly circuitBreaker: CircuitBreakerService,
  ) {}

  @Get()
  @HealthCheck()
  @ApiOperation({
    summary: 'System health check',
    description: 'Returns DB and Redis connectivity status.',
  })
  check() {
    return this.health.check([
      () => this.db.pingCheck('database'),
      () => this.redis.isHealthy('redis'),
    ]);
  }

  @Get('circuit-breaker')
  @ApiOperation({
    summary: 'Circuit breaker state',
    description: 'Returns current state: CLOSED (healthy), OPEN (Redis down), or HALF_OPEN (probing).',
  })
  circuitBreakerStatus() {
    return { state: this.circuitBreaker.getState() };
  }
}
