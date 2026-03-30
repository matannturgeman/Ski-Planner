import { lastValueFrom } from 'rxjs';
import { toArray } from 'rxjs/operators';
import { HotelsService } from './hotels.service';
import type { IHotelsProvider, HotelRoom } from './providers/hotels-provider.interface';
import type { HotelSearchDto } from './dto/hotel-search.dto';

const makeRoom = (overrides: Partial<HotelRoom> = {}): HotelRoom => ({
  hotel_code: 'TEST001',
  hotel_name: 'Test Chalet',
  stars: 4,
  beds: 4,
  price: 299.99,
  image_url: 'https://example.com/img.jpg',
  ski_lift_distance: '200m',
  ...overrides,
});

const makeDto = (overrides: Partial<HotelSearchDto> = {}): HotelSearchDto => ({
  ski_site: 1,
  from_date: '03/04/2025',
  to_date: '03/11/2025',
  group_size: 2,
  ...overrides,
});

describe('HotelsService', () => {
  let mockProvider: jest.Mocked<IHotelsProvider>;

  beforeEach(() => {
    mockProvider = {
      name: 'mock',
      searchRooms: jest.fn().mockResolvedValue([]),
    };
  });

  it('calls provider with group_size N, N+1, N+2', async () => {
    const service = new HotelsService([mockProvider]);
    const dto = makeDto({ group_size: 2 });

    await lastValueFrom(service.streamSearch(dto).pipe(toArray()));

    expect(mockProvider.searchRooms).toHaveBeenCalledTimes(3);
    expect(mockProvider.searchRooms).toHaveBeenCalledWith(expect.objectContaining({ group_size: 2 }));
    expect(mockProvider.searchRooms).toHaveBeenCalledWith(expect.objectContaining({ group_size: 3 }));
    expect(mockProvider.searchRooms).toHaveBeenCalledWith(expect.objectContaining({ group_size: 4 }));
  });

  it('fans out to all registered providers', async () => {
    const secondProvider: jest.Mocked<IHotelsProvider> = {
      name: 'second',
      searchRooms: jest.fn().mockResolvedValue([]),
    };
    const service = new HotelsService([mockProvider, secondProvider]);

    await lastValueFrom(service.streamSearch(makeDto()).pipe(toArray()));

    expect(mockProvider.searchRooms).toHaveBeenCalledTimes(3);
    expect(secondProvider.searchRooms).toHaveBeenCalledTimes(3);
  });

  it('emits rooms from each group size call that returns data', async () => {
    mockProvider.searchRooms.mockResolvedValue([makeRoom({ beds: 2 })]);

    const service = new HotelsService([mockProvider]);
    const batches = await lastValueFrom(service.streamSearch(makeDto({ group_size: 2 })).pipe(toArray()));

    expect(batches.length).toBe(3);
    expect(batches.flat()).toHaveLength(3);
  });

  it('filters out rooms where beds < group_size', async () => {
    mockProvider.searchRooms
      .mockResolvedValueOnce([makeRoom({ beds: 2 })])   // fits group of 2 ✓
      .mockResolvedValueOnce([makeRoom({ beds: 1 })])   // too small ✗
      .mockResolvedValueOnce([makeRoom({ beds: 4 })]); // fits ✓

    const service = new HotelsService([mockProvider]);
    const batches = await lastValueFrom(service.streamSearch(makeDto({ group_size: 2 })).pipe(toArray()));

    expect(batches.flat().every((r) => r.beds >= 2)).toBe(true);
    expect(batches.flat()).toHaveLength(2);
  });

  it('does not emit empty batches', async () => {
    mockProvider.searchRooms
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([makeRoom({ beds: 3 })])
      .mockResolvedValueOnce([]);

    const service = new HotelsService([mockProvider]);
    const batches = await lastValueFrom(service.streamSearch(makeDto()).pipe(toArray()));

    expect(batches).toHaveLength(1);
  });

  it('continues streaming when one provider call fails', async () => {
    mockProvider.searchRooms
      .mockRejectedValueOnce(new Error('network error'))
      .mockResolvedValueOnce([makeRoom({ beds: 3 })])
      .mockResolvedValueOnce([makeRoom({ beds: 4 })]);

    const service = new HotelsService([mockProvider]);
    const batches = await lastValueFrom(service.streamSearch(makeDto()).pipe(toArray()));

    expect(batches.flat().length).toBeGreaterThan(0);
  });
});
