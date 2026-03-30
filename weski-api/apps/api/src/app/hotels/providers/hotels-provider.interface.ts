export const HOTELS_PROVIDERS = 'HOTELS_PROVIDERS';

/** Normalized hotel room shape shared across all vendors and sent to the client */
export interface HotelRoom {
  hotel_code: string;
  hotel_name: string;
  stars: number;
  beds: number;
  price: number;
  image_url?: string;
  ski_lift_distance?: string;
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
 * The service fans out across group sizes.
 */
export interface IHotelsProvider {
  readonly name: string;
  searchRooms(params: HotelSearchParams): Promise<HotelRoom[]>;
}
