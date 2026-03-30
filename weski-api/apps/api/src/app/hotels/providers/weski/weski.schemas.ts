import { z } from 'zod';

/** Schema for validating the request we send to the WeSki external API */
export const WeskiExternalRequestSchema = z.object({
  query: z.object({
    ski_site: z.number().int().positive(),
    from_date: z.string(),
    to_date: z.string(),
    group_size: z.number().int().positive(),
  }),
});

export type WeskiExternalRequest = z.infer<typeof WeskiExternalRequestSchema>;

/** Schema for a single hotel room returned by the WeSki external API */
export const WeskiHotelRoomSchema = z.object({
  hotel_name: z.string(),
  room_name: z.string(),
  meal: z.string().optional().default(''),
  price: z.number(),
  adults: z.number().int(),
});

export type WeskiHotelRoom = z.infer<typeof WeskiHotelRoomSchema>;

/**
 * Schema for the full external API response.
 * Handles both `{ results: [...] }` and `[...]` response shapes.
 */
export const WeskiExternalResponseSchema = z.union([
  z.object({ results: z.array(WeskiHotelRoomSchema) }),
  z.array(WeskiHotelRoomSchema),
]);

export type WeskiExternalResponse = z.infer<typeof WeskiExternalResponseSchema>;
