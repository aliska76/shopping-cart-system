import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import configuration from './config/configuration';
import { LoggingModule } from './common/logging/logging.module';
import { RequestLoggingMiddleware } from './common/middleware/request-logging.middleware';
import { ConcurrencyLimitMiddleware } from './common/middleware/concurrency-limit.middleware';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { HealthModule } from './common/health/health.module';
import { OrdersModule } from './orders/orders.module';
import { OrdersController } from './orders/orders.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [configuration] }),
    // Sliding-window-equivalent per-client rate limiting, applied globally via the
    // APP_GUARD provider below -- the Nest ecosystem's own first-party rate-limiting module.
    // Config-driven with defaults: see RATE_LIMIT_TTL_SECONDS / RATE_LIMIT_LIMIT in
    // .env.example.
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        throttlers: [
          {
            ttl: configService.get<number>('rateLimit.ttlSeconds', 60) * 1000,
            limit: configService.get<number>('rateLimit.limit', 100),
          },
        ],
      }),
    }),
    LoggingModule,
    HealthModule,
    OrdersModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
    ConcurrencyLimitMiddleware,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestLoggingMiddleware).forRoutes('*');

    // Scoped to OrdersController only, not '*' -- concurrency limiting is about protecting
    // the routes that actually do meaningful work (hitting Elasticsearch), not cheap ones
    // like GET /health that should stay responsive even while orders traffic is saturated.
    consumer.apply(ConcurrencyLimitMiddleware).forRoutes(OrdersController);
  }
}
