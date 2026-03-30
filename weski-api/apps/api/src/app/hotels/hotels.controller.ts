import { Body, Controller, Post, Res } from '@nestjs/common';
import type { Response } from 'express';
import { HotelsService } from './hotels.service';
import { HotelSearchDtoSchema } from './dto/hotel-search.dto';

@Controller('hotels')
export class HotelsController {
  constructor(private readonly hotelsService: HotelsService) {}

  /**
   * POST /hotels/search/stream
   *
   * Accepts a search request and responds with a Server-Sent Events stream.
   * Each event carries a batch of HotelRoom[] from one vendor+groupSize call.
   * The client receives and renders results progressively as they arrive.
   */
  @Post('search/stream')
  searchStream(@Body() body: unknown, @Res() res: Response): void {
    const parsed = HotelSearchDtoSchema.safeParse(body);

    if (!parsed.success) {
      res.status(400).json({
        message: 'Invalid search parameters',
        errors: parsed.error.issues,
      });
      return;
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const results$ = this.hotelsService.streamSearch(parsed.data);

    const subscription = results$.subscribe({
      next: (batch) => {
        res.write(`data: ${JSON.stringify(batch)}\n\n`);
      },
      error: (err: unknown) => {
        const message = err instanceof Error ? err.message : 'Search error';
        res.write(`event: error\ndata: ${JSON.stringify({ message })}\n\n`);
        res.end();
      },
      complete: () => {
        res.write('event: done\ndata: {}\n\n');
        res.end();
      },
    });

    // Unsubscribe and abort all vendor requests when client disconnects
    res.on('close', () => subscription.unsubscribe());
  }
}
