import { Inject, Injectable } from '@nestjs/common';
import { HealthIndicatorResult, HealthIndicatorService } from '@nestjs/terminus';
import { Client } from '@elastic/elasticsearch';
import { ELASTICSEARCH_CLIENT } from '../../elasticsearch/elasticsearch-client.provider';

/**
 * Hand-written against the Elasticsearch client directly (one client.ping() call) rather
 * than a generic package -- Terminus doesn't ship an official Elasticsearch indicator, and
 * one ping() call didn't justify hunting for a third-party one. Mirrors server-catalog's
 * DatabaseHealthCheck: same reasoning, same shape (one CanConnectAsync()-equivalent call).
 */
@Injectable()
export class ElasticsearchHealthIndicator {
  constructor(
    private readonly healthIndicatorService: HealthIndicatorService,
    @Inject(ELASTICSEARCH_CLIENT) private readonly client: Client,
  ) {}

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    const indicator = this.healthIndicatorService.check(key);

    try {
      await this.client.ping();
      return indicator.up();
    } catch (error) {
      return indicator.down({ message: (error as Error).message });
    }
  }
}
