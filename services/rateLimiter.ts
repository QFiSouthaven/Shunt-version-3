
// services/rateLimiter.ts
import { appEventBus } from '../lib/eventBus';

/**
 * Token Bucket Algorithm implementation for Rate Limiting.
 * Controls the flow of requests to the Gemini API and Local LLMs.
 */
class RateLimiter {
  private tokens: number;
  private capacity: number;
  private refillRate: number; // Tokens per second
  private lastRefill: number;

  constructor(capacity = 10, refillRate = 0.5) {
    this.capacity = capacity;
    this.refillRate = refillRate;
    this.tokens = capacity;
    this.lastRefill = Date.now();
  }

  /**
   * Attempts to consume a token. Returns true if successful.
   */
  public async tryConsume(): Promise<boolean> {
    this.refill();

    if (this.tokens >= 1) {
      this.tokens -= 1;
      this.broadcastStatus();
      return true;
    }

    return false;
  }

  /**
   * Blocks until a token is available.
   */
  public async throttle(): Promise<void> {
    while (!(await this.tryConsume())) {
      const waitTime = (1 / this.refillRate) * 1000;
      await new Promise((resolve) => setTimeout(resolve, waitTime / 2));
    }
  }

  private refill() {
    const now = Date.now();
    const elapsed = (now - this.lastRefill) / 1000;
    const refillAmount = elapsed * this.refillRate;

    this.tokens = Math.min(this.capacity, this.tokens + refillAmount);
    this.lastRefill = now;
  }

  private broadcastStatus() {
    const pressure = Math.round(((this.capacity - this.tokens) / this.capacity) * 100);
    appEventBus.emit('telemetry', {
      type: 'neural_pressure_update',
      data: { 
        tokensRemaining: Math.floor(this.tokens),
        pressurePercentage: pressure,
        status: pressure > 80 ? 'CRITICAL' : pressure > 50 ? 'HIGH' : 'STABLE'
      }
    });
  }

  public getStatus() {
    return {
      tokens: Math.floor(this.tokens),
      capacity: this.capacity,
      pressure: Math.round(((this.capacity - this.tokens) / this.capacity) * 100)
    };
  }
}

export const rateLimiter = new RateLimiter();
