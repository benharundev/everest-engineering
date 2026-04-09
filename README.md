# Everest Engineering — Take-Home Challenge

A full-stack inventory reservation system built to prevent overselling under high concurrency.

## Projects

| Folder | Description |
|--------|-------------|
| [`inventory-reservation`](./inventory-reservation) | NestJS + TypeScript backend API |
| [`inventory-reservation-client`](./inventory-reservation-client) | React + Vite frontend dashboard |

## Quick Start

**1. Start the backend infrastructure**
```bash
cd inventory-reservation
docker-compose up -d   # PostgreSQL (port 5434) + Redis (port 6381)
npm install
npm run start:dev      # API at http://localhost:3000
```

**2. Start the frontend**
```bash
cd inventory-reservation-client
npm install
npm run dev            # App at http://localhost:5173
```

## Architecture Overview

The backend uses a **dual-path concurrency strategy** with a circuit breaker to prevent overselling:
- **Primary path** — Redis Lua atomic scripts (fast, lock-free)
- **Fallback path** — PostgreSQL `SELECT FOR UPDATE` + in-process mutex (when Redis is unavailable)

Reservations hold stock for 2 minutes. If not confirmed, they auto-expire via BullMQ and stock is released.

```
ACTIVE → CONFIRMED  (permanent sale)
       → CANCELLED  (stock released immediately)
       → EXPIRED    (auto after 2 min)
```

The frontend provides a real-time dashboard to create, confirm, cancel, and simulate reservations.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Backend | NestJS 11, TypeScript, PostgreSQL 15, Redis 7, BullMQ |
| Frontend | React 18, TypeScript 5, Vite 6 |
| Testing | Jest, Supertest (unit, integration, concurrency) |
| Infrastructure | Docker Compose |
