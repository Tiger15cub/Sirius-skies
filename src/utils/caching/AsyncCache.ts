import { DateTime } from "luxon";
import { CacheItem } from "../../interface";

export default class AsyncCache<T> {
  private cache: Map<string, CacheItem<T>> = new Map();

  constructor(private defaultTTL: number = 60000) {}

  async get(key: string): Promise<T | undefined> {
    const item = this.cache.get(key);
    if (!item) return undefined;
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return undefined;
    }
    return item.value;
  }

  async set(
    key: string,
    value: T,
    ttl: number = this.defaultTTL
  ): Promise<void> {
    const expiry = DateTime.local().plus({ milliseconds: ttl });
    this.cache.set(key, { value, expiry: Number(expiry) });
  }
}
