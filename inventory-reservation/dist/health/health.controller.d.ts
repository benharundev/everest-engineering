import { HealthCheckService, TypeOrmHealthIndicator } from '@nestjs/terminus';
import { RedisHealthIndicator } from './redis-health.indicator';
import { CircuitBreakerService } from '../infrastructure/circuit-breaker/circuit-breaker.service';
export declare class HealthController {
    private readonly health;
    private readonly db;
    private readonly redis;
    private readonly circuitBreaker;
    constructor(health: HealthCheckService, db: TypeOrmHealthIndicator, redis: RedisHealthIndicator, circuitBreaker: CircuitBreakerService);
    check(): Promise<import("@nestjs/terminus").HealthCheckResult<import("@nestjs/terminus").HealthIndicatorResult<string, import("@nestjs/terminus").HealthIndicatorStatus, Record<string, any>> & import("@nestjs/terminus").HealthIndicatorResult & import("@nestjs/terminus").HealthIndicatorResult<"database">, Partial<import("@nestjs/terminus").HealthIndicatorResult<string, import("@nestjs/terminus").HealthIndicatorStatus, Record<string, any>> & import("@nestjs/terminus").HealthIndicatorResult & import("@nestjs/terminus").HealthIndicatorResult<"database">> | undefined, Partial<import("@nestjs/terminus").HealthIndicatorResult<string, import("@nestjs/terminus").HealthIndicatorStatus, Record<string, any>> & import("@nestjs/terminus").HealthIndicatorResult & import("@nestjs/terminus").HealthIndicatorResult<"database">> | undefined>>;
    circuitBreakerStatus(): {
        state: import("../infrastructure/circuit-breaker/circuit-breaker.service").CircuitState;
    };
}
