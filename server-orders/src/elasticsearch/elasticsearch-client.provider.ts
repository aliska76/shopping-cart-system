import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client } from '@elastic/elasticsearch';

export const ELASTICSEARCH_CLIENT = Symbol('ELASTICSEARCH_CLIENT');

export const elasticsearchClientProvider: Provider = {
  provide: ELASTICSEARCH_CLIENT,
  useFactory: (configService: ConfigService) =>
    new Client({ node: configService.get<string>('elasticsearch.node', 'http://localhost:9200') }),
  inject: [ConfigService],
};
