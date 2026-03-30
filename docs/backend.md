# Backend — NestJS API

## Project Layout

```
weski-api/
└── apps/api/src/app/
    ├── app.module.ts               # Root module (ConfigModule + HotelsModule)
    └── hotels/
        ├── hotels.module.ts        # Feature module + provider wiring
        ├── hotels.controller.ts    # POST /hotels/search/stream
        ├── hotels.service.ts       # Fan-out logic (RxJS merge)
        ├── dto/
        │   └── hotel-search.dto.ts # Incoming request validation (Zod)
        └── providers/
            ├── hotels-provider.interface.ts   # IHotelsProvider contract
            └── weski/
                ├── weski.provider.ts          # HTTP call + normalization
                └── weski.schemas.ts           # External API Zod schemas
```

---

## Module Wiring (`hotels.module.ts`)

```typescript
@Module({
  controllers: [HotelsController],
  providers: [
    WeskiProvider,
    {
      provide: HOTELS_PROVIDERS,       // injection token
      useFactory: (...providers) => providers,
      inject: [WeskiProvider],
    },
    HotelsService,
  ],
})
export class HotelsModule {}
```

`HOTELS_PROVIDERS` is a multi-value injection token. `HotelsService` receives an `IHotelsProvider[]` array. To add a second vendor (e.g. `BookingProvider`), add it to `inject` and the factory — no other file changes needed.

---

## DTO Validation (`dto/hotel-search.dto.ts`)

Validates the JSON body sent by the frontend before any processing begins.

```
Field        Type              Constraint
-----------  ----------------  ----------------------------------------
ski_site     integer           positive
from_date    string (regex)    DD/MM/YYYY
to_date      string (regex)    DD/MM/YYYY
group_size   integer           1–10
```

Validation uses `HotelSearchDtoSchema.safeParse(body)` in the controller. On failure, a `400` JSON response is returned immediately.

---

## Controller (`hotels.controller.ts`)

**Endpoint:** `POST /api/hotels/search/stream`

### Flow

1. Parse and validate the request body with Zod — return `400` on failure.
2. Set SSE response headers:
   - `Content-Type: text/event-stream`
   - `Cache-Control: no-cache`
   - `Connection: keep-alive`
3. Call `hotelsService.streamSearch()` which returns an `Observable<HotelRoom[]>`.
4. Subscribe and pipe each emission as an SSE `data:` event:
   ```
   data: [{hotel_code: "...", hotel_name: "...", ...}]\n\n
   ```
5. On stream completion, send `event: done\ndata: {}\n\n` and close the response.
6. On error, send `event: error\ndata: {"message":"..."}\n\n` and close.
7. On client disconnect (`res.on('close')`), unsubscribe the RxJS subscription — this cancels all in-flight vendor HTTP requests via `AbortController`.

---

## Service (`hotels.service.ts`)

### Group-size expansion

```typescript
const GROUP_SIZE_EXPANSION = 2;

private expandGroupSizes(groupSize: number): number[] {
  // e.g. input 3 → [3, 4, 5]
  return Array.from({ length: 3 }, (_, i) => groupSize + i);
}
```

### Fan-out

For each registered provider × each group size, the service creates an RxJS `from(Promise)` stream. All streams are merged with `merge()`:

```typescript
const streams = this.providers.flatMap((provider) =>
  groupSizes.map((gs) =>
    from(provider.searchRooms({ ...params, group_size: gs })
      .then(rooms => rooms.filter(r => r.beds >= dto.group_size)))
  )
);

return merge(...streams).pipe(
  filter(batch => batch.length > 0),
);
```

The observable emits one `HotelRoom[]` per resolved call. Empty batches are filtered out.

---

## WeSki Provider (`providers/weski/weski.provider.ts`)

Implements `IHotelsProvider`. Handles:
- Reading `HOTELS_API_URL` from `ConfigService`
- Building the external request body
- 10-second timeout via `AbortController`
- Zod validation of the external response
- Normalizing `WeskiAccommodation` → `HotelRoom`

### Normalization logic

```
External field                           → HotelRoom field
────────────────────────────────────────────────────────────
HotelCode                                → hotel_code
HotelName                                → hotel_name
HotelInfo.Rating (string)                → stars (parsed int)
HotelInfo.Beds (string)                  → beds (parsed int)
PricesInfo.AmountAfterTax (string)       → price (parsed float)
HotelDescriptiveContent.Images[MainImage='True'].URL → image_url
HotelInfo.Position.Distances[type='ski_lift'].distance → ski_lift_distance
```

On any error (timeout, non-2xx, validation failure) the provider returns `[]` and logs a warning — it never throws, so one failing vendor does not interrupt other concurrent calls.

---

## External API Contract

```
URL:    POST https://gya7b1xubh.execute-api.eu-west-2.amazonaws.com/default/HotelsSimulator
Body:   { "query": { "ski_site": 1, "from_date": "03/04/2025",
                     "to_date": "11/04/2025", "group_size": 2 } }

Response:
{
  "statusCode": 200,
  "body": {
    "success": "true",
    "accommodations": [
      {
        "HotelCode": "...",
        "HotelName": "...",
        "HotelInfo": { "Rating": "4", "Beds": "3",
                       "Position": { "Distances": [{ "type": "ski_lift", "distance": "50m" }] } },
        "HotelDescriptiveContent": { "Images": [{ "URL": "...", "MainImage": "True" }] },
        "PricesInfo": { "AmountAfterTax": "1200.00" }
      }
    ]
  }
}
```

The API returns rooms for the **exact** group size requested. Rooms for larger group sizes are returned only when the query specifies that group size explicitly — hence the N/N+1/N+2 parallel calls.

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | NestJS listen port |
| `CLIENT_URL` | `http://localhost:5173` | CORS allowed origin |
| `HOTELS_API_URL` | _(required)_ | WeSki mock API endpoint |
