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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var ReservationService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReservationService = void 0;
const common_1 = require("@nestjs/common");
const event_emitter_1 = require("@nestjs/event-emitter");
const typeorm_1 = require("typeorm");
const reservation_response_dto_1 = require("../dto/reservation-response.dto");
const pagination_dto_1 = require("../dto/pagination.dto");
const reservation_entity_1 = require("../../domain/entities/reservation.entity");
const inventory_repository_interface_1 = require("../../domain/interfaces/inventory-repository.interface");
const reservation_repository_interface_1 = require("../../domain/interfaces/reservation-repository.interface");
const reservation_status_log_entity_1 = require("../../domain/entities/reservation-status-log.entity");
const typeorm_2 = require("@nestjs/typeorm");
const typeorm_3 = require("typeorm");
const out_of_stock_exception_1 = require("../../domain/exceptions/out-of-stock.exception");
const redis_stock_service_1 = require("../../infrastructure/redis/redis-stock.service");
const circuit_breaker_service_1 = require("../../infrastructure/circuit-breaker/circuit-breaker.service");
const mutex_service_1 = require("../../infrastructure/mutex/mutex.service");
let ReservationService = ReservationService_1 = class ReservationService {
    constructor(inventoryRepo, reservationRepo, redisStock, circuitBreaker, mutex, events, dataSource, statusLogRepo) {
        this.inventoryRepo = inventoryRepo;
        this.reservationRepo = reservationRepo;
        this.redisStock = redisStock;
        this.circuitBreaker = circuitBreaker;
        this.mutex = mutex;
        this.events = events;
        this.dataSource = dataSource;
        this.statusLogRepo = statusLogRepo;
        this.logger = new common_1.Logger(ReservationService_1.name);
    }
    async reserve(dto) {
        const { productId, userId, quantity } = dto;
        if (this.circuitBreaker.isOpen()) {
            this.logger.warn(`Circuit open — using DB fallback for product ${productId}`);
            return this.reserveWithFallback(productId, userId, quantity);
        }
        try {
            return await this.reserveWithRedis(productId, userId, quantity);
        }
        catch (err) {
            if (err instanceof out_of_stock_exception_1.OutOfStockException)
                throw err;
            this.logger.warn(`Redis reserve failed — recording failure and using fallback: ${err}`);
            this.circuitBreaker.recordFailure();
            return this.reserveWithFallback(productId, userId, quantity);
        }
    }
    async reserveWithRedis(productId, userId, quantity) {
        const success = await this.redisStock.atomicDecrement(productId, quantity);
        if (!success) {
            const inventory = await this.inventoryRepo.findByProductId(productId);
            const available = inventory?.availableStock ?? 0;
            throw new out_of_stock_exception_1.OutOfStockException(productId, quantity, available);
        }
        this.circuitBreaker.recordSuccess();
        const reservation = await this.dataSource.transaction(async (manager) => {
            const inv = await this.inventoryRepo.findByProductIdWithLock(productId, manager);
            if (!inv) {
                await this.redisStock.increment(productId, quantity);
                throw new common_1.NotFoundException(`Product ${productId} not found`);
            }
            inv.incrementActiveReservations(quantity);
            await this.inventoryRepo.save(inv, manager);
            const res = reservation_entity_1.Reservation.create(productId, inv.name, userId, quantity);
            return this.reservationRepo.save(res, manager);
        });
        await this.dispatchEvents(reservation);
        return reservation_response_dto_1.ReservationResponseDto.fromEntity(reservation);
    }
    async reserveWithFallback(productId, userId, quantity) {
        return this.mutex.runExclusive(productId, async () => {
            const reservation = await this.dataSource.transaction(async (manager) => {
                const inventory = await this.inventoryRepo.findByProductIdWithLock(productId, manager);
                if (!inventory) {
                    throw new common_1.NotFoundException(`Product ${productId} not found`);
                }
                if (inventory.availableStock < quantity) {
                    throw new out_of_stock_exception_1.OutOfStockException(productId, quantity, inventory.availableStock);
                }
                inventory.incrementActiveReservations(quantity);
                await this.inventoryRepo.save(inventory, manager);
                const res = reservation_entity_1.Reservation.create(productId, inventory.name, userId, quantity);
                return this.reservationRepo.save(res, manager);
            });
            await this.dispatchEvents(reservation);
            return reservation_response_dto_1.ReservationResponseDto.fromEntity(reservation);
        });
    }
    async confirm(reservationId) {
        const reservation = await this.reservationRepo.findById(reservationId);
        if (!reservation) {
            throw new common_1.NotFoundException(`Reservation ${reservationId} not found`);
        }
        reservation.confirm();
        await this.reservationRepo.save(reservation);
        await this.dispatchEvents(reservation);
        return reservation_response_dto_1.ReservationResponseDto.fromEntity(reservation);
    }
    async cancel(reservationId) {
        const reservation = await this.reservationRepo.findById(reservationId);
        if (!reservation) {
            throw new common_1.NotFoundException(`Reservation ${reservationId} not found`);
        }
        reservation.cancel();
        await this.reservationRepo.save(reservation);
        await this.dispatchEvents(reservation);
        return reservation_response_dto_1.ReservationResponseDto.fromEntity(reservation);
    }
    async getAll(status, pagination = new pagination_dto_1.PaginationDto()) {
        const [reservations, total] = await this.reservationRepo.findAll(status, pagination.offset, pagination.limit);
        return {
            data: reservations.map(reservation_response_dto_1.ReservationResponseDto.fromEntity),
            total,
            offset: pagination.offset,
            limit: pagination.limit,
        };
    }
    async getById(reservationId) {
        const reservation = await this.reservationRepo.findById(reservationId);
        if (!reservation) {
            throw new common_1.NotFoundException(`Reservation ${reservationId} not found`);
        }
        return reservation_response_dto_1.ReservationResponseDto.fromEntity(reservation);
    }
    async getStatusLogs(reservationId) {
        const reservation = await this.reservationRepo.findById(reservationId);
        if (!reservation) {
            throw new common_1.NotFoundException(`Reservation ${reservationId} not found`);
        }
        return this.statusLogRepo.find({
            where: { reservationId },
            order: { changedAt: 'ASC' },
        });
    }
    async onRedisRecovery() {
        this.logger.log('Redis recovered — rehydrating stock counters from DB');
        const stocks = await this.inventoryRepo.getAllAvailableStock();
        for (const { productId, availableStock } of stocks) {
            await this.redisStock.setStock(productId, availableStock);
        }
        this.circuitBreaker.reset();
        this.logger.log(`Rehydrated ${stocks.length} product(s) — circuit reset to CLOSED`);
    }
    async dispatchEvents(reservation) {
        for (const event of reservation.domainEvents) {
            await this.events.emitAsync(event.constructor.name, event);
        }
        reservation.clearDomainEvents();
    }
};
exports.ReservationService = ReservationService;
exports.ReservationService = ReservationService = ReservationService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(inventory_repository_interface_1.INVENTORY_REPOSITORY)),
    __param(1, (0, common_1.Inject)(reservation_repository_interface_1.RESERVATION_REPOSITORY)),
    __param(7, (0, typeorm_2.InjectRepository)(reservation_status_log_entity_1.ReservationStatusLog)),
    __metadata("design:paramtypes", [Object, Object, redis_stock_service_1.RedisStockService,
        circuit_breaker_service_1.CircuitBreakerService,
        mutex_service_1.MutexService,
        event_emitter_1.EventEmitter2,
        typeorm_1.DataSource,
        typeorm_3.Repository])
], ReservationService);
//# sourceMappingURL=reservation.service.js.map