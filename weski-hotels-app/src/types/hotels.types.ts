import { z } from 'zod';

export const HotelSearchRequestSchema = z.object({
  ski_site: z.number().int().positive(),
  from_date: z.string().regex(/^\d{2}\/\d{2}\/\d{4}$/, 'Date must be DD/MM/YYYY'),
  to_date: z.string().regex(/^\d{2}\/\d{2}\/\d{4}$/, 'Date must be DD/MM/YYYY'),
  group_size: z.number().int().min(1).max(10),
});

export type HotelSearchRequest = z.infer<typeof HotelSearchRequestSchema>;

export const HotelRoomSchema = z.object({
  hotel_code: z.string(),
  hotel_name: z.string(),
  stars: z.number().int().min(0).max(5),
  beds: z.number().int(),
  price: z.number(),
  image_url: z.string().optional(),
  ski_lift_distance: z.string().optional(),
});

export type HotelRoom = z.infer<typeof HotelRoomSchema>;
