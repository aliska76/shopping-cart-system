import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { JsonLogger } from '../logging/json-logger';

interface ErrorEnvelope {
  status: number;
  message: string;
  errors: string[];
}

/**
 * Same error envelope server-catalog's ExceptionHandlingMiddleware returns --
 * { status, message, errors[] } -- documented in architecture.md as the one format both
 * backends use, so the client needs exactly one error handler for either API.
 *
 * class-validator's ValidationPipe throws a BadRequestException whose response.message is
 * an array of per-field validation strings; that array becomes `errors`, with `message` set
 * to a single human-readable summary instead of the raw array.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private readonly logger: JsonLogger) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const envelope = this.toEnvelope(exception);

    if (envelope.status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      // Log the *real* exception's own message, not envelope.message -- for a non-HttpException
      // (the only way to land here, an unexpected 500), envelope.message is always the generic
      // "An unexpected error occurred." string sent to the client. Logging that same generic
      // string server-side too meant the terminal never showed what actually broke, only that
      // something did -- found by hitting a real 500 and not being able to tell why from the
      // running server's own output, stack trace notwithstanding.
      const realMessage = exception instanceof Error ? exception.message : String(exception);
      this.logger.error(realMessage, (exception as Error)?.stack, AllExceptionsFilter.name);
    }

    response.status(envelope.status).json(envelope);
  }

  private toEnvelope(exception: unknown): ErrorEnvelope {
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body = exception.getResponse();

      if (typeof body === 'string') {
        return { status, message: body, errors: [] };
      }

      const { message } = body as { message?: string | string[] };

      if (Array.isArray(message)) {
        return { status, message: 'Validation failed', errors: message };
      }

      return { status, message: message ?? exception.message, errors: [] };
    }

    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'An unexpected error occurred.',
      errors: [],
    };
  }
}
