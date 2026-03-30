import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { IHotelsProvider, HotelRoom, HotelSearchParams } from '../hotels-provider.interface';
import {
  WeskiExternalRequestSchema,
  WeskiExternalResponseSchema,
} from './weski.schemas';

const VENDOR_TIMEOUT_MS = 10_000;

@Injectable()
export class WeskiProvider implements IHotelsProvider {
  readonly name = 'weski';
  private readonly logger = new Logger(WeskiProvider.name);
  private readonly apiUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.apiUrl = this.configService.getOrThrow<string>('HOTELS_API_URL');
  }

  async searchRooms(params: HotelSearchParams): Promise<HotelRoom[]> {
    const requestBody = WeskiExternalRequestSchema.parse({ query: params });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), VENDOR_TIMEOUT_MS);

    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });

      if (!response.ok) {
        this.logger.warn(`WeSki API returned ${response.status} for group_size=${params.group_size}`);
        return [];
      }

      const raw: unknown = await response.json();
      const parsed = WeskiExternalResponseSchema.safeParse(raw);

      if (!parsed.success) {
        this.logger.warn(`WeSki API response validation failed: ${parsed.error.message}`);
        return [];
      }

      return Array.isArray(parsed.data) ? parsed.data : parsed.data.results;
    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'AbortError') {
        this.logger.warn(`WeSki API timed out for group_size=${params.group_size}`);
      } else {
        this.logger.error(`WeSki API error: ${String(error)}`);
      }
      return [];
    } finally {
      clearTimeout(timeoutId);
    }
  }
}
