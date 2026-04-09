# Inventory Reservation Service

A NestJS + TypeScript backend that manages product reservations and prevents overselling under high concurrency.

## Overview

- **Framework:** NestJS 11, TypeScript 5, PostgreSQL 15, Redis 7
- **Port:** 3000 — Swagger UI at `http://localhost:3000/api`
- **Architecture:** Clean Architecture / DDD — domain, application, infrastructure, presentation layers

## How It Works

Reservations hold stock for 2 minutes. If not confirmed, they expire automatically via a BullMQ job, releasing the stock back to the pool.

**Stock formula:**
```
Available = totalStock − confirmedSales − activeReservations
```

**Concurrency strategy — dual-path with circuit breaker:**
| Condition    | Path     | Mechanism                                          |
|--------------|----------|----------------------------------------------------|
| Redis healthy | Primary  | Redis Lua script (atomic check-and-decrement)      |
| Redis down   | Fallback | In-process Mutex + PostgreSQL `SELECT FOR UPDATE`  |

**Reservation state machine:**
```
ACTIVE → CONFIRMED  (permanent sale)
       → CANCELLED  (stock released immediately)
       → EXPIRED    (auto after 2 min, stock released)
```

## Getting Started

```bash
# Start PostgreSQL (port 5434) and Redis (port 6381)
docker-compose up -d

npm install
npm run start:dev
```

## Environment Variables

All variables have defaults. Copy `.env` to customise.

| Variable     | Default               |
|--------------|-----------------------|
| `PORT`       | 3000                  |
| `DB_HOST`    | localhost             |
| `DB_PORT`    | 5434                  |
| `DB_USER`    | inventory             |
| `DB_PASS`    | inventory             |
| `DB_NAME`    | inventory_reservation |
| `REDIS_HOST` | localhost             |
| `REDIS_PORT` | 6381                  |

## Scripts

| Command                    | Description                      |
|----------------------------|----------------------------------|
| `npm run start:dev`        | Dev server with hot reload       |
| `npm run build`            | Compile TypeScript               |
| `npm test`                 | Unit tests                       |
| `npm run test:integration` | Integration tests                |
| `npm run test:concurrency` | Concurrency tests                |
| `npm run test:all`         | All test suites                  |
| `npm run simulate`         | Load simulation script           |

## API Endpoints

| Method | Path                        | Description                    |
|--------|-----------------------------|--------------------------------|
| GET    | `/inventory`                | List inventory                 |
| POST   | `/inventory`                | Create or update inventory     |
| GET    | `/reservations`             | List reservations              |
| POST   | `/reservations`             | Create a reservation           |
| GET    | `/reservations/:id`         | Get reservation details        |
| POST   | `/reservations/:id/confirm` | Confirm a reservation          |
| DELETE | `/reservations/:id`         | Cancel a reservation           |
| GET    | `/reservations/:id/logs`    | Get status change history      |
| GET    | `/health`                   | Health check (DB + Redis)      |
