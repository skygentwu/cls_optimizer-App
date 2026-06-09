# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

CLS Optimizer App is a mobile-first React web application for chlor-alkali (氯碱) production optimization. It helps production managers maximize profit margins by recommending optimal daily output ratios for four products: liquid chlorine (液氯), 31% HCl (盐酸), 10% NaClO (次氯酸钠), and 32% NaOH (液碱). The app communicates with a Python FastAPI backend and is packaged as a native Android/iOS app via Capacitor.

## Commands

```bash
npm run dev          # Start dev server at http://localhost:5173
npm run build        # Type-check + Vite production build
npm run typecheck    # TypeScript type check only (no emit)
npm run lint         # ESLint
npm run test         # Run all tests once
npm run test:watch   # Vitest in watch mode
npm run test:coverage # Run tests with V8 coverage report
```

To run a single test file:
```bash
npx vitest run src/stores/appStore.test.ts
```

## Architecture

### State Management (Zustand)
- **`src/stores/authStore.ts`** — Auth state (token, user, isLoggedIn). Uses Zustand `persist` middleware; persisted to `localStorage` under key `cls-auth-storage`. The `clearAuth` action is called automatically on 401 responses.
- **`src/stores/appStore.ts`** — Global business state: prices, NaOH daily output (`naohDaily`), decision modes, system recommendation result, manual simulation result, API base URL, and theme. `apiBaseUrl` is persisted in `localStorage` under `cls_api_base`. On native Capacitor, defaults to `http://10.0.2.2:8000` (Android emulator loopback); in browser dev, defaults to empty string so Vite proxy handles routing.

### API Layer (`src/api/client.ts`)
Single file containing all ~40 API functions. The `request<T>()` helper:
- Reads JWT from `authStore` and injects `Authorization: Bearer` header
- Enforces a 15-second timeout via `AbortController`
- On 401 (non-login endpoint): calls `clearAuth()` and redirects to `#/login`
- URL construction via `buildApiUrl()` deduplicates `/api/api/` prefixes when `apiBaseUrl` already ends with `/api`

In development, Vite proxies `/api/*` and `/healthz` to `http://localhost:8000` (see `vite.config.ts`).

### Routing
`HashRouter` is used (required for Capacitor file:// serving). Auth guard in `src/App.tsx` redirects unauthenticated users to `/login`. Non-dashboard pages use `React.lazy` + `Suspense` for code splitting.

Bottom tab navigation (5 tabs: 概览/对比/趋势/建议/我的) is in `src/components/AppShell.tsx`. Swipe-right from the left edge (x < 40px) triggers `navigate(-1)`.

### Pages
| Route | Page | Purpose |
|---|---|---|
| `/` | DashboardPage | Today's recommendation vs. manual plan, charts, quick nav |
| `/compare` | ComparePage | Decision mode comparison and sensitivity analysis |
| `/trends` | TrendsPage | Price trend charts |
| `/insights` | InsightsPage | LLM-powered operational advice |
| `/backtest` | BacktestPage | Historical backtest analysis |
| `/forecast` | ForecastPage | Price/profit forecast |
| `/margin` | MarginPage | Finance margin analysis |
| `/report` | ReportPage | Advisory report generation and export |
| `/profile` | ProfilePage | Settings, API config, user profile |

### Domain Constants (`src/constants/products.ts`)
- Product keys: `liquid_chlorine`, `hcl31`, `naclo10` (for `ProductPayload`); `naoh32` added for `PricePayload`
- `PRODUCT_LABELS` maps keys to Chinese display names
- Default prices and `DEFAULT_NAOH_DAILY` are used as initial state

### Types (`src/types/index.ts`)
All API request/response types are centralized here. `PricePayload` has 4 keys (incl. `naoh32`); `ProductPayload` has 3 keys (excludes `naoh32`).

## Build Configuration

**Path alias**: `@` → `src/` (configured in both `vite.config.ts` and `tsconfig.app.json`).

**Manual chunks**: `vendor` (react/react-dom/react-router-dom), `charts` (recharts), `mobile` (antd-mobile), `utils` (zustand/dayjs).

**Capacitor** (`capacitor.config.ts`): App ID `com.chloralkali.clsoptimizer`, web dir is `dist`, Android scheme is `https`.

## Testing

Tests use Vitest with jsdom environment. The setup file `src/test/setupTests.ts` mocks:
- `@capacitor/core` — returns `isNativePlatform: false`, `getPlatform: 'web'`
- `window.matchMedia` — needed by antd-mobile responsive components
- `window.localStorage` — in-memory mock to prevent test pollution
- `document.documentElement.setAttribute` — wrapped with `vi.fn()` to allow assertion on theme changes
