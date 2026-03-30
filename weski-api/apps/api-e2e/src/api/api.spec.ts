import axios from 'axios';
import * as http from 'http';

const VALID_PAYLOAD = {
  ski_site: 1,
  from_date: '01/01/2025',
  to_date: '07/01/2025',
  group_size: 2,
};

/**
 * Reads an SSE stream from a live POST request and collects all events until
 * the stream closes. Returns an array of parsed { event, data } objects.
 */
function collectSseEvents(
  path: string,
  body: object,
  timeoutMs = 30_000
): Promise<Array<{ event: string; data: string }>> {
  return new Promise((resolve, reject) => {
    const host = process.env.HOST ?? 'localhost';
    const port = Number(process.env.PORT ?? '3000');
    const payload = JSON.stringify(body);

    const req = http.request(
      {
        hostname: host,
        port,
        path,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
        },
      },
      (res) => {
        const events: Array<{ event: string; data: string }> = [];
        let buffer = '';
        let currentEvent = 'message';

        const timer = setTimeout(() => {
          req.destroy();
          reject(new Error(`SSE stream timed out after ${timeoutMs}ms`));
        }, timeoutMs);

        res.on('data', (chunk: Buffer) => {
          buffer += chunk.toString();
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';

          for (const line of lines) {
            if (line.startsWith('event:')) {
              currentEvent = line.slice('event:'.length).trim();
            } else if (line.startsWith('data:')) {
              events.push({ event: currentEvent, data: line.slice('data:'.length).trim() });
              currentEvent = 'message';
            }
          }
        });

        res.on('end', () => {
          clearTimeout(timer);
          resolve(events);
        });

        res.on('error', (err) => {
          clearTimeout(timer);
          reject(err);
        });
      }
    );

    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

// ─── Validation (400 responses) ──────────────────────────────────────────────

describe('POST /api/hotels/search/stream — validation', () => {
  it('returns 400 when body is empty', async () => {
    const res = await axios.post('/api/hotels/search/stream', {}, { validateStatus: () => true });
    expect(res.status).toBe(400);
    expect(res.data.message).toBe('Invalid search parameters');
  });

  it('returns 400 when ski_site is missing', async () => {
    const { ski_site: _omit, ...body } = VALID_PAYLOAD;
    const res = await axios.post('/api/hotels/search/stream', body, { validateStatus: () => true });
    expect(res.status).toBe(400);
  });

  it('returns 400 when from_date has wrong format (YYYY-MM-DD)', async () => {
    const res = await axios.post(
      '/api/hotels/search/stream',
      { ...VALID_PAYLOAD, from_date: '2025-01-01' },
      { validateStatus: () => true }
    );
    expect(res.status).toBe(400);
  });

  it('returns 400 when to_date has wrong format', async () => {
    const res = await axios.post(
      '/api/hotels/search/stream',
      { ...VALID_PAYLOAD, to_date: '2025-01-07' },
      { validateStatus: () => true }
    );
    expect(res.status).toBe(400);
  });

  it('returns 400 when group_size is 0', async () => {
    const res = await axios.post(
      '/api/hotels/search/stream',
      { ...VALID_PAYLOAD, group_size: 0 },
      { validateStatus: () => true }
    );
    expect(res.status).toBe(400);
  });

  it('returns 400 when group_size exceeds 10', async () => {
    const res = await axios.post(
      '/api/hotels/search/stream',
      { ...VALID_PAYLOAD, group_size: 11 },
      { validateStatus: () => true }
    );
    expect(res.status).toBe(400);
  });

  it('returns 400 when group_size is a float', async () => {
    const res = await axios.post(
      '/api/hotels/search/stream',
      { ...VALID_PAYLOAD, group_size: 1.5 },
      { validateStatus: () => true }
    );
    expect(res.status).toBe(400);
  });

  it('returns 400 when ski_site is negative', async () => {
    const res = await axios.post(
      '/api/hotels/search/stream',
      { ...VALID_PAYLOAD, ski_site: -1 },
      { validateStatus: () => true }
    );
    expect(res.status).toBe(400);
  });

  it('returns validation errors array in body', async () => {
    const res = await axios.post('/api/hotels/search/stream', {}, { validateStatus: () => true });
    expect(Array.isArray(res.data.errors)).toBe(true);
    expect(res.data.errors.length).toBeGreaterThan(0);
    expect(res.data.errors[0]).toHaveProperty('message');
  });
});

// ─── SSE stream (valid request) ──────────────────────────────────────────────

describe('POST /api/hotels/search/stream — SSE stream', () => {
  it('responds with text/event-stream content-type for a valid request', async () => {
    // We only need the headers, cancel immediately after
    const host = process.env.HOST ?? 'localhost';
    const port = Number(process.env.PORT ?? '3000');
    const payload = JSON.stringify(VALID_PAYLOAD);

    const contentType = await new Promise<string>((resolve, reject) => {
      const req = http.request(
        {
          hostname: host,
          port,
          path: '/api/hotels/search/stream',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(payload),
          },
        },
        (res) => {
          resolve(res.headers['content-type'] ?? '');
          req.destroy(); // don't read the whole stream
        }
      );
      req.on('error', (err) => {
        // ECONNRESET is expected after destroy()
        if ((err as NodeJS.ErrnoException).code === 'ECONNRESET') resolve('already-resolved');
        else reject(err);
      });
      req.write(payload);
      req.end();
    });

    expect(contentType).toMatch(/text\/event-stream/);
  });

  it('stream always ends with a "done" event', async () => {
    const events = await collectSseEvents('/api/hotels/search/stream', VALID_PAYLOAD);
    const lastEvent = events[events.length - 1];
    expect(lastEvent).toBeDefined();
    expect(lastEvent.event).toBe('done');
  });

  it('each data event (except done) contains valid JSON with hotel fields', async () => {
    const events = await collectSseEvents('/api/hotels/search/stream', VALID_PAYLOAD);
    const dataEvents = events.filter((e) => e.event !== 'done');

    // The mock API may return 0 hotels for some dates but should still emit events
    for (const ev of dataEvents) {
      expect(() => JSON.parse(ev.data)).not.toThrow();
      const parsed = JSON.parse(ev.data);
      // Each batch is an array of hotel rooms
      expect(Array.isArray(parsed)).toBe(true);

      for (const room of parsed) {
        expect(typeof room.hotel_code).toBe('string');
        expect(typeof room.hotel_name).toBe('string');
        expect(typeof room.price).toBe('number');
        expect(typeof room.beds).toBe('number');
        expect(typeof room.stars).toBe('number');
      }
    }
  });

  it('group_size expansion: all returned rooms have beds >= requested group_size', async () => {
    const requestedGroupSize = 2;
    const events = await collectSseEvents('/api/hotels/search/stream', {
      ...VALID_PAYLOAD,
      group_size: requestedGroupSize,
    });

    const dataEvents = events.filter((e) => e.event !== 'done');

    for (const ev of dataEvents) {
      const batch: Array<{ beds: number }> = JSON.parse(ev.data);
      for (const room of batch) {
        expect(room.beds).toBeGreaterThanOrEqual(requestedGroupSize);
      }
    }
  });
});
