import { Injectable, LoggerService, LogLevel } from '@nestjs/common';

// NODE_ENV=production switches to flat, machine-parseable JSON lines -- the format an actual
// log-aggregation pipeline (ELK/Datadog/CloudWatch, or just `jq`) wants. Anything else,
// including unset (the default for `npm run start:dev`/`nest start`), gets a colored,
// single-line human format instead -- closer to what Nest's own default ConsoleLogger prints,
// and the whole point of the split: a candidate reading logs in a terminal during local
// development shouldn't have to squint at raw JSON to see what happened, and a real
// deployment (containers, PM2, most hosting platforms) already sets NODE_ENV=production on
// its own, so this needs no extra wiring to do the right thing in either place.
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

const RESET = '\x1b[0m';
const DIM = '\x1b[2m';
const LEVEL_STYLE: Record<LogLevel, string> = {
  log: '\x1b[32m', // green
  error: '\x1b[31m', // red
  warn: '\x1b[33m', // yellow
  debug: '\x1b[35m', // magenta
  verbose: '\x1b[36m', // cyan
  fatal: '\x1b[31m', // red
};

/**
 * Structured logging, as its own module -- mirrors server-catalog's
 * Catalog.Api/Logging/LoggingExtensions.AddCatalogLogging: no external framework (Winston,
 * Pino) pulled in for it -- a LoggerService this small doesn't need one. Implements Nest's
 * LoggerService interface directly rather than subclassing ConsoleLogger, since the base
 * class's internal formatting hooks aren't a stable public API to build on.
 *
 * Two output modes (see IS_PRODUCTION above): flat JSON lines in production, a colored
 * human-readable line in development. Both modes handle a structured object message (e.g.
 * RequestLoggingMiddleware's { correlationId, method, path, statusCode, elapsedMs }) the same
 * way in spirit -- its fields are surfaced flat, never double-encoded into a nested string --
 * just formatted differently for a log pipeline versus a terminal.
 */
@Injectable()
export class JsonLogger implements LoggerService {
  log(message: unknown, context?: string): void {
    this.write('log', message, context);
  }

  error(message: unknown, trace?: string, context?: string): void {
    this.write('error', message, context, trace);
  }

  warn(message: unknown, context?: string): void {
    this.write('warn', message, context);
  }

  debug(message: unknown, context?: string): void {
    this.write('debug', message, context);
  }

  verbose(message: unknown, context?: string): void {
    this.write('verbose', message, context);
  }

  private write(level: LogLevel, message: unknown, context?: string, trace?: string): void {
    if (IS_PRODUCTION) {
      this.writeJson(level, message, context, trace);
    } else {
      this.writeHuman(level, message, context, trace);
    }
  }

  private writeJson(level: LogLevel, message: unknown, context?: string, trace?: string): void {
    const entry: Record<string, unknown> = {
      timestamp: new Date().toISOString(),
      level,
      context,
    };

    // A plain object message is spread directly into the entry as top-level fields, not
    // stringified into a nested "message" string -- so a log-aggregation tool (or a human
    // with `jq`) can query `.correlationId`/`.statusCode` directly.
    if (message !== null && typeof message === 'object' && !Array.isArray(message)) {
      Object.assign(entry, message);
    } else {
      entry.message = message;
    }

    if (trace) {
      entry.trace = trace;
    }

    this.writeLine(level, JSON.stringify(entry));
  }

  private writeHuman(level: LogLevel, message: unknown, context?: string, trace?: string): void {
    const timestamp = new Date().toLocaleTimeString();
    const color = LEVEL_STYLE[level] ?? '';
    const levelLabel = `${color}${level.toUpperCase().padEnd(5)}${RESET}`;
    const contextLabel = context ? `${DIM}[${context}]${RESET} ` : '';

    const text =
      message !== null && typeof message === 'object' && !Array.isArray(message)
        ? Object.entries(message as Record<string, unknown>)
            .map(([key, value]) => `${key}=${value}`)
            .join(' ')
        : String(message);

    let line = `${DIM}${timestamp}${RESET} ${levelLabel} ${contextLabel}${text}`;
    if (trace) {
      line += `\n${DIM}${trace}${RESET}`;
    }

    this.writeLine(level, line);
  }

  private writeLine(level: LogLevel, line: string): void {
    const stream = level === 'error' || level === 'fatal' ? process.stderr : process.stdout;
    stream.write(line + '\n');
  }
}
