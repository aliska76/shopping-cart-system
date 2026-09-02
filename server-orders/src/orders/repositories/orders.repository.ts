import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client } from '@elastic/elasticsearch';
import { randomUUID } from 'crypto';
import { ELASTICSEARCH_CLIENT } from '../../elasticsearch/elasticsearch-client.provider';
import { JsonLogger } from '../../common/logging/json-logger';
import { CreateOrderDto } from '../dto/create-order.dto';
import { OrderDto } from '../dto/order.dto';
import { SortValues } from '../pagination/cursor.util';

interface OrderDocument {
  id: string;
  fullName: string;
  email: string;
  address: string;
  items: { productId: number; productName: string; categoryName: string; quantity: number }[];
  createdAt: string;
}

// Nested (not object!) for items -- flattening it to plain "object" type would silently
// break correctness for queries against individual line items (e.g. "orders containing
// product X with quantity > 2"), since Elasticsearch would lose the association between a
// single item's fields once several items sit in the same array. See architecture.md.
const INDEX_MAPPING = {
  properties: {
    // A real, sortable field -- not just relying on Elasticsearch's own "_id". Sorting on
    // "_id" fails outright ("Fielddata access on the _id field is disallowed"): Elasticsearch
    // doesn't build doc values for "_id" by default, since sorting on it is discouraged for
    // performance reasons. search_after needs a genuinely unique tiebreaker alongside
    // "createdAt" (two orders can share a timestamp), so the same UUID already used as the
    // document "_id" (see create() below) is also stored here as an ordinary "keyword" field,
    // which *does* get doc values, and that's what findPage() actually sorts on.
    id: { type: 'keyword' },
    fullName: { type: 'text' },
    email: { type: 'keyword' },
    address: { type: 'text' },
    createdAt: { type: 'date' },
    items: {
      type: 'nested',
      properties: {
        productId: { type: 'integer' },
        productName: { type: 'text' },
        categoryName: { type: 'keyword' },
        quantity: { type: 'integer' },
      },
    },
  },
};

/**
 * The Infrastructure-layer equivalent of server-catalog's CategoryRepository: the only class
 * in this service that knows Elasticsearch exists. OrdersService (Application layer) depends
 * on this class's public methods, never on the ES client directly. Works entirely in raw
 * SortValues tuples for pagination -- turning that into an opaque cursor *string* is
 * OrdersService's job, not this repository's; see cursor.util.ts.
 */
@Injectable()
export class OrdersRepository implements OnModuleInit {
  private readonly indexName: string;

  constructor(
    @Inject(ELASTICSEARCH_CLIENT) private readonly client: Client,
    configService: ConfigService,
    private readonly logger: JsonLogger,
  ) {
    this.indexName = configService.get<string>('elasticsearch.ordersIndex', 'orders');
  }

  /**
   * Creates the orders index with its mapping if it doesn't exist yet -- the Elasticsearch
   * equivalent of server-catalog's "migrations auto-apply at startup"
   * (CatalogSeeder.SeedAsync calling dbContext.Database.MigrateAsync()). Idempotent: safe to
   * run on every boot.
   *
   * Waits for Elasticsearch to actually accept connections first. `docker compose up -d`
   * returns as soon as the container starts, not once it's ready -- Elasticsearch can take
   * anywhere from a few seconds to over a minute to come up locally, and without this the app
   * would crash on the very first request instead of just starting a few seconds later than
   * the ES container. This is the app-level counterpart to docker-compose's own healthcheck
   * on orders-es (see architecture.md, point 11): that healthcheck stops *other containers*
   * from starting against a not-yet-ready orders-es, but nothing enforces the same ordering
   * for server-orders itself, since it isn't containerized.
   */
  async onModuleInit(): Promise<void> {
    await this.waitForElasticsearch();

    const exists = await this.client.indices.exists({ index: this.indexName });

    if (!exists) {
      // cast: the ES client's mapping types are stricter than TS can cleanly infer from a
      // plain literal object here; the shape above matches the real Elasticsearch mapping API.
      await this.client.indices.create({
        index: this.indexName,
        mappings: INDEX_MAPPING as any,
      });
    }
  }

  private async waitForElasticsearch(maxAttempts = 20, delayMs = 3000): Promise<void> {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        await this.client.ping();
        return;
      } catch (error) {
        if (attempt === maxAttempts) {
          this.logger.error(
            `Elasticsearch still unreachable after ${maxAttempts} attempts -- giving up. Is 'docker compose up -d' running from the repo root?`,
            error instanceof Error ? error.stack : undefined,
            OrdersRepository.name,
          );
          throw error;
        }

        this.logger.warn(
          `Elasticsearch not reachable yet (attempt ${attempt}/${maxAttempts}) -- retrying in ${delayMs}ms`,
          OrdersRepository.name,
        );
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }

  async create(dto: CreateOrderDto): Promise<{ id: string; createdAt: string }> {
    const id = randomUUID();
    const createdAt = new Date().toISOString();

    const document: OrderDocument = {
      id,
      fullName: dto.fullName,
      email: dto.email,
      address: dto.address,
      items: dto.items,
      createdAt,
    };

    // refresh: 'wait_for' makes a new order visible to the very next GET /orders -- the right
    // trade-off for a low-write demo API; a high-throughput deployment would drop this and
    // accept Elasticsearch's default ~1s indexing delay instead (see README, Possible
    // improvements).
    await this.client.index({
      index: this.indexName,
      id,
      document,
      refresh: 'wait_for',
    });

    return { id, createdAt };
  }

  async findPage(
    searchAfter: SortValues | undefined,
    limit: number,
  ): Promise<{ items: OrderDto[]; nextCursorValues: SortValues | null; total: number }> {
    const result = await this.client.search<OrderDocument>({
      index: this.indexName,
      size: limit + 1,
      sort: [{ createdAt: 'desc' }, { id: 'desc' }],
      search_after: searchAfter,
      // Elasticsearch stops counting hits at 10,000 by default (track_total_hits: false's
      // implicit cap) -- fine for a match/no-match check, wrong for a "total" number shown to
      // a client. track_total_hits: true forces an exact count for every request. That's a
      // real cost on a huge index (ES has to visit every matching doc, not just the page's
      // worth), but this is an admin-facing order list, not a public search endpoint under
      // heavy load, so an exact total is worth more here than the extra count cost.
      track_total_hits: true,
    });

    const hits = result.hits.hits;
    const hasMore = hits.length > limit;
    const pageHits = hasMore ? hits.slice(0, limit) : hits;

    const items: OrderDto[] = pageHits.map((hit) => ({
      // _source.id is always identical to _id (both come from the same generated UUID in
      // create()) -- spread first, then id, so the true document id wins even if that were
      // ever not the case.
      ...(hit._source as OrderDocument),
      id: hit._id as string,
    }));

    const nextCursorValues = hasMore
      ? (pageHits[pageHits.length - 1].sort as unknown as SortValues)
      : null;

    // total_hits.value is a number once track_total_hits: true forces an exact count (its type
    // is technically "number | TotalHitsRelation object" because ES can also report a *lower
    // bound* like "gte 10000" when track_total_hits is left false/omitted -- not a case we hit
    // here since we always pass true).
    const total = typeof result.hits.total === 'number' ? result.hits.total : (result.hits.total?.value ?? 0);

    return { items, nextCursorValues, total };
  }
}
