"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const event_emitter_1 = require("@nestjs/event-emitter");
const bull_1 = require("@nestjs/bull");
const throttler_1 = require("@nestjs/throttler");
const core_1 = require("@nestjs/core");
const Joi = require("joi");
const reservation_entity_1 = require("./domain/entities/reservation.entity");
const inventory_entity_1 = require("./domain/entities/inventory.entity");
const reservation_status_log_entity_1 = require("./domain/entities/reservation-status-log.entity");
const inventory_audit_log_entity_1 = require("./domain/entities/inventory-audit-log.entity");
const inventory_repository_interface_1 = require("./domain/interfaces/inventory-repository.interface");
const reservation_repository_interface_1 = require("./domain/interfaces/reservation-repository.interface");
const redis_module_1 = require("./infrastructure/redis/redis.module");
const circuit_breaker_module_1 = require("./infrastructure/circuit-breaker/circuit-breaker.module");
const mutex_service_1 = require("./infrastructure/mutex/mutex.service");
const typeorm_inventory_repository_1 = require("./infrastructure/persistence/typeorm-inventory.repository");
const typeorm_reservation_repository_1 = require("./infrastructure/persistence/typeorm-reservation.repository");
const expiry_processor_1 = require("./infrastructure/queue/expiry.processor");
const expiry_queue_1 = require("./infrastructure/queue/expiry.queue");
const reservation_service_1 = require("./application/services/reservation.service");
const expiry_scheduler_listener_1 = require("./application/listeners/expiry-scheduler.listener");
const stock_release_listener_1 = require("./application/listeners/stock-release.listener");
const status_log_listener_1 = require("./application/listeners/status-log.listener");
const inventory_audit_log_listener_1 = require("./application/listeners/inventory-audit-log.listener");
const reservation_controller_1 = require("./presentation/controllers/reservation.controller");
const inventory_controller_1 = require("./presentation/controllers/inventory.controller");
const health_module_1 = require("./health/health.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                validationSchema: Joi.object({
                    PORT: Joi.number().default(3000),
                    DB_HOST: Joi.string().default('localhost'),
                    DB_PORT: Joi.number().default(5432),
                    DB_USER: Joi.string().default('inventory'),
                    DB_PASS: Joi.string().default('inventory'),
                    DB_NAME: Joi.string().default('inventory_reservation'),
                    REDIS_HOST: Joi.string().default('localhost'),
                    REDIS_PORT: Joi.number().default(6379),
                    NODE_ENV: Joi.string()
                        .valid('development', 'production', 'test')
                        .default('development'),
                }),
            }),
            typeorm_1.TypeOrmModule.forRoot({
                type: 'postgres',
                host: process.env.DB_HOST ?? 'localhost',
                port: parseInt(process.env.DB_PORT ?? '5432', 10),
                username: process.env.DB_USER ?? 'inventory',
                password: process.env.DB_PASS ?? 'inventory',
                database: process.env.DB_NAME ?? 'inventory_reservation',
                entities: [reservation_entity_1.Reservation, inventory_entity_1.Inventory, reservation_status_log_entity_1.ReservationStatusLog, inventory_audit_log_entity_1.InventoryAuditLog],
                synchronize: process.env.NODE_ENV !== 'production',
            }),
            typeorm_1.TypeOrmModule.forFeature([reservation_entity_1.Reservation, inventory_entity_1.Inventory, reservation_status_log_entity_1.ReservationStatusLog, inventory_audit_log_entity_1.InventoryAuditLog]),
            event_emitter_1.EventEmitterModule.forRoot({ wildcard: false }),
            bull_1.BullModule.forRoot({
                redis: {
                    host: process.env.REDIS_HOST ?? 'localhost',
                    port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
                },
            }),
            bull_1.BullModule.registerQueue({ name: expiry_queue_1.EXPIRY_QUEUE_NAME }),
            throttler_1.ThrottlerModule.forRoot([
                {
                    name: 'default',
                    ttl: 60_000,
                    limit: 200,
                },
            ]),
            redis_module_1.RedisModule,
            circuit_breaker_module_1.CircuitBreakerModule,
            health_module_1.HealthModule,
        ],
        controllers: [reservation_controller_1.ReservationController, inventory_controller_1.InventoryController],
        providers: [
            { provide: core_1.APP_GUARD, useClass: throttler_1.ThrottlerGuard },
            mutex_service_1.MutexService,
            {
                provide: inventory_repository_interface_1.INVENTORY_REPOSITORY,
                useClass: typeorm_inventory_repository_1.TypeOrmInventoryRepository,
            },
            {
                provide: reservation_repository_interface_1.RESERVATION_REPOSITORY,
                useClass: typeorm_reservation_repository_1.TypeOrmReservationRepository,
            },
            expiry_processor_1.ExpiryProcessor,
            reservation_service_1.ReservationService,
            expiry_scheduler_listener_1.ExpirySchedulerListener,
            stock_release_listener_1.StockReleaseListener,
            status_log_listener_1.StatusLogListener,
            inventory_audit_log_listener_1.InventoryAuditLogListener,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map