# WeSki — Hotel Search Full-Stack Assignment

## Project Summary

This is a full-stack hotel search web application built as a senior full-stack home assignment for WeSki.

The app lets a user search for available ski-resort hotels by selecting a **destination**, **group size** (1–10), and **trip start/end dates**. Results are streamed progressively from an external API provider and displayed sorted by price (ascending).

Key design decisions:
- The backend fans out **parallel requests** for group sizes N, N+1, and N+2, because the external API only returns rooms for the exact group size requested. This surfaces larger-capacity rooms that can still accommodate the group.
- Results are delivered via **Server-Sent Events (SSE)** so the client renders each batch the instant it arrives — no waiting for all requests to finish.
- The provider layer is **interface-driven**, making it trivial to plug in additional hotel API vendors in the future.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend monorepo / Build | Nx 22, pnpm |
| Backend | NestJS 11 (Node.js), TypeScript |
| Frontend | React 18, Redux Toolkit, Vite, SCSS |
| Validation | Zod (API boundary), class-validator (NestJS DTOs) |
| Testing | Jest (unit), Playwright (e2e) |

---

## Project Structure

```
weski-fullstack-assignment/
├── weski-api/               # Nx monorepo — NestJS backend
│   ├── apps/
│   │   └── api/             # NestJS application
│   ├── libs/
│   │   ├── server/
│   │   │   ├── auth/        # JWT auth, guards, decorators
│   │   │   ├── data-access/ # HTTP exception filter, data access helpers
│   │   │   ├── user/        # Current-user middleware & decorator
│   │   │   └── shared/      # Shared server utilities
│   │   └── shared/
│   │       ├── dto/         # Shared DTOs
│   │       ├── types/       # Shared TypeScript types
│   │       └── validation-schemas/ # Shared Zod schemas
└── weski-hotels-app/        # React frontend (standalone Vite app)
    └── src/
```

---

## Prerequisites

- **Node.js** >= 20
- **pnpm** >= 9 for the backend (`npm install -g pnpm`)
- **npm** for the frontend

---

## Running the Backend

```bash
cd weski-api
pnpm install
```

### Configure environment variables

```bash
cp apps/api/.env.example apps/api/.env
```

The defaults work out of the box for local development:

```env
NODE_ENV=development
HOST=localhost
PORT=3000
API_PREFIX=api
CLIENT_URL=http://localhost:5173
HOTELS_API_URL=https://gya7b1xubh.execute-api.eu-west-2.amazonaws.com/default/HotelsSimulator

# Optional — enables Redis caching with a 5-minute TTL (see Redis section below)
# REDIS_URL=redis://localhost:6379
```

### Start the API

```bash
pnpm dev:api
# or: pnpm nx serve api
```

API is available at `http://localhost:3000/api`

### Backend scripts

| Command | Description |
|---|---|
| `pnpm dev:api` | Start the NestJS API in watch mode |
| `pnpm build:api` | Production build of the API |
| `pnpm test` | Run all unit tests across the monorepo |
| `pnpm nx run api-e2e:e2e` | Run API end-to-end tests |
| `pnpm nx graph` | Visualise the project dependency graph |

---

## Redis Caching (Optional)

The backend supports optional Redis caching to reduce external API calls. When enabled, each vendor × group-size combination is cached for **5 minutes** using the search parameters as the cache key.

The app **does not require Redis** — if `REDIS_URL` is not set or Redis is unreachable, caching is silently skipped and everything works normally.

### Start Redis with Docker

```bash
docker run -d --name weski-redis -p 6379:6379 redis:alpine
```

Then uncomment `REDIS_URL` in `weski-api/.env`:

```env
REDIS_URL=redis://localhost:6379
```

### Or use Docker Compose

Create a `docker-compose.yml` at the repo root (or use it to run the full stack together):

```yaml
services:
  redis:
    image: redis:alpine
    ports:
      - "6379:6379"
    restart: unless-stopped
```

```bash
docker compose up -d
```

To stop and remove the container:

```bash
docker compose down
```

---

## Running the Frontend

```bash
cd weski-hotels-app
npm install
npm run dev
```

Frontend is available at `http://localhost:5173`

### Frontend scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Production build |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint |

---

## API Endpoint

### `POST /api/hotels/search/stream`

Streams hotel search results as **Server-Sent Events**.

**Request body:**
```json
{
  "ski_site": 1,
  "from_date": "03/04/2025",
  "to_date": "03/11/2025",
  "group_size": 4
}
```

**Response:** `text/event-stream`

Each `data:` event carries a JSON array of `HotelRoom[]`. A final `event: done` signals completion.

---

## How the Search Works

1. The user fills in the search form (destination, group size, dates) and submits.
2. The backend receives the request and expands the group size to `[N, N+1, N+2]`.
3. For each registered provider × each group size, a parallel HTTP request is fired to the external Hotels API.
4. Each batch of results is emitted over SSE the moment it resolves, filtered to rooms with `adults >= requested group size`.
5. The frontend appends and re-sorts results by price as each SSE batch arrives — no waiting for all requests to complete.
