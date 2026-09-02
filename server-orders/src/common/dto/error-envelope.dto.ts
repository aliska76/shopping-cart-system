import { ApiProperty } from '@nestjs/swagger';

/**
 * The one error shape this API ever returns -- AllExceptionsFilter serializes exactly this
 * for every error response, whatever raised it (validation, an unhandled exception, the
 * throttler, ConcurrencyLimitMiddleware's manual ServiceUnavailableException). A class with
 * @ApiProperty decorators (not the bare `ErrorEnvelope` interface AllExceptionsFilter itself
 * uses) so @nestjs/swagger can actually generate a schema from it for @ApiResponse -- Swagger
 * can't reflect field names/types out of a TypeScript-only interface, which has no runtime
 * representation once compiled away. Mirrors server-catalog's ErrorEnvelopeDto field-for-field
 * (see architecture.md's cross-service error contract).
 */
export class ErrorEnvelopeDto {
  @ApiProperty()
  status: number;

  @ApiProperty()
  message: string;

  @ApiProperty({ type: [String] })
  errors: string[];
}
