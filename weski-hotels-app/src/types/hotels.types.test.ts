import { describe, it, expect } from 'vitest';
import { HotelSearchRequestSchema, HotelRoomSchema } from './hotels.types';

describe('HotelSearchRequestSchema', () => {
  const valid = {
    ski_site: 1,
    from_date: '01/01/2025',
    to_date: '10/01/2025',
    group_size: 2,
  };

  it('accepts a valid request', () => {
    expect(HotelSearchRequestSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects ski_site = 0', () => {
    expect(HotelSearchRequestSchema.safeParse({ ...valid, ski_site: 0 }).success).toBe(false);
  });

  it('rejects negative ski_site', () => {
    expect(HotelSearchRequestSchema.safeParse({ ...valid, ski_site: -1 }).success).toBe(false);
  });

  it('rejects group_size = 0', () => {
    expect(HotelSearchRequestSchema.safeParse({ ...valid, group_size: 0 }).success).toBe(false);
  });

  it('rejects group_size > 10', () => {
    expect(HotelSearchRequestSchema.safeParse({ ...valid, group_size: 11 }).success).toBe(false);
  });

  it('accepts group_size at boundary values 1 and 10', () => {
    expect(HotelSearchRequestSchema.safeParse({ ...valid, group_size: 1 }).success).toBe(true);
    expect(HotelSearchRequestSchema.safeParse({ ...valid, group_size: 10 }).success).toBe(true);
  });

  it('rejects dates not in DD/MM/YYYY format', () => {
    expect(HotelSearchRequestSchema.safeParse({ ...valid, from_date: '2025-01-01' }).success).toBe(false);
    expect(HotelSearchRequestSchema.safeParse({ ...valid, to_date: '1/1/2025' }).success).toBe(false);
  });

  it('accepts dates in DD/MM/YYYY format', () => {
    expect(HotelSearchRequestSchema.safeParse({ ...valid, from_date: '31/12/2025' }).success).toBe(true);
  });

  it('rejects missing fields', () => {
    const { ski_site: _, ...withoutSkiSite } = valid;
    expect(HotelSearchRequestSchema.safeParse(withoutSkiSite).success).toBe(false);
  });
});

describe('HotelRoomSchema', () => {
  const valid = {
    hotel_code: 'HTL001',
    hotel_name: 'Alpine Resort',
    stars: 4,
    beds: 2,
    price: 499.99,
  };

  it('accepts a valid room', () => {
    expect(HotelRoomSchema.safeParse(valid).success).toBe(true);
  });

  it('accepts optional fields when present', () => {
    const withOptionals = { ...valid, image_url: 'https://example.com/img.jpg', ski_lift_distance: '200m' };
    expect(HotelRoomSchema.safeParse(withOptionals).success).toBe(true);
  });

  it('accepts room without optional fields', () => {
    expect(HotelRoomSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects stars < 0', () => {
    expect(HotelRoomSchema.safeParse({ ...valid, stars: -1 }).success).toBe(false);
  });

  it('rejects stars > 5', () => {
    expect(HotelRoomSchema.safeParse({ ...valid, stars: 6 }).success).toBe(false);
  });

  it('accepts stars at boundary values 0 and 5', () => {
    expect(HotelRoomSchema.safeParse({ ...valid, stars: 0 }).success).toBe(true);
    expect(HotelRoomSchema.safeParse({ ...valid, stars: 5 }).success).toBe(true);
  });

  it('rejects non-integer stars', () => {
    expect(HotelRoomSchema.safeParse({ ...valid, stars: 3.5 }).success).toBe(false);
  });

  it('rejects missing required fields', () => {
    const { hotel_name: _, ...withoutName } = valid;
    expect(HotelRoomSchema.safeParse(withoutName).success).toBe(false);
  });
});
