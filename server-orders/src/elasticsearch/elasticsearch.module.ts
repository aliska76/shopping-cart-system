import { Module } from '@nestjs/common';
import { elasticsearchClientProvider } from './elasticsearch-client.provider';

/**
 * One shared Elasticsearch Client instance (one connection pool), imported by both
 * OrdersModule and HealthModule -- without this shared module each would get its own
 * separately-provided Client, which is both wasteful and pointless to keep in sync.
 */
@Module({
  providers: [elasticsearchClientProvider],
  exports: [elasticsearchClientProvider],
})
export class ElasticsearchModule {}
