import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { z } from 'zod';
import { hotelsActions } from './hotels.slice';
import { HotelRoomSchema, type HotelRoom, type HotelSearchRequest } from '../types/hotels.types';

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000/api';

/** Batch array schema for validating each SSE data payload */
const HotelRoomBatchSchema = z.array(HotelRoomSchema);

export const hotelsApi = createApi({
  reducerPath: 'hotelsApi',
  baseQuery: fetchBaseQuery({ baseUrl: BASE_URL }),
  endpoints: (builder) => ({
    /**
     * Triggers the SSE stream via POST.
     * As each vendor result arrives it is dispatched to the hotels slice,
     * giving the UI live, Skyscanner-style progressive updates.
     */
    searchHotels: builder.mutation<HotelRoom[], HotelSearchRequest>({
      queryFn: async (arg, { dispatch, signal }) => {
        dispatch(hotelsActions.startSearch());

        let response: Response;
        try {
          response = await fetch(`${BASE_URL}/hotels/search/stream`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(arg),
            signal,
          });
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : 'Network error';
          dispatch(hotelsActions.setError(message));
          return { error: { status: 'FETCH_ERROR', error: message } };
        }

        if (!response.ok || !response.body) {
          const message = `Search failed (${response.status})`;
          dispatch(hotelsActions.setError(message));
          return { error: { status: response.status, error: message } };
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        const allRooms: HotelRoom[] = [];
        let buffer = '';

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });

            // Process complete SSE lines from the buffer
            const lines = buffer.split('\n');
            buffer = lines.pop() ?? ''; // keep incomplete last line

            for (const line of lines) {
              if (!line.startsWith('data: ')) continue;
              const raw = line.slice(6).trim();
              if (!raw || raw === '{}') continue;

              const parsed = HotelRoomBatchSchema.safeParse(JSON.parse(raw));
              if (parsed.success && parsed.data.length > 0) {
                allRooms.push(...parsed.data);
                dispatch(hotelsActions.addBatch(parsed.data));
              }
            }
          }
        } catch (err: unknown) {
          // AbortError is expected when user triggers a new search — treat as normal
          if (err instanceof Error && err.name !== 'AbortError') {
            dispatch(hotelsActions.setError('Stream interrupted'));
          }
        } finally {
          dispatch(hotelsActions.finishSearch());
        }

        return { data: allRooms.sort((a, b) => a.price - b.price) };
      },
    }),
  }),
});

export const { useSearchHotelsMutation } = hotelsApi;
