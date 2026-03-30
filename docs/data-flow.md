# Data Flow

## Search Request Lifecycle

### 1. User submits the search form

```
User clicks "Search"
       │
       ▼
SearchForm.handleSearch()
  ├── HotelSearchRequestSchema.safeParse(formValues)
  │       ├── FAIL → show inline validation error, stop
  │       └── OK  → dispatch searchHotels(parsedData)   [RTK Query mutation]
  │
  ▼
hotelsApi.searchHotels.queryFn()
  ├── dispatch hotelsActions.startSearch({ meta, params })
  │       → Redux: results=[], isStreaming=true, error=null, lastSearch=meta
  │
  └── fetch("POST /api/hotels/search/stream", { body: JSON.stringify(params) })
```

### 2. Backend receives the request

```
POST /api/hotels/search/stream  { ski_site, from_date, to_date, group_size }
       │
       ▼
HotelsController.searchStream()
  ├── HotelSearchDtoSchema.safeParse(body)
  │       ├── FAIL → res.status(400).json({ errors })
  │       └── OK  →
  │
  ├── Set headers: Content-Type: text/event-stream
  ├── res.flushHeaders()   ← HTTP 200 sent, stream opens
  │
  └── hotelsService.streamSearch(dto)
              │
              ▼
          expandGroupSizes(N) → [N, N+1, N+2]
              │
              ▼
          providers.flatMap × groupSizes
          = [ weski(N), weski(N+1), weski(N+2) ]
              │
              ▼
          RxJS merge(weski(N), weski(N+1), weski(N+2))
          — all three HTTP calls fire simultaneously —
```

### 3. Vendor calls (parallel)

```
WeskiProvider.searchRooms({ group_size: N })     ─┐
WeskiProvider.searchRooms({ group_size: N+1 })   ─┼─► POST WeSki Mock API (each with 10s timeout)
WeskiProvider.searchRooms({ group_size: N+2 })   ─┘

Each call:
  1. WeskiExternalRequestSchema.parse(params)    [validates outgoing body]
  2. fetch(HOTELS_API_URL, { signal: AbortController.signal })
  3. WeskiExternalResponseSchema.safeParse(raw)  [validates API response]
  4. Map accommodations → HotelRoom[] (normalize strings to numbers, pick main image)
  5. Return [] on any error (timeout / non-2xx / validation failure)
```

### 4. SSE stream emissions (as each vendor call resolves)

As each of the three `Promise<HotelRoom[]>` resolves, RxJS `merge()` emits it immediately:

```
t=0ms  → merge subscribes, all 3 fetches fire in parallel
t=800ms → weski(N+1) resolves → filter(beds >= N) → emit batch
           controller writes:  data: [{...}, {...}]\n\n
t=950ms → weski(N) resolves   → emit batch
           controller writes:  data: [{...}]\n\n
t=1200ms→ weski(N+2) resolves → emit batch (may be empty, filtered out)
           Observable completes
           controller writes:  event: done\ndata: {}\n\n
           res.end()
```

### 5. Client reads the stream

```
fetch response.body (ReadableStream)
  │
  ├── reader.read() loop
  │       │
  │       ├── Decode Uint8Array → string, append to buffer
  │       ├── Split on '\n', keep last incomplete line in buffer
  │       │
  │       └── For each line starting with "data: ":
  │               HotelRoomBatchSchema.safeParse(JSON.parse(raw))
  │                     ├── OK  → dispatch hotelsActions.addBatch(rooms)
  │                     │           Redux: results=[...sorted by price]
  │                     │           React re-renders hotel list
  │                     └── FAIL → skip (malformed line)
  │
  └── "event: done" line or reader done
          dispatch hotelsActions.finishSearch()
          Redux: isStreaming=false
```

---

## Sequence Diagram

```
Browser          Redux        hotelsApi        NestJS        WeSki API
   │                │               │              │               │
   │──submit form──►│               │              │               │
   │                │◄─startSearch──│              │               │
   │                │               │──POST /stream►│               │
   │                │               │              │──POST N ──────►│
   │                │               │              │──POST N+1 ────►│
   │                │               │              │──POST N+2 ────►│
   │                │               │              │◄── rooms(N+1) ─│
   │                │               │◄──data event─│               │
   │                │◄──addBatch────│              │               │
   │◄── re-render ──│               │              │               │
   │                │               │              │◄── rooms(N) ──│
   │                │               │◄──data event─│               │
   │                │◄──addBatch────│              │               │
   │◄── re-render ──│               │              │               │
   │                │               │              │◄── rooms(N+2)─│
   │                │               │◄──done event─│               │
   │                │◄─finishSearch─│              │               │
   │◄── final render│               │              │               │
```

---

## Error Paths

| Where | What happens |
|-------|-------------|
| Frontend form validation fails | Inline error shown, no request sent |
| Backend DTO validation fails | `400 JSON` response, `hotelsActions.setError` dispatched |
| Vendor HTTP error / timeout | Provider returns `[]`, other vendors unaffected |
| Vendor response fails Zod | Warning logged, `[]` returned, stream continues |
| SSE stream interrupted (network) | `hotelsActions.setError('Stream interrupted')` |
| User disconnects mid-stream | `res.on('close')` → `subscription.unsubscribe()` → all pending fetches aborted |
| Image load fails / times out | `HotelImage` falls back to `placehold.co` placeholder |

---

## Data Transformation Summary

```
Frontend form values
  │  dayjs(Date).format('DD/MM/YYYY')
  ▼
HotelSearchRequest  { ski_site: 1, from_date: "03/04/2025", ... }
  │  JSON.stringify → POST body
  ▼
Backend HotelSearchDto  (Zod validated, same shape)
  │  WeskiExternalRequestSchema.parse → wraps in { query: {...} }
  ▼
WeSki API request  { "query": { "ski_site": 1, ... } }
  │  WeskiExternalResponseSchema.safeParse
  ▼
WeskiAccommodation[]  (raw external shape with string numbers)
  │  normalize(): parseInt, parseFloat, pick main image, find ski_lift distance
  ▼
HotelRoom[]  { hotel_code, hotel_name, stars: number, beds: number, price: number, ... }
  │  JSON.stringify → SSE data event
  ▼
HotelRoomBatchSchema.safeParse (client-side validation)
  │  hotelsActions.addBatch → sort by price
  ▼
HotelCard rendered in the browser
```
