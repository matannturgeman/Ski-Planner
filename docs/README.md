# WeSki Full-Stack Assignment — Documentation

Ski-resort hotel search SPA built as a senior full-stack interview assignment for WeSki.

## Table of Contents

| Doc | What it covers |
|-----|----------------|
| [architecture.md](./architecture.md) | System overview, tech stack, key design decisions |
| [backend.md](./backend.md) | NestJS API — modules, providers, SSE endpoint, validation |
| [frontend.md](./frontend.md) | React SPA — components, Redux store, streaming client |
| [data-flow.md](./data-flow.md) | End-to-end request/response flow with sequence diagrams |

## Quick Start

```bash
# Backend (NestJS, port 3000)
cd weski-api
npm run dev:api

# Frontend (Vite, port 5173)
cd weski-hotels-app
npm run dev
```

## Repository Structure

```
weski-fullstack-assignment/
├── weski-api/               # NestJS Nx monorepo (backend)
│   └── apps/api/src/app/
│       └── hotels/          # Entire hotels feature
├── weski-hotels-app/        # Vite + React SPA (frontend)
│   └── src/
│       ├── components/      # UI components
│       ├── store/           # Redux Toolkit + RTK Query
│       ├── types/           # Zod schemas + TypeScript types
│       └── data/            # Static resort data
└── docs/                    # This documentation
```
