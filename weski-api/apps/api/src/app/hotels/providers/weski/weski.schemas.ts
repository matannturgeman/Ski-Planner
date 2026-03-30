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

// ─── Response schemas (matching actual API shape) ────────────────────────────

const WeskiImageSchema = z.object({
  MainImage: z.string().optional(),
  URL: z.string(),
});

const WeskiDistanceSchema = z.object({
  type: z.string(),
  distance: z.string(),
});

const WeskiAccommodationSchema = z.object({
  HotelCode: z.string(),
  HotelName: z.string(),
  HotelDescriptiveContent: z
    .object({
      Images: z.array(WeskiImageSchema).optional().default([]),
    })
    .optional()
    .default({ Images: [] }),
  HotelInfo: z.object({
    Position: z
      .object({
        Distances: z.array(WeskiDistanceSchema).optional().default([]),
      })
      .optional()
      .default({ Distances: [] }),
    Rating: z.string(),
    Beds: z.string(),
  }),
  PricesInfo: z.object({
    AmountAfterTax: z.string(),
    AmountBeforeTax: z.string().optional(),
  }),
});

export type WeskiAccommodation = z.infer<typeof WeskiAccommodationSchema>;

export const WeskiExternalResponseSchema = z.object({
  statusCode: z.number(),
  body: z.object({
    success: z.string(),
    accommodations: z.array(WeskiAccommodationSchema),
  }),
});

export type WeskiExternalResponse = z.infer<typeof WeskiExternalResponseSchema>;
