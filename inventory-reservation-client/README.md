# Inventory Reservation Client

A production-quality React dashboard for the Inventory Reservation System — built as part of the Everest Engineering take-home challenge.

---

## Overview

This frontend interfaces with the NestJS backend to provide a real-time command center for managing inventory reservations. It covers the full reservation lifecycle: create, confirm, cancel, and expire — with live metrics, audit logs, and concurrency simulation tools.

**Aesthetic:** Obsidian Command Center — dark theme with electric cyan accents, Syne display font, dot-grid backgrounds, and animated status indicators.

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | React 18.3 |
| Build tool | Vite 5.4 |
| Language | TypeScript 5.5 (strict) |
| Styling | Pure CSS custom properties (no CSS-in-JS library) |
| State | React Context API |
| HTTP | Native `fetch` (typed wrapper) |
| Persistence | `localStorage` (API URL, customer name map) |
| Fonts | Syne (display), DM Sans (body), JetBrains Mono (code/mono) |

---

## Getting Started

### Prerequisites

- Node.js 18+ (tested on v21 / v25)
- NestJS backend running (default: `http://localhost:3000`)

### Install and run

```bash
cd inventory-reservation-client
npm install
npm run dev
```

App starts at **http://localhost:5173**

### Build for production

```bash
npm run build       # type-check + vite bundle
npm run preview     # serve the dist/ folder locally
```

---

## Project Structure

```
src/
├── api/
│   └── client.ts               # Typed fetch wrapper, nameStore, uuid4()
├── components/
│   ├── Layout/
│   │   ├── Sidebar.tsx          # Navigation with active indicator and status dot
│   │   └── TopBar.tsx           # Breadcrumb, live clock, LIVE/OFFLINE pill
│   ├── Dashboard/
│   │   └── Dashboard.tsx        # Stat cards + recent reservations table
│   ├── Reservations/
│   │   └── ReservationsTab.tsx  # Paginated list, confirm/cancel, detail modal + audit log
│   ├── Create/
│   │   └── CreateForm.tsx       # Reservation form with product tiles and expiry result card
│   ├── Simulate/
│   │   └── SimulateTab.tsx      # 6 concurrency/edge-case scenarios with live console
│   ├── Settings/
│   │   └── SettingsTab.tsx      # API URL config, name cache inspector, API reference
│   └── shared/
│       ├── Badge.tsx            # Status badge (ACTIVE with pulse dot, CONFIRMED, CANCELLED, EXPIRED)
│       ├── ExpiryBar.tsx        # Real-time draining progress bar (green→yellow→red)
│       ├── Modal.tsx            # Overlay modal with ESC key and blur backdrop
│       ├── Spinner.tsx          # CSS spinner (injects @keyframes once)
│       └── Toast.tsx            # ToastStack — slide-in notifications, click to dismiss
├── context/
│   └── AppContext.tsx           # Global: tab, apiBase, online status, toasts, refreshTick
├── types/
│   └── index.ts                 # Shared TypeScript interfaces and enums
├── App.tsx                      # Shell: Sidebar + TopBar + tab router
├── main.tsx                     # ReactDOM.createRoot entry
└── index.css                    # Design system: CSS vars, animations, base component styles
```

---

## Features

### Dashboard
- Live stat cards: Total / Active / Confirmed / Cancelled / Expired
- Recent 8 reservations with real-time expiry bars for ACTIVE holds
- Auto-refreshes every 5 seconds

### Reservations
- Paginated table (15 per page) with status filter chips
- Inline Confirm / Cancel buttons for ACTIVE reservations
- Click any row to open a detail modal with full reservation info and audit log
- Audit log shows status transitions with timestamps and reasons

### New Reservation
- Customer full name field (generates UUID internally, maps name → UUID in localStorage)
- Product quick-select tiles + manual product ID input
- Quantity stepper
- On success: shows result card with live expiry countdown bar

### Simulate
Six runnable scenarios that exercise the backend:

| Scenario | What it tests |
|---|---|
| Concurrent Rush | 10 simultaneous requests — atomicity under load |
| Full Lifecycle | Reserve → Confirm → re-confirm (should fail) → cancel (should fail) |
| Cancel Flow | Reserve → Cancel → duplicate cancel (should fail) |
| Expiry Guard | Confirm a CONFIRMED reservation (state machine rejection) |
| Bulk Create | 20 sequential creates with throughput measurement |
| Stress Test | 50 concurrent mixed operations across 3 phases |

All output streams to a live console panel with colour-coded log levels.

### Settings
- Configure and save the backend base URL
- Test connection button (live probe)
- Customer name cache inspector (view and clear UUID → name mappings)
- API route quick reference card

---

## API Integration

The client calls these backend endpoints:

| Method | Path | Used by |
|---|---|---|
| `GET` | `/reservations` | Dashboard, Reservations list, health check |
| `POST` | `/reservations` | Create form, Simulate scenarios |
| `GET` | `/reservations/:id` | Detail modal |
| `POST` | `/reservations/:id/confirm` | Confirm action |
| `DELETE` | `/reservations/:id` | Cancel action |
| `GET` | `/reservations/:id/logs` | Audit log in detail modal |

Configure the base URL in the **Settings** tab (persisted to `localStorage`). Default: `http://localhost:3000`.

---

## Design System

All visual tokens are CSS custom properties defined in `index.css`:

```css
--bg-base: #07090F        /* page background */
--bg-surface: #0C1018     /* sidebar / topbar */
--bg-card: #111620        /* card surfaces */
--accent: #3AECFF         /* electric cyan — primary accent */
--green: #00D17A          /* ACTIVE / success */
--yellow: #FFB520         /* CANCELLED / warning */
--red: #FF3355            /* EXPIRED / error */
--font-display: 'Syne'
--font-body: 'DM Sans'
--font-mono: 'JetBrains Mono'
```

Animations: `fade-in`, `slide-in`, `blink` (pulsing status dot), `spin` (spinner), `scan` (horizontal sweep).

---

## Customer Name Resolution

The backend works with UUID user IDs. This client layers a name store on top:

1. On create: a UUID is generated client-side; the customer's full name is saved to `localStorage` keyed by that UUID
2. At display time: `nameStore.resolve(userId)` looks up the name, falling back to a truncated UUID for externally-created reservations
3. The name map persists across sessions and can be cleared from the Settings tab

---

## Environment

No `.env` file is required. The API base URL is configured at runtime through the Settings tab and stored in `localStorage` under the key `api_base`.
