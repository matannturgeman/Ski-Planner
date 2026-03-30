import { ConfigService } from '@nestjs/config';
import { WeskiProvider } from './weski.provider';

const MOCK_API_URL = 'https://mock-hotels-api.example.com';

const mockConfigService = {
  getOrThrow: jest.fn().mockReturnValue(MOCK_API_URL),
} as unknown as ConfigService;

const makeApiAccommodation = (overrides: Record<string, unknown> = {}) => ({
  HotelCode: 'PWCSTAMAR',
  HotelName: 'Chalet Maroi',
  HotelDescriptiveContent: {
    Images: [
      { MainImage: 'True', URL: 'https://example.com/main.jpg' },
      { URL: 'https://example.com/other.jpg' },
    ],
  },
  HotelInfo: {
    Position: {
      Latitude: '45.29',
      Longitude: '6.57',
      Distances: [
        { type: 'ski_lift', distance: '340m' },
        { type: 'city_center', distance: '220m' },
      ],
    },
    Rating: '4',
    Beds: '3',
  },
  PricesInfo: {
    AmountAfterTax: '423.23',
    AmountBeforeTax: '410.12',
  },
  ...overrides,
});

const makeApiResponse = (accommodations = [makeApiAccommodation()]) => ({
  statusCode: 200,
  body: { success: 'true', accommodations },
});

describe('WeskiProvider', () => {
  let provider: WeskiProvider;

  beforeEach(() => {
    provider = new WeskiProvider(mockConfigService);
    global.fetch = jest.fn();
  });

  afterEach(() => jest.restoreAllMocks());

  it('sends correct request format to external API', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => makeApiResponse(),
    });

    await provider.searchRooms({
      ski_site: 1,
      from_date: '03/04/2025',
      to_date: '03/11/2025',
      group_size: 2,
    });

    expect(global.fetch).toHaveBeenCalledWith(
      MOCK_API_URL,
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          query: { ski_site: 1, from_date: '03/04/2025', to_date: '03/11/2025', group_size: 2 },
        }),
      }),
    );
  });

  it('normalizes accommodation into HotelRoom shape', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => makeApiResponse(),
    });

    const rooms = await provider.searchRooms({
      ski_site: 1, from_date: '03/04/2025', to_date: '03/11/2025', group_size: 2,
    });

    expect(rooms).toHaveLength(1);
    expect(rooms[0]).toMatchObject({
      hotel_code: 'PWCSTAMAR',
      hotel_name: 'Chalet Maroi',
      stars: 4,
      beds: 3,
      price: 423.23,
      image_url: 'https://example.com/main.jpg',
      ski_lift_distance: '340m',
    });
  });

  it('picks MainImage as image_url', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => makeApiResponse(),
    });

    const [room] = await provider.searchRooms({
      ski_site: 1, from_date: '03/04/2025', to_date: '03/11/2025', group_size: 2,
    });

    expect(room.image_url).toBe('https://example.com/main.jpg');
  });

  it('falls back to first image when no MainImage flag', async () => {
    const acc = makeApiAccommodation({
      HotelDescriptiveContent: {
        Images: [{ URL: 'https://example.com/first.jpg' }],
      },
    });
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => makeApiResponse([acc]),
    });

    const [room] = await provider.searchRooms({
      ski_site: 1, from_date: '03/04/2025', to_date: '03/11/2025', group_size: 2,
    });

    expect(room.image_url).toBe('https://example.com/first.jpg');
  });

  it('returns empty array when API response fails Zod validation', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ unexpected: 'shape' }),
    });

    const rooms = await provider.searchRooms({
      ski_site: 1, from_date: '03/04/2025', to_date: '03/11/2025', group_size: 2,
    });

    expect(rooms).toEqual([]);
  });

  it('returns empty array on non-200 status', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false, status: 503 });

    const rooms = await provider.searchRooms({
      ski_site: 1, from_date: '03/04/2025', to_date: '03/11/2025', group_size: 2,
    });

    expect(rooms).toEqual([]);
  });

  it('returns empty array on network error', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    const rooms = await provider.searchRooms({
      ski_site: 1, from_date: '03/04/2025', to_date: '03/11/2025', group_size: 2,
    });

    expect(rooms).toEqual([]);
  });
});
