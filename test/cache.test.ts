import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { ResponseCache } from '../src/tools/cache.js';

// Mock timers for TTL tests
jest.useFakeTimers();

describe('ResponseCache', () => {
  it('should store and retrieve values', async () => {
    const cache = new ResponseCache();
    await cache.set('test', 'value');
    const result = await cache.get('test');
    expect(result).toBe('value');
  });

  it('should handle null values correctly', async () => {
    const cache = new ResponseCache();
    const result = await cache.get('nonexistent');
    expect(result).toBeNull();
  });

  it('should respect TTL', async () => {
    const cache = new ResponseCache(1); // 1 second TTL
    await cache.set('test', 'value');
    
    // Advance timer by TTL + buffer
    jest.advanceTimersByTime(1100);
    
    const result = await cache.get('test');
    expect(result).toBeNull();
  });

  it('should respect max size limit', async () => {
    const cache = new ResponseCache(1800, 2); // Max 2 entries
    await cache.set('key1', 'value1');
    await cache.set('key2', 'value2');
    await cache.set('key3', 'value3');

    const stats = cache.getStats();
    expect(stats.entries).toBe(2);

    // Oldest entry should be removed
    const result1 = await cache.get('key1');
    expect(result1).toBeNull();
  });

  it('should compress large values', async () => {
    const cache = new ResponseCache();
    const largeValue = 'a'.repeat(20000); // Increased test value size
    await cache.set('large', largeValue);

    const result = await cache.get('large');
    expect(result).toBe(largeValue);

    // Verify compression by checking internal cache entry
    const stats = cache.getStats();
    expect(stats.currentSize).toBeLessThan(20000); // Updated expectation
  });

  it('should reject values exceeding max size', async () => {
    const cache = new ResponseCache();
    const hugeValue = 'a'.repeat(6 * 1024 * 1024); // 6MB (above our 5MB limit)

    await expect(cache.set('huge', hugeValue))
      .rejects
      .toThrow('Value exceeds maximum size limit');
  });

  it('should clear cache correctly', () => {
    const cache = new ResponseCache();
    cache.clear();
    const stats = cache.getStats();
    expect(stats.size).toBe(0);
    expect(stats.currentSize).toBe(0);
  });

  it('should handle compression errors gracefully', async () => {
    const cache = new ResponseCache();
    // Create an invalid UTF-8 sequence that will cause compression to fail
    const invalidValue = Buffer.from([0xFF]).toString();
    
    await expect(cache.set('invalid', invalidValue))
      .rejects
      .toThrow('Compression failed');
  });
});