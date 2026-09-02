import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { ElasticsearchModule } from '../../elasticsearch/elasticsearch.module';
import { HealthController } from './health.controller';
import { ElasticsearchHealthIndicator } from './elasticsearch.health';

@Module({
  imports: [TerminusModule, ElasticsearchModule],
  controllers: [HealthController],
  providers: [ElasticsearchHealthIndicator],
})
export class HealthModule {}
