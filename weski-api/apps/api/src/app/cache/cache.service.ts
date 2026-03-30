import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

export const CACHE_TTL_SECONDS = 5 * 60;

@Injectable()
export class CacheService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(CacheService.name);
  private client: Redis | null = null;
  private available = false;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit(): Promise<void> {
    const redisUrl = this.configService.get<string>('REDIS_URL');
    if (!redisUrl) {
      this.logger.log('REDIS_URL not set — caching disabled');
      return;
    }

    this.client = new Redis(redisUrl, {
      lazyConnect: true,
      enableReadyCheck: true,
      connectTimeout: 3000,
      maxRetriesPerRequest: 0,
    });

    this.client.on('error', (err: Error) => {
      if (this.available) {
        this.logger.warn(`Redis error, disabling cache: ${err.message}`);
        this.available = false;
      }
    });

    try {
      await this.client.connect();
      this.available = true;
      this.logger.log('Redis connected — caching enabled (TTL: 5min)');
    } catch (err) {
      this.logger.warn(`Redis connection failed, caching disabled: ${String(err)}`);
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.client?.quit();
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.available || !this.client) return null;
    try {
      const raw = await this.client.get(key);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch {
      return null;
    }
  }

  async set(key: string, value: unknown, ttlSeconds = CACHE_TTL_SECONDS): Promise<void> {
    if (!this.available || !this.client) return;
    try {
      await this.client.set(key, JSON.stringify(value), 'EX', ttlSeconds);
    } catch {
      // silently skip — cache miss is not a failure
    }
  }
}
