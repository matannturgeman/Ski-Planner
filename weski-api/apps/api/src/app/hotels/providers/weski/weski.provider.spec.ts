import { ConfigService } from '@nestjs/config';
import { WeskiProvider } from './weski.provider';

const MOCK_API_URL = 'https://mock-hotels-api.example.com';

const mockConfigService = {
  getOrThrow: jest.fn().mockReturnValue(MOCK_API_URL),
} as unknown as ConfigService;

const makeApiRoom = (overrides = {}) => ({
  hotel_name: 'Alpine Lodge',
  room_name: 'Double Room',
  meal: 'HB',
  price: 299.99,
  adults: 2,
  ...overrides,
});

describe('WeskiProvider', () => {
  let provider: WeskiProvider;

  beforeEach(() => {
    provider = new WeskiProvider(mockConfigService);
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('sends the correct request format to the external API', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ results: [makeApiRoom()] }),
    });

    await provider.searchRooms({ ski_site: 1, from_date: '03/04/2025', to_date: '03/11/2025', group_size: 2 });

    expect(global.fetch).toHaveBeenCalledWith(
      MOCK_API_URL,
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: {
            ski_site: 1,
            from_date: '03/04/2025',
            to_date: '03/11/2025',
            group_size: 2,
          },
        }),
      }),
    );
  });

  it('parses { results: [...] } response format', async () => {
    const room = makeApiRoom();
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ results: [room] }),
    });

    const rooms = await provider.searchRooms({ ski_site: 1, from_date: '03/04/2025', to_date: '03/11/2025', group_size: 2 });

    expect(rooms).toHaveLength(1);
    expect(rooms[0].hotel_name).toBe('Alpine Lodge');
    expect(rooms[0].price).toBe(299.99);
  });

  it('parses array response format', async () => {
    const room = makeApiRoom();
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => [room],
    });

    const rooms = await provider.searchRooms({ ski_site: 1, from_date: '03/04/2025', to_date: '03/11/2025', group_size: 2 });

    expect(rooms).toHaveLength(1);
  });

  it('returns empty array when API response fails Zod validation', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ unexpected: 'shape' }),
    });

    const rooms = await provider.searchRooms({ ski_site: 1, from_date: '03/04/2025', to_date: '03/11/2025', group_size: 2 });

    expect(rooms).toEqual([]);
  });

  it('returns empty array when API responds with non-200 status', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
    });

    const rooms = await provider.searchRooms({ ski_site: 1, from_date: '03/04/2025', to_date: '03/11/2025', group_size: 2 });

    expect(rooms).toEqual([]);
  });

  it('returns empty array when fetch throws (network error)', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    const rooms = await provider.searchRooms({ ski_site: 1, from_date: '03/04/2025', to_date: '03/11/2025', group_size: 2 });

    expect(rooms).toEqual([]);
  });
});
