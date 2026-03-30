import { lastValueFrom } from 'rxjs';
import { toArray } from 'rxjs/operators';
import { HotelsService } from './hotels.service';
import type { IHotelsProvider, HotelRoom } from './providers/hotels-provider.interface';
import type { HotelSearchDto } from './dto/hotel-search.dto';

const makeRoom = (overrides: Partial<HotelRoom> = {}): HotelRoom => ({
  hotel_name: 'Test Hotel',
  room_name: 'Standard Room',
  meal: 'BB',
  price: 100,
  adults: 2,
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
    const dto = makeDto({ group_size: 1 });

    await lastValueFrom(service.streamSearch(dto).pipe(toArray()));

    // Each provider is called for 3 group sizes
    expect(mockProvider.searchRooms).toHaveBeenCalledTimes(3);
    expect(secondProvider.searchRooms).toHaveBeenCalledTimes(3);
  });

  it('emits rooms as they arrive (one emission per provider call that returns data)', async () => {
    const rooms = [makeRoom({ adults: 2, price: 150 })];
    mockProvider.searchRooms.mockResolvedValue(rooms);

    const service = new HotelsService([mockProvider]);
    const dto = makeDto({ group_size: 2 });

    const batches = await lastValueFrom(service.streamSearch(dto).pipe(toArray()));

    expect(batches.length).toBe(3); // 3 group sizes, each returns rooms
    expect(batches.flat()).toHaveLength(3);
  });

  it('filters out rooms where adults < group_size', async () => {
    mockProvider.searchRooms
      .mockResolvedValueOnce([makeRoom({ adults: 2 })]) // group_size=2 → keep
      .mockResolvedValueOnce([makeRoom({ adults: 1 })]) // group_size=3 → filter out (adults < 2)
      .mockResolvedValueOnce([makeRoom({ adults: 4 })]) // group_size=4 → keep
    ;

    const service = new HotelsService([mockProvider]);
    const dto = makeDto({ group_size: 2 });

    const batches = await lastValueFrom(service.streamSearch(dto).pipe(toArray()));
    const allRooms = batches.flat();

    expect(allRooms.every((r) => r.adults >= 2)).toBe(true);
    expect(allRooms).toHaveLength(2);
  });

  it('does not emit empty batches', async () => {
    mockProvider.searchRooms
      .mockResolvedValueOnce([]) // empty — should not be emitted
      .mockResolvedValueOnce([makeRoom({ adults: 3 })])
      .mockResolvedValueOnce([]);

    const service = new HotelsService([mockProvider]);
    const dto = makeDto({ group_size: 2 });

    const batches = await lastValueFrom(service.streamSearch(dto).pipe(toArray()));

    expect(batches).toHaveLength(1);
  });

  it('continues streaming when one provider call fails', async () => {
    mockProvider.searchRooms
      .mockRejectedValueOnce(new Error('network error')) // first call fails
      .mockResolvedValueOnce([makeRoom({ adults: 3 })]) // second succeeds
      .mockResolvedValueOnce([makeRoom({ adults: 4 })]) // third succeeds
    ;

    const service = new HotelsService([mockProvider]);
    const dto = makeDto({ group_size: 2 });

    const batches = await lastValueFrom(service.streamSearch(dto).pipe(toArray()));

    // Stream should still complete with results from successful calls
    expect(batches.flat().length).toBeGreaterThan(0);
  });
});
