import { Injectable, NestMiddleware, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NextFunction, Request, Response } from 'express';

/**
 * Caps how many requests to the routes it's applied to (see AppModule.configure() -- scoped
 * to OrdersController only, not every route) can be in flight at once. This is not the same
 * thing as rate limiting (ThrottlerModule, see AppModule): throttling limits *how often* one
 * client can call an endpoint over time, but says nothing about how many requests are being
 * processed concurrently *right now* across all clients. A slow downstream Elasticsearch
 * query, or a burst of legitimate traffic from many different clients, can still pile up
 * more in-flight work than this process should try to hold at once -- this middleware is
 * the backstop for that: past MAX_CONCURRENT_REQUESTS in-flight requests to these routes, a
 * new request is rejected immediately with 503 instead of queueing indefinitely and
 * degrading every other in-flight request's latency along with it.
 *
 * The in-flight count lives as an instance field, so this only works because Nest resolves
 * middleware through its DI container as an ordinary singleton provider (registered in
 * AppModule's providers array) -- one shared counter for the whole process, not one per
 * request.
 */
@Injectable()
export class ConcurrencyLimitMiddleware implements NestMiddleware {
  private inFlight = 0;

  constructor(private readonly configService: ConfigService) {}

  use(req: Request, res: Response, next: NextFunction): void {
    const maxConcurrent = this.configService.get<number>('concurrency.maxConcurrentRequests', 50);

    if (this.inFlight >= maxConcurrent) {
      throw new ServiceUnavailableException(
        'Too many requests are being processed right now. Please retry shortly.',
      );
    }

    this.inFlight++;

    // Guard against double-decrement: 'finish' and 'close' can both fire for the same
    // response in some situations (e.g. the connection closing right as the response
    // finishes), and without the guard that would let inFlight drift below the true count.
    let released = false;
    const release = () => {
      if (released) return;
      released = true;
      this.inFlight--;
    };

    res.on('finish', release);
    res.on('close', release);

    next();
  }
}
