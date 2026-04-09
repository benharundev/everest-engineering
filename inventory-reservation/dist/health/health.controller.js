"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HealthController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const terminus_1 = require("@nestjs/terminus");
const throttler_1 = require("@nestjs/throttler");
const redis_health_indicator_1 = require("./redis-health.indicator");
const circuit_breaker_service_1 = require("../infrastructure/circuit-breaker/circuit-breaker.service");
let HealthController = class HealthController {
    constructor(health, db, redis, circuitBreaker) {
        this.health = health;
        this.db = db;
        this.redis = redis;
        this.circuitBreaker = circuitBreaker;
    }
    check() {
        return this.health.check([
            () => this.db.pingCheck('database'),
            () => this.redis.isHealthy('redis'),
        ]);
    }
    circuitBreakerStatus() {
        return { state: this.circuitBreaker.getState() };
    }
};
exports.HealthController = HealthController;
__decorate([
    (0, common_1.Get)(),
    (0, terminus_1.HealthCheck)(),
    (0, swagger_1.ApiOperation)({
        summary: 'System health check',
        description: 'Returns DB and Redis connectivity status.',
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], HealthController.prototype, "check", null);
__decorate([
    (0, common_1.Get)('circuit-breaker'),
    (0, swagger_1.ApiOperation)({
        summary: 'Circuit breaker state',
        description: 'Returns current state: CLOSED (healthy), OPEN (Redis down), or HALF_OPEN (probing).',
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], HealthController.prototype, "circuitBreakerStatus", null);
exports.HealthController = HealthController = __decorate([
    (0, swagger_1.ApiTags)('health'),
    (0, common_1.Controller)('health'),
    (0, throttler_1.SkipThrottle)(),
    __metadata("design:paramtypes", [terminus_1.HealthCheckService,
        terminus_1.TypeOrmHealthIndicator,
        redis_health_indicator_1.RedisHealthIndicator,
        circuit_breaker_service_1.CircuitBreakerService])
], HealthController);
//# sourceMappingURL=health.controller.js.map