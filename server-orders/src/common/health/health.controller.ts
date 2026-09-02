import { Controller, Get, VERSION_NEUTRAL } from '@nestjs/common';
import { HealthCheck, HealthCheckService } from '@nestjs/terminus';
import { SkipThrottle } from '@nestjs/throttler';
import { ElasticsearchHealthIndicator } from './elasticsearch.health';

/**
 * Unversioned and outside the "api" prefix (see main.ts) -- same convention as
 * server-catalog's GET /health -- and exempt from rate limiting for the same reason: a
 * monitoring probe should never itself get rate-limited or eat into the budget meant for
 * real traffic.
 *
 * `version: VERSION_NEUTRAL` is required, not just the setGlobalPrefix exclusion in main.ts:
 * app.enableVersioning() applies the URI version prefix to every controller by default,
 * independently of the global "api" prefix exclusion, which only strips "api" -- without
 * this, the route actually resolves to "/v1/health" instead of the plain "/health" this
 * comment (and the README/architecture.md contract) claims. Caught by hitting the real
 * running server rather than just reading the code back.
 */
@Controller({ path: 'health', version: VERSION_NEUTRAL })
@SkipThrottle()
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly elasticsearch: ElasticsearchHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([() => this.elasticsearch.isHealthy('elasticsearch')]);
  }
}
