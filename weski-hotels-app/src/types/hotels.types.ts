import { z } from 'zod';

export const HotelSearchRequestSchema = z.object({
  ski_site: z.number().int().positive(),
  from_date: z.string().regex(/^\d{2}\/\d{2}\/\d{4}$/, 'Date must be DD/MM/YYYY'),
  to_date: z.string().regex(/^\d{2}\/\d{2}\/\d{4}$/, 'Date must be DD/MM/YYYY'),
  group_size: z.number().int().min(1).max(10),
});

export type HotelSearchRequest = z.infer<typeof HotelSearchRequestSchema>;

export const HotelRoomSchema = z.object({
  hotel_name: z.string(),
  room_name: z.string(),
  meal: z.string().optional().default(''),
  price: z.number(),
  adults: z.number().int(),
  stars: z.number().int().min(1).max(5).optional(),
});

export type HotelRoom = z.infer<typeof HotelRoomSchema>;
