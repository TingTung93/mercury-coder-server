import { createHash } from 'crypto';
import { gzip, gunzip } from 'zlib';
import { promisify } from 'util';

// Constants for cache configuration
const DEFAULT_TTL = 1800; // 30 minutes in seconds
const DEFAULT_MAX_SIZE = 100; // Maximum number of entries
const MAX_ENTRY_SIZE = 5 * 1024 * 1024; // Increased to 5MB max size per entry
const COMPRESSION_THRESHOLD = 10 * 1024; // Increased compression threshold to 10KB

interface CacheEntry {
  value: string;
  timestamp: number;
  size: number;
  compressed: boolean;
}

interface CacheError extends Error {
  code: string;
}

export class ResponseCache {
  private cache: Map<string, CacheEntry>;
  private readonly ttl: number;
  private readonly maxSize: number;
  private currentSize: number;

  constructor(ttl: number = DEFAULT_TTL, maxSize: number = DEFAULT_MAX_SIZE) {
    this.cache = new Map();
    this.ttl = ttl;
    this.maxSize = maxSize;
    this.currentSize = 0;
  }

  private createKey(prompt: string): string {
    return createHash('sha256').update(prompt).digest('hex');
  }

  private async compressValue(value: string): Promise<string> {
    try {
      const gzipAsync = promisify(gzip);
      const compressed = await gzipAsync(Buffer.from(value));
      return compressed.toString('base64');
    } catch (error) {
      const err = new Error('Compression failed') as CacheError;
      err.code = 'COMPRESSION_ERROR';
      throw err;
    }
  }

  private async decompressValue(value: string): Promise<string> {
    try {
      const gunzipAsync = promisify(gunzip);
      const compressed = Buffer.from(value, 'base64');
      const decompressed = await gunzipAsync(compressed);
      return decompressed.toString();
    } catch (error) {
      const err = new Error('Decompression failed') as CacheError;
      err.code = 'DECOMPRESSION_ERROR';
      throw err;
    }
  }

  private removeOldestEntries(): void {
    while (this.cache.size >= this.maxSize) {
      const oldestKey = [...this.cache.entries()]
        .sort((a, b) => a[1].timestamp - b[1].timestamp)[0][0];
      const entry = this.cache.get(oldestKey);
      if (entry) {
        this.currentSize -= entry.size;
      }
      this.cache.delete(oldestKey);
    }
  }

  private evictIfNeeded(size: number): void {
    while (this.cache.size >= this.maxSize || this.currentSize + size > MAX_ENTRY_SIZE) {
      const oldestKey = [...this.cache.entries()]
        .sort((a, b) => a[1].timestamp - b[1].timestamp)[0][0];
      const entry = this.cache.get(oldestKey);
      if (entry) {
        this.currentSize -= entry.size;
      }
      this.cache.delete(oldestKey);
    }
  }

  async get(prompt: string): Promise<string | null> {
    try {
      const key = this.createKey(prompt);
      const entry = this.cache.get(key);

      if (!entry) {
        return null;
      }

      if (Date.now() - entry.timestamp > this.ttl * 1000) {
        this.cache.delete(key);
        this.currentSize -= entry.size;
        return null;
      }

      return entry.compressed ? await this.decompressValue(entry.value) : entry.value;
    } catch (error) {
      const err = error as CacheError;
      console.error(`Cache get error: ${err.message}`);
      return null;
    }
  }

  async set(prompt: string, value: string): Promise<void> {
    const size = Buffer.byteLength(value, 'utf-8');
    if (size > MAX_ENTRY_SIZE) {
      const err = new Error(`Value exceeds maximum size limit (${MAX_ENTRY_SIZE} bytes)`);
      (err as CacheError).code = 'SIZE_LIMIT_EXCEEDED';
      throw err;
    }
    
    let processedValue = value;
    let compressed = false;
    
    if (size > COMPRESSION_THRESHOLD) {
      try {
        processedValue = await this.compressValue(value);
        compressed = true;
      } catch (error) {
        console.error(`Cache compression error for key ${prompt}:`, error);
        throw error;
      }
    }
    
    this.evictIfNeeded(size);
    
    this.cache.set(prompt, {
      value: processedValue,
      timestamp: Date.now(),
      size,
      compressed
    });
    
    this.currentSize += size;
  }

  clear(): void {
    this.cache.clear();
    this.currentSize = 0;
  }

  getStats(): { size: number; entries: number; currentSize: number } {
    return {
      size: this.cache.size,
      entries: this.cache.size,
      currentSize: this.currentSize
    };
  }
}