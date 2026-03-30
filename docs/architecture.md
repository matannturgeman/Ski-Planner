# Architecture Overview

## System Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│  Browser (localhost:5173)                                        │
│                                                                  │
│   ┌──────────────┐    ┌────────────────────────────────────┐    │
│   │  SearchForm  │    │  HotelResults                      │    │
│   │  (NavBar)    │    │  ├── skeleton cards (streaming)    │    │
│   │              │    │  └── HotelCard × N (sorted £)      │    │
│   └──────┬───────┘    └──────────────────────────────────┬─┘    │
│          │  dispatch searchHotels()                       │      │
│          ▼                                                │      │
│   ┌──────────────────────────────────────────────────┐   │      │
│   │  Redux Store                                     │   │      │
│   │  hotels.slice  ◄──── hotelsApi (RTK Query)  ────►│   │      │
│   │  { results[], isStreaming, lastSearch }           │   │      │
│   └──────────────────────┬───────────────────────────┘   │      │
│                          │ fetch streaming (POST SSE)     │      │
└──────────────────────────┼─────────────────────────────────────-┘
                           │
                    HTTP (localhost:3000)
                           │
┌──────────────────────────┼──────────────────────────────────────┐
│  NestJS API               │                                      │
│                           ▼                                      │
│   POST /api/hotels/search/stream                                 │
│          │                                                       │
│          ▼                                                       │
│   HotelsController ──► HotelsService                            │
│                              │ RxJS merge()                      │
│                              │                                   │
│            ┌─────────────────┼──────────────────┐               │
│            ▼                 ▼                  ▼               │
│       group N          group N+1          group N+2             │
│            │                 │                  │               │
│            └─────────────────┴──────────────────┘               │
│                              │                                   │
│                       WeskiProvider                              │
│                              │                                   │
└──────────────────────────────┼──────────────────────────────────┘
                               │ HTTPS POST
                               ▼
                  WeSki Mock API (AWS Lambda)
```

---

## Tech Stack

### Backend

| Technology | Version | Role |
|------------|---------|------|
| **NestJS** | v11 | HTTP framework, DI container, decorators |
| **Nx** | v22 | Monorepo tooling, task runner |
| **RxJS** | v7 | Concurrent fan-out with `merge()`, Observable streams |
| **Zod** | v3 | Runtime validation at all data boundaries |
| **TypeScript** | v5 | Static typing across the codebase |
| **pnpm** | — | Package manager |

### Frontend

| Technology | Version | Role |
|------------|---------|------|
| **React** | v19 | UI rendering |
| **Vite** | v6 | Dev server, bundler |
| **Redux Toolkit** | v2 | Global state management |
| **RTK Query** | v2 | Data fetching layer with `queryFn` override |
| **Zod** | v3 | Runtime validation of streamed SSE payloads |
| **dayjs** | — | Date formatting (DD/MM/YYYY ↔ display labels) |
| **react-datepicker** | — | Calendar date range picker |
| **SCSS** | — | Component-scoped styles |
| **TypeScript** | v5 | Static typing |

---

## Key Design Decisions

### 1. SSE over WebSocket / long polling
Server-Sent Events allow the backend to push hotel batches to the client as each vendor call resolves. SSE is unidirectional and HTTP/1.1-compatible — no extra infrastructure required.

### 2. POST for the SSE endpoint (not GET)
The native `EventSource` API only supports GET requests. Because the search parameters are structured JSON (not URL-safe), the endpoint is a `POST`. The client opens the stream with `fetch()` and reads `response.body` as a `ReadableStream` manually.

### 3. Group-size expansion (N, N+1, N+2)
The external WeSki API returns rooms for the **exact** group size requested. A party of 3 searching for 3-bed rooms would miss a 4-bed room that could accommodate them. The service fires three parallel calls (N, N+1, N+2) and filters the results server-side to `beds >= requested_group_size`.

### 4. RxJS `merge()` for concurrent fan-out
`merge(...streams)` subscribes to all provider × group-size Observables simultaneously and emits each batch the moment it resolves — identical to how Skyscanner / Google Flights stream progressive results. There is no waiting for the slowest vendor.

### 5. Multi-vendor via `HOTELS_PROVIDERS` injection token
`IHotelsProvider` is an interface; all vendors are injected via the `HOTELS_PROVIDERS` multi-provider token. Adding a second vendor (e.g. Booking.com) requires:
1. A new class implementing `IHotelsProvider`
2. One extra line in `hotels.module.ts`

`HotelsService` and `HotelsController` need zero changes.

### 6. Zod at three validation boundaries

```
Frontend input  ──Zod──►  Backend DTO  ──Zod──►  External API response
(HotelSearchRequestSchema)  (HotelSearchDtoSchema)   (WeskiExternalResponseSchema)
```

Each boundary validates independently so bad data is caught early and errors are specific.

### 7. Progressive UI updates (no spinner blocking)
Each SSE batch dispatches `hotelsActions.addBatch()` to the Redux store. The results list re-renders and sorts by price on every batch arrival. Users see the first results within seconds, not after all vendors complete.
