import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HotelsModule } from './hotels/hotels.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    HotelsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
