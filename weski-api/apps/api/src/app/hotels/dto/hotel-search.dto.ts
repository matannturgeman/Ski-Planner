import { z } from 'zod';

export const HotelSearchDtoSchema = z.object({
  ski_site: z.number().int().positive(),
  from_date: z.string().regex(/^\d{2}\/\d{2}\/\d{4}$/, 'Date must be DD/MM/YYYY'),
  to_date: z.string().regex(/^\d{2}\/\d{2}\/\d{4}$/, 'Date must be DD/MM/YYYY'),
  group_size: z.number().int().min(1).max(10),
});

export type HotelSearchDto = z.infer<typeof HotelSearchDtoSchema>;
