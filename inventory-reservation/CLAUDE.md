# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Start infrastructure (required before running the app or integration tests)
docker-compose up -d

# Development
npm run start:dev       # Hot-reload dev server

# Build
npm run build

# Testing
npm test                # Unit tests only (test/unit/)
npm run test:concurrency  # Concurrency tests, runs sequentially with --runInBand
npm run test:integration  # Full lifecycle + circuit breaker failover tests
USE_REAL_INFRA=true npm run test:integration  # Same tests against real Postgres/Redis
npm run test:all          # All test suites
npm run test:cov          # Coverage report

# Run a single test file
npx jest test/unit/reservation.entity.spec.ts

# Run load simulation
npm run simulate
```

## Infrastructure Ports

Docker maps to non-default ports to avoid conflicts:

| Service | Host Port | Container Port |
|---------|-----------|----------------|
| PostgreSQL 15 | 5434 | 5432 |
| Redis 7 | 6381 | 6379 |

These are reflected in `.env`. Swagger UI is available at `http://localhost:3000/api`.

Health checks: `GET /health` (DB + Redis status), `GET /health/circuit-breaker` (CLOSED/OPEN/HALF_OPEN).

## Architecture

NestJS + TypeScript inventory reservation system built to prevent overselling under high concurrency. Uses a **dual-path concurrency strategy** with circuit breaker routing.

### Layer Structure

```
src/
├── main.ts                          # Bootstrap: Helmet, CORS, Swagger, ValidationPipe, shutdown hooks
├── app.module.ts                    # Root module: TypeORM, EventEmitter, Bull, Throttler, all providers
├── domain/                          # Pure business logic — no NestJS / TypeORM imports here
│   ├── entities/
│   │   ├── reservation.entity.ts           # Aggregate root with state machine transitions
│   │   ├── inventory.entity.ts             # availableStock getter, optimistic locking (version)
│   │   ├── reservation-status-log.entity.ts
│   │   └── inventory-audit-log.entity.ts
│   ├── value-objects/
│   │   └── reservation-status.enum.ts
│   ├── events/
│   │   ├── reservation-created.event.ts
│   │   ├── reservation-confirmed.event.ts
│   │   ├── reservation-cancelled.event.ts
│   │   └── reservation-expired.event.ts
│   ├── exceptions/
│   │   ├── out-of-stock.exception.ts       # extends ConflictException → 409
│   │   └── invalid-state.exception.ts      # extends BadRequestException
│   └── interfaces/
│       ├── reservation-repository.interface.ts
│       └── inventory-repository.interface.ts
├── application/
│   ├── services/
│   │   └── reservation.service.ts          # Core orchestrator — dual-path, circuit breaker routing
│   ├── listeners/
│   │   ├── expiry-scheduler.listener.ts    # Enqueues BullMQ expiry job on ReservationCreated
│   │   ├── stock-release.listener.ts       # Releases/confirms stock on Cancel/Expire/Confirm
│   │   ├── status-log.listener.ts          # Writes state-change audit rows
│   │   └── inventory-audit-log.listener.ts # Writes inventory mutation history
│   └── dto/
│       ├── create-reservation.dto.ts
│       ├── reservation-response.dto.ts
│       ├── get-reservations-query.dto.ts
│       ├── get-audit-logs-query.dto.ts
│       └── pagination.dto.ts
├── infrastructure/
│   ├── redis/
│   │   ├── redis-stock.service.ts          # Lua atomic decrement, increment, setStock, ping
│   │   ├── redis.module.ts
│   │   └── redis.constants.ts
│   ├── circuit-breaker/
│   │   ├── circuit-breaker.service.ts      # CLOSED/OPEN/HALF_OPEN state machine, 5-failure threshold
│   │   └── circuit-breaker.module.ts
│   ├── mutex/
│   │   └── mutex.service.ts                # Per-product async-mutex for within-process serialisation
│   ├── persistence/
│   │   ├── typeorm-reservation.repository.ts
│   │   └── typeorm-inventory.repository.ts
│   └── queue/
│       ├── expiry.queue.ts
│       └── expiry.processor.ts             # Processes expired reservations, dispatches domain events
├── presentation/
│   └── controllers/
│       ├── reservation.controller.ts
│       └── inventory.controller.ts
├── health/
│   ├── health.controller.ts
│   ├── health.module.ts
│   └── redis-health.indicator.ts
└── common/
    └── interceptors/
        └── logging.interceptor.ts          # X-Request-Id, structured req/res logs
```

### Concurrency Strategy

**Primary path (Redis CLOSED):** `RedisStockService.atomicDecrement()` uses a Lua script for atomic check-and-decrement — single indivisible operation, handles high concurrency. Redis keys use format `stock:{productId}`.

**Fallback path (Redis OPEN):** Both layers are required together:
- `MutexService.runExclusive()` — serializes requests within a single process
- `SELECT FOR UPDATE` — provides cross-process locking at the DB level

Mutex alone fails across multiple server instances; `SELECT FOR UPDATE` alone allows Node.js coroutine races within a process. Both together guarantee safety.

**Recovery:** When circuit breaker detects Redis recovery, `ReservationService.onRedisRecovery()` rehydrates Redis counters from PostgreSQL (DB is always source of truth; Redis is a cache).

### Stock Formula

```
Available = totalStock − confirmedSales − activeReservations
```

Both confirmed sales and active (pending) reservations are subtracted. Subtracting only confirmedSales causes overselling.

### Reservation State Machine

```
ACTIVE → CONFIRMED  (permanent sale; stock moved to confirmedSales)
       → CANCELLED  (stock released immediately)
       → EXPIRED    (2-min BullMQ job fires; stock released)
```

All transitions are enforced at domain level (`Reservation` entity). Invalid transitions throw `InvalidStateException`. The expiry BullMQ job uses `jobId: expiry:<id>` (idempotent — if user confirms before the timer fires, the processor catches `InvalidStateException` and skips gracefully).

### Event-Driven Side Effects

Domain events are collected in `_domainEvents` on the entity and dispatched by the service after persistence:

- `ReservationCreatedEvent` → `ExpirySchedulerListener` schedules BullMQ job
- `ReservationConfirmedEvent` / `CancelledEvent` / `ExpiredEvent` → `StockReleaseListener` updates DB inventory and Redis counter
- All transitions → `StatusLogListener` writes to `ReservationStatusLog`
- Inventory mutations → `InventoryAuditLogListener` writes to `InventoryAuditLog`

Event dispatch is fire-and-forget; listener failures do not roll back the reservation.

### Circuit Breaker States

- **CLOSED** → normal, Redis healthy
- **OPEN** → Redis failing; routes to DB fallback after 5 consecutive failures
- **HALF_OPEN** → probe state after 30s recovery timeout

### Runtime Constraints

- TypeORM uses `synchronize: true` in development — schema is auto-created; no migrations needed locally.
- Rate limiting: 200 req/min globally; `POST /reservations` has a tighter cap of 100/min.

### Repository Injection

Repositories are injected as symbols (`INVENTORY_REPOSITORY`, `RESERVATION_REPOSITORY`) rather than concrete classes. This allows test doubles to swap implementations without changing service code.
