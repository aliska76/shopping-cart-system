import { Global, Module } from '@nestjs/common';
import { JsonLogger } from './json-logger';

/**
 * Global so RequestLoggingMiddleware and AllExceptionsFilter can inject JsonLogger without
 * every module that needs it importing this one explicitly -- the same "logging is its own
 * DI module" shape as server-catalog's Logging/ folder, just expressed as a Nest module
 * instead of an ILoggingBuilder extension, since that's the idiomatic unit of DI composition
 * here.
 */
@Global()
@Module({
  providers: [JsonLogger],
  exports: [JsonLogger],
})
export class LoggingModule {}
