/**
 * Mock for Redis/IORedis
 */

export class MockRedis {
  private store: Map<string, { value: string; expiry?: number }> = new Map();

  async get(key: string): Promise<string | null> {
    const item = this.store.get(key);
    if (!item) return null;

    // Check expiry
    if (item.expiry && Date.now() > item.expiry) {
      this.store.delete(key);
      return null;
    }

    return item.value;
  }

  async set(key: string, value: string, mode?: string, duration?: number): Promise<'OK'> {
    const expiry = duration ? Date.now() + duration * 1000 : undefined;
    this.store.set(key, { value, expiry });
    return 'OK';
  }

  async setex(key: string, seconds: number, value: string): Promise<'OK'> {
    return this.set(key, value, 'EX', seconds);
  }

  async del(key: string): Promise<number> {
    const existed = this.store.has(key);
    this.store.delete(key);
    return existed ? 1 : 0;
  }

  async exists(key: string): Promise<number> {
    const item = this.store.get(key);
    if (!item) return 0;

    // Check expiry
    if (item.expiry && Date.now() > item.expiry) {
      this.store.delete(key);
      return 0;
    }

    return 1;
  }

  async keys(pattern: string): Promise<string[]> {
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    return Array.from(this.store.keys()).filter(key => regex.test(key));
  }

  async flushall(): Promise<'OK'> {
    this.store.clear();
    return 'OK';
  }

  disconnect(): void {
    this.store.clear();
  }

  // Queue operations
  async lpush(key: string, ...values: string[]): Promise<number> {
    const item = this.store.get(key);
    const list = item ? JSON.parse(item.value) : [];
    list.unshift(...values);
    this.store.set(key, { value: JSON.stringify(list) });
    return list.length;
  }

  async rpop(key: string): Promise<string | null> {
    const item = this.store.get(key);
    if (!item) return null;

    const list = JSON.parse(item.value);
    const value = list.pop();
    this.store.set(key, { value: JSON.stringify(list) });
    return value || null;
  }

  async llen(key: string): Promise<number> {
    const item = this.store.get(key);
    if (!item) return 0;

    const list = JSON.parse(item.value);
    return list.length;
  }
}

export function createMockRedis(): MockRedis {
  return new MockRedis();
}
