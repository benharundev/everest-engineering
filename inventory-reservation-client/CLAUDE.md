# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Commands

```bash
npm run dev       # start Vite dev server at http://localhost:5173
npm run build     # tsc + vite build (must pass before any commit)
npm run preview   # serve dist/ locally
```

Use the Homebrew node if the system node is not on PATH:
```bash
PATH="/opt/homebrew/bin:$PATH" npm run dev
```

---

## Architecture

### Layer map

```
src/
├── api/client.ts        ← all HTTP — never call fetch() outside here
├── context/AppContext.tsx ← global state (tab, apiBase, toasts, refreshTick, online)
├── types/index.ts       ← all shared interfaces — add new types here
├── components/
│   ├── Layout/          ← Sidebar, TopBar — structural chrome only
│   ├── shared/          ← reusable: Badge, ExpiryBar, Modal, Spinner, Toast
│   └── <Tab>/           ← one folder per tab, one component per folder
└── index.css            ← design tokens + global styles — no Tailwind, no CSS-in-JS
```

### Key rules

- **No CSS libraries.** All styling uses inline styles with CSS custom properties from `index.css`. Use `className="card"`, `"btn"`, `"btn-primary"`, `"btn-sm"`, `"btn-success"`, `"btn-danger"` for base styles. Everything else is inline.
- **No routing library.** Tab switching is handled by `useApp().setTab()` and a conditional render block in `App.tsx`.
- **No state management library.** React Context + `useState` only. Do not add Redux, Zustand, or Jotai.
- **All API calls go through `api.*`** in `src/api/client.ts`. Do not add `axios` or any HTTP library.
- **TypeScript strict mode is on.** No `any` without a comment explaining why. No `ts-ignore`.

---

## Design System

### CSS variables (index.css)

```
--bg-base, --bg-surface, --bg-card, --bg-card2
--border
--accent, --accent-dim, --accent-glow
--green, --green-dim
--yellow, --yellow-dim
--red, --red-dim
--purple
--text, --text-muted, --text-dim
--font-display ('Syne'), --font-body ('DM Sans'), --font-mono ('JetBrains Mono')
```

### Animations available as className

- `fade-in` — opacity 0→1 over 0.25s
- `slide-in` — translateY 12px→0 over 0.25s
- `dot-grid` — dot pattern background (apply to the main content wrapper)

### Blink keyframe

Used for pulsing status dots. Apply via inline style:
```tsx
animation: 'blink 1.4s ease-in-out infinite'
```

---

## State

### AppContext values

| Value | Type | Purpose |
|---|---|---|
| `tab` | `TabId` | Current active tab |
| `setTab` | `(t: TabId) => void` | Navigate to tab |
| `apiBase` | `string` | Backend URL, persisted to localStorage |
| `setApiBase` | `(url: string) => void` | Save + update API base |
| `online` | `boolean` | Backend health — checked every 5s |
| `toast` | `(msg, type?) => void` | Show a toast notification |
| `toasts` | `Toast[]` | Active toasts (consumed by ToastStack) |
| `dismissToast` | `(id) => void` | Remove a toast |
| `refreshTick` | `number` | Increments every 5s — use as `useEffect` dep to auto-refresh |
| `triggerRefresh` | `() => void` | Manually trigger a refresh tick |

### localStorage keys

| Key | Value |
|---|---|
| `api_base` | Backend base URL string |
| `userNameMap` | JSON object `{ [uuid]: fullName }` |

---

## Patterns

### Data fetching in a tab component

```tsx
useEffect(() => {
  let cancelled = false;
  api.getSomething().then((r) => {
    if (cancelled) return;
    if (r.ok) setData(r.data);
  });
  return () => { cancelled = true; };
}, [refreshTick]); // re-runs on auto-refresh and manual trigger
```

### Customer name display

```tsx
import { nameStore } from '../../api/client';
// Display: name if known, else truncated UUID
nameStore.resolve(r.userId) ?? r.userId.slice(0, 8) + '…'
```

### Creating a reservation (name → UUID)

```tsx
import { uuid4, nameStore } from '../../api/client';
const userId = uuid4();
nameStore.save(userId, fullName); // persist before the API call
await api.create({ productId, userId, quantity });
```

### Adding a new tab

1. Create `src/components/<TabName>/<TabName>.tsx`
2. Add `TabId` value to `src/types/index.ts`
3. Add nav entry to `NAV` array in `Sidebar.tsx`
4. Add label/description to maps in `TopBar.tsx`
5. Add render branch in `App.tsx`

---

## Build requirements

`npm run build` must exit 0 before any change is considered done. This runs `tsc` (strict) then `vite build`. Common issues:

- Unused imports → remove them (strict `noUnusedLocals` is on)
- Implicit `any` in callbacks → add explicit parameter type
- Missing `as const` on string literals assigned to union types

---

## What not to change

- Do not change the font stack. Syne + DM Sans + JetBrains Mono is intentional.
- Do not change the colour palette CSS variables — they are referenced across every component.
- Do not replace inline styles with a CSS framework.
- Do not introduce a router library — the tab model is intentionally simple.
- Do not add a test framework without discussion — there are currently no tests in this package.
