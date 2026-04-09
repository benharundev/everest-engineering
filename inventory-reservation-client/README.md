# Inventory Reservation Client

A React dashboard for managing product inventory reservations. Connects to the [inventory-reservation](../inventory-reservation) backend.

## Overview

- **Stack:** React 18, TypeScript 5 (strict), Vite 6
- **Port:** 5173 — backend expected at `http://localhost:3000` (configurable)
- **Styling:** Pure CSS custom properties, no CSS framework
- **State:** React Context + useState, no external state library

## Getting Started

```bash
npm install
npm run dev
```

App available at `http://localhost:5173`. Ensure the backend is running first.

## Scripts

| Command          | Description                          |
|------------------|--------------------------------------|
| `npm run dev`    | Start Vite dev server                |
| `npm run build`  | TypeScript check + production build  |
| `npm run preview`| Serve the production build locally   |

## Features

| Tab          | Description                                                              |
|--------------|--------------------------------------------------------------------------|
| Dashboard    | Live stat cards (total, active, confirmed, cancelled, expired) + recent reservations with expiry bars |
| Reservations | Paginated list with status filtering, confirm/cancel actions, detail modal with audit log |
| Create       | Create a reservation by product, customer name, and quantity             |
| Simulate     | 6 runnable concurrency and edge-case scenarios with a live console output |
| Settings     | Configure backend API URL, inspect and clear the customer name cache     |

## Configuration

The backend URL is stored in `localStorage` (`api_base`, default `http://localhost:3000`) and can be changed from the **Settings** tab at runtime — no restart needed.

## Project Structure

```
src/
├── api/client.ts         # All HTTP calls — typed fetch wrapper
├── context/AppContext.tsx # Global state: tab, apiBase, online status, toasts, refreshTick
├── components/
│   ├── Layout/           # Sidebar, TopBar
│   ├── Dashboard/        # Dashboard tab
│   ├── Reservations/     # Reservations list and detail modal
│   ├── Create/           # Reservation creation form
│   ├── Simulate/         # Simulation scenarios
│   ├── Settings/         # Settings tab
│   └── shared/           # Badge, ExpiryBar, Modal, Spinner, Toast
├── types/index.ts        # Shared TypeScript interfaces
└── index.css             # Design tokens and global styles
```
