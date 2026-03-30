export const HOTELS_PROVIDERS = 'HOTELS_PROVIDERS';

export interface HotelRoom {
  hotel_name: string;
  room_name: string;
  meal: string;
  price: number;
  adults: number;
}

export interface HotelSearchParams {
  ski_site: number;
  from_date: string;
  to_date: string;
  group_size: number;
}

/**
 * Interface all vendor integrations must implement.
 * Each provider returns rooms for the exact group_size requested.
 * The service is responsible for fanning out across group sizes.
 */
export interface IHotelsProvider {
  readonly name: string;
  searchRooms(params: HotelSearchParams): Promise<HotelRoom[]>;
}
