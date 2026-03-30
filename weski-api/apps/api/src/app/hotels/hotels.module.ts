import { Module } from '@nestjs/common';
import { HotelsController } from './hotels.controller';
import { HotelsService } from './hotels.service';
import { WeskiProvider } from './providers/weski/weski.provider';
import { HOTELS_PROVIDERS } from './providers/hotels-provider.interface';

/**
 * To add a new vendor, create a class that implements IHotelsProvider
 * and add it to the HOTELS_PROVIDERS multi-provider array below.
 * No changes to HotelsService or HotelsController are required.
 */
@Module({
  controllers: [HotelsController],
  providers: [
    WeskiProvider,
    {
      provide: HOTELS_PROVIDERS,
      useFactory: (...providers: WeskiProvider[]) => providers,
      inject: [WeskiProvider],
    },
    HotelsService,
  ],
})
export class HotelsModule {}
