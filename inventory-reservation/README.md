# Inventory Reservation System

**Everest Engineering — Backend Coding Challenge**
**Author:** Mohd Nor Hisyam

---

## Overview

A production-grade NestJS + TypeScript Inventory Reservation System that prevents overselling under high concurrency. The design addresses four core objectives from the challenge brief.

---

## Approach & Key Decisions

### 1. Concurrency Strategy — Dual-Path with Circuit Breaker

The system uses two concurrency paths routed by a Circuit Breaker:

| Condition | Path | Mechanism |
|---|---|---|
| Redis healthy | Primary | Redis Lua Script (atomic check-and-decrement) |
| Redis down | Fallback | In-Memory Mutex + `SELECT FOR UPDATE` |

**Why Redis Lua Script?**
Redis is single-threaded. A Lua script runs to completion before any other command — no interleaving possible. This eliminates the race condition gap between reading and writing stock.

**Why not just try/catch?**
A naive try/catch still attempts Redis on every request during downtime, causing each to wait for the full network timeout. The Circuit Breaker tracks state and short-circuits instantly once N failures are recorded.

**Why Mutex + SELECT FOR UPDATE together?**
The Mutex serialises concurrent async operations *within* one Node.js process. But running 3 server instances means 3 separate mutexes — they don't coordinate. `SELECT FOR UPDATE` adds a PostgreSQL row-level lock that works *across all instances*. Both layers are needed.

### 2. State Machine — Domain Correctness

The `Reservation` entity enforces all valid transitions at the domain level. Business rules live in one place, not scattered across services.

```
ACTIVE → CONFIRMED  (user confirms, irreversible)
       → CANCELLED  (user cancels, stock released)
       → EXPIRED    (2-min timer fires, stock released)
```

Any illegal transition (e.g. confirming an already-expired reservation) throws `InvalidStateException` immediately.

### 3. Available Stock Formula

```
Available = totalStock − confirmedSales − activeReservations
```

Active reservations **must** be subtracted. If you only subtract confirmed sales, two users can both see stock=1, both reserve it — oversold. Holding a reservation counts as consumed inventory.

### 4. Event-Driven Architecture (EDA)

`ReservationService` emits domain events after each transition. Independent listeners handle side effects:
- `ExpirySchedulerListener` → schedules BullMQ delayed job on `ReservationCreated`
- `StockReleaseListener` → releases stock on `ReservationCancelled` / `ReservationExpired`; moves to `confirmedSales` on `ReservationConfirmed`

The service has zero knowledge of timers, queues, or stock release — clean separation of concerns.

### 5. SOLID Principles Applied

| Principle | How |
|---|---|
| **S** — Single Responsibility | `ReservationService` orchestrates. `CircuitBreakerService` tracks state. `MutexService` serialises. `ExpirySchedulerListener` schedules. |
| **O** — Open/Closed | Add new event listeners without modifying service code. |
| **L** — Liskov Substitution | `TypeOrmInventoryRepository` and `TypeOrmReservationRepository` implement interfaces — service can't tell. |
| **I** — Interface Segregation | `IInventoryRepository` and `IReservationRepository` are separate — stock concerns don't pollute reservation persistence. |
| **D** — Dependency Inversion | Service depends on `IInventoryRepository`, `IReservationRepository` — inject mocks in tests, no infra needed. |

---

## Project Structure

```
src/
├── domain/               # Pure domain — no framework dependencies
│   ├── entities/         # Reservation (state machine), Inventory
│   ├── events/           # Domain events (Created, Confirmed, Cancelled, Expired)
│   ├── exceptions/       # InvalidStateException, OutOfStockException
│   ├── interfaces/       # IInventoryRepository, IReservationRepository
│   └── value-objects/    # ReservationStatus enum
├── application/          # Use cases, orchestration
│   ├── services/         # ReservationService
│   ├── dto/              # CreateReservationDto, ReservationResponseDto
│   └── listeners/        # ExpirySchedulerListener, StockReleaseListener
├── infrastructure/       # External concerns
│   ├── circuit-breaker/  # CircuitBreakerService
│   ├── mutex/            # MutexService (async-mutex)
│   ├── redis/            # RedisStockService (Lua scripts via ioredis)
│   ├── persistence/      # TypeORM repositories
│   └── queue/            # BullMQ expiry processor
└── presentation/         # HTTP controllers
    └── controllers/      # ReservationController
```

---

## API

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/reservations` | Create reservation — holds stock for 2 min |
| `POST` | `/reservations/:id/confirm` | Confirm — converts hold to permanent sale |
| `DELETE` | `/reservations/:id` | Cancel — immediately releases held stock |
| `GET` | `/reservations/:id` | Get reservation status |

### Request: POST /reservations
```json
{
  "productId": "11111111-1111-1111-1111-111111111111",
  "userId": "22222222-2222-2222-2222-222222222222",
  "quantity": 1
}
```

### Response
```json
{
  "id": "uuid",
  "productId": "uuid",
  "userId": "uuid",
  "quantity": 1,
  "status": "ACTIVE",
  "expiresAt": "2026-04-07T00:02:00.000Z",
  "createdAt": "2026-04-07T00:00:00.000Z"
}
```

---

## Running Locally

### Prerequisites
- Node.js 20+
- Docker + Docker Compose

### Start infrastructure
```bash
docker-compose up -d
```

### Install dependencies
```bash
npm install
```

### Run the API
```bash
npm run start:dev
```

---

## Tests

### Unit tests (no infra required)
```bash
npm test
```

Covers:
- `Reservation` entity state machine — all valid and invalid transitions
- `Inventory` entity available stock formula
- `CircuitBreakerService` — state transitions
- `ReservationService` — Redis path, fallback path, confirm, cancel, recovery

### Concurrency tests
```bash
npm run test:concurrency
```

Covers:
- 100 concurrent requests, stock=10 → exactly 10 succeed
- stock=1, 50 concurrent requests → exactly 1 wins
- Stock exhausted → all requests rejected correctly

### Integration / Lifecycle tests
```bash
npm run test:integration
```

Covers:
- Full reserve → confirm flow
- Full reserve → cancel flow
- State machine blocks illegal transitions end-to-end
- Circuit breaker failover — fallback path reserves correctly
- Redis recovery rehydrates and resets circuit

---

## Tradeoffs & Assumptions

**Dual-path complexity vs. resilience:** The Redis + fallback design is more complex than a pure `SELECT FOR UPDATE` approach, but it's appropriate here because the challenge explicitly requires handling high-concurrency flash-sale load (Redis) while remaining available during Redis downtime (fallback).

**BullMQ for expiry:** A scheduled job is more reliable than an in-memory `setTimeout` — jobs survive process restarts. The 2-minute delay is set at reservation creation time.

**Redis rehydration on recovery:** When the circuit breaker transitions from OPEN → CLOSED, `onRedisRecovery()` must be called (e.g. via a health check endpoint or startup probe). Stale Redis counters must never be re-used — the DB is always the source of truth.

**`synchronize: true` in dev only:** TypeORM's `synchronize` flag is disabled in production. Schema migrations should be used in a real deployment.
