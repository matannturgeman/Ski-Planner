# Frontend — React SPA

## Project Layout

```
weski-hotels-app/src/
├── App.tsx                          # Root component, auto-search on mount
├── main.tsx                         # React entry point, Redux Provider
├── store/
│   ├── store.ts                     # Redux store configuration
│   ├── hotels.api.ts                # RTK Query mutation (streaming fetch)
│   └── hotels.slice.ts              # Hotels reducer (accumulates batches)
├── types/
│   └── hotels.types.ts              # Zod schemas + TypeScript types
├── data/
│   └── resorts.ts                   # Resort ID → name mapping
└── components/
    ├── navbar/
    │   └── nav-bar.tsx              # Top bar with logo + SearchForm
    ├── weski-logo/
    │   └── weski-logo.tsx           # SVG logo
    ├── search-form/
    │   ├── search-form.tsx          # Unified search bar
    │   ├── resorts-select/          # Destination dropdown
    │   ├── guests-select/           # Group size selector
    │   └── search-button/           # Submit button
    ├── select/
    │   └── select.tsx               # Reusable dropdown primitive
    └── hotel-results/
        └── hotel-results.tsx        # Result list, cards, skeletons
```

---

## Types and Validation (`types/hotels.types.ts`)

All data shapes are defined with Zod and TypeScript types are inferred from them, ensuring runtime and compile-time safety are always in sync.

```typescript
// Search request sent to the backend
HotelSearchRequestSchema = z.object({
  ski_site:   z.number().int().positive(),
  from_date:  z.string().regex(/^\d{2}\/\d{2}\/\d{4}$/),   // DD/MM/YYYY
  to_date:    z.string().regex(/^\d{2}\/\d{2}\/\d{4}$/),
  group_size: z.number().int().min(1).max(10),
})

// Single hotel room received from SSE stream
HotelRoomSchema = z.object({
  hotel_code:        z.string(),
  hotel_name:        z.string(),
  stars:             z.number().int().min(0).max(5),
  beds:              z.number().int(),
  price:             z.number(),
  image_url:         z.string().optional(),
  ski_lift_distance: z.string().optional(),
})
```

---

## Redux Store (`store/`)

### State shape (`hotels.slice.ts`)

```typescript
interface HotelsState {
  results:          HotelRoom[];        // accumulated + price-sorted
  isStreaming:      boolean;            // true while SSE stream is open
  error:            string | null;      // network / parse error message
  lastSearch:       LastSearchMeta | null;  // display meta (resort, dates, group)
  lastSearchParams: HotelSearchRequest | null;  // stored for retry
}
```

### Actions

| Action | When dispatched | Effect |
|--------|----------------|--------|
| `startSearch` | Before fetch begins | Clears results, sets `isStreaming: true`, stores meta |
| `addBatch` | On each SSE `data:` event | Appends batch, re-sorts by price ascending |
| `finishSearch` | SSE stream ends or reader exits | Sets `isStreaming: false` |
| `setError` | Fetch or stream error | Stores error message, sets `isStreaming: false` |

### Streaming API (`hotels.api.ts`)

RTK Query's `queryFn` override is used because the standard `query` option cannot handle streaming responses. The function:

1. Dispatches `startSearch` with display metadata before any HTTP activity.
2. Opens a `fetch()` POST to `POST /api/hotels/search/stream`.
3. Reads `response.body` as a `ReadableStream` with `getReader()`.
4. Accumulates incomplete lines in a `buffer` string — SSE frames can span chunk boundaries.
5. For each complete `data: ...` line:
   - Strips the `data: ` prefix.
   - Parses JSON and validates with `HotelRoomBatchSchema.safeParse()`.
   - Dispatches `addBatch` on success; silently skips malformed lines.
6. Dispatches `finishSearch` in the `finally` block (always runs).
7. Returns `{ data: allRooms.sort((a, b) => a.price - b.price) }` as the mutation result.

Client disconnection and `AbortError` (e.g. user navigates away) are handled gracefully and do not set an error state.

---

## Components

### `App.tsx`
Root component. On mount, fires a default search after 1.5 s (Val Thorens, 1 guest, Apr 3–11 2025) so the page is not empty on first load.

### `NavBar` / `SearchForm`
The navbar hosts the `SearchForm` inline. The form contains three segments in a single horizontal pill:

```
[ Destination ▼ ] | [ Guests ▼ ] | [📅 Apr 3 – Apr 11] | [🔍 Search]
```

- **ResortsSelect** — dropdown of 5 fixed ski resorts (Val Thorens, Courchevel, Tignes, La Plagne, Chamonix).
- **GuestsSelect** — numeric group size 1–10.
- **DatePicker** — `react-datepicker` calendar range. `endDate` is constrained to `minDate = startDate`.
- Input is validated with `HotelSearchRequestSchema.safeParse()` before dispatching. A red error message appears below the form on failure.

### `HotelResults`

Reads from Redux state: `results`, `isStreaming`, `error`, `lastSearch`, `lastSearchParams`.

**States:**

| Condition | Rendered |
|-----------|----------|
| `error !== null` | Error message + "Try again" button (re-dispatches `lastSearchParams`) |
| `!lastSearch` | Nothing (initial blank state) |
| `isStreaming && results.length === 0` | 3 skeleton placeholder cards |
| `isStreaming && results.length > 0` | Cards + subtitle "N found so far…" |
| `!isStreaming && results.length === 0` | "No hotels found" message |
| `!isStreaming && results.length > 0` | Full result list |

**`HotelCard`** — horizontal card layout:
- Left: hotel image (215×150, fallback to `placehold.co` after 3 s timeout or on error).
- Right: hotel name, star rating (5-star ★ row), resort location, ski-lift distance, bed capacity, price in GBP.

**`HotelImage`** — image component with a 3-second load timeout. If the image URL hasn't loaded within 3 s or fires `onError`, it falls back to a placeholder. This prevents broken images from external URLs stalling the UI.

**`HotelCardSkeleton`** — animated loading placeholder shown while the first SSE batch is in-flight.

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_BASE_URL` | `http://localhost:3000/api` | Backend API base URL |
