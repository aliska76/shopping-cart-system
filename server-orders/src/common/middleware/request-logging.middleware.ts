import { Injectable, NestMiddleware } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { NextFunction, Request, Response } from 'express';
import { JsonLogger } from '../logging/json-logger';

const CORRELATION_ID_HEADER = 'x-correlation-id';

/**
 * Applied to every route in AppModule.configure() -- the same "outermost, wraps everything"
 * placement as server-catalog's RequestLoggingMiddleware. Generates or forwards a
 * correlation id, echoes it back in the response header, and logs one structured line per
 * request once it finishes (method, path, status, elapsed ms).
 */
@Injectable()
export class RequestLoggingMiddleware implements NestMiddleware {
  constructor(private readonly logger: JsonLogger) {}

  use(req: Request, res: Response, next: NextFunction): void {
    const correlationId = (req.headers[CORRELATION_ID_HEADER] as string) || randomUUID();
    res.setHeader('X-Correlation-Id', correlationId);

    const startedAt = process.hrtime.bigint();

    res.on('finish', () => {
      const elapsedMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;

      this.logger.log(
        {
          correlationId,
          method: req.method,
          path: req.originalUrl,
          statusCode: res.statusCode,
          elapsedMs: Math.round(elapsedMs * 100) / 100,
        },
        RequestLoggingMiddleware.name,
      );
    });

    next();
  }
}
