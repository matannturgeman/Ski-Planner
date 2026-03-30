import { Inject, Injectable } from '@nestjs/common';
import { from, merge, Observable } from 'rxjs';
import { filter } from 'rxjs/operators';
import {
  HOTELS_PROVIDERS,
  HotelRoom,
  HotelSearchParams,
  IHotelsProvider,
} from './providers/hotels-provider.interface';
import type { HotelSearchDto } from './dto/hotel-search.dto';

/** How many group sizes above the requested one to also fetch */
const GROUP_SIZE_EXPANSION = 2;

@Injectable()
export class HotelsService {
  constructor(
    @Inject(HOTELS_PROVIDERS)
    private readonly providers: IHotelsProvider[],
  ) {}

  /**
   * Fans out to ALL registered vendors simultaneously, for group_size N, N+1, N+2.
   * Emits each vendor's batch as soon as it resolves — Skyscanner style.
   * Filters to rooms that can physically accommodate the requested group (beds >= group_size).
   */
  streamSearch(dto: HotelSearchDto): Observable<HotelRoom[]> {
    const groupSizes = this.expandGroupSizes(dto.group_size);
    const params: HotelSearchParams = {
      ski_site: dto.ski_site,
      from_date: dto.from_date,
      to_date: dto.to_date,
      group_size: dto.group_size,
    };

    const streams = this.providers.flatMap((provider) =>
      groupSizes.map((gs) =>
        from(
          provider
            .searchRooms({ ...params, group_size: gs })
            .then((rooms) => rooms.filter((r) => r.beds >= dto.group_size)),
        ),
      ),
    );

    return merge(...streams).pipe(
      filter((batch): batch is HotelRoom[] => batch.length > 0),
    );
  }

  private expandGroupSizes(groupSize: number): number[] {
    const MAX_GROUP_SIZE = 10;
    return Array.from(
      { length: GROUP_SIZE_EXPANSION + 1 },
      (_, i) => groupSize + i,
    ).filter((gs) => gs <= MAX_GROUP_SIZE);
  }
}
