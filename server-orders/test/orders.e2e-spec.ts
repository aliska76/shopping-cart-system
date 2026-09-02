import { INestApplication, RequestMethod, ValidationPipe, VersioningType } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request = require('supertest'); 
import { AppModule } from '../src/app.module';
import { ELASTICSEARCH_CLIENT } from '../src/elasticsearch/elasticsearch-client.provider';

interface OrderDocument {
  id: string;
  fullName: string;
  email: string;
  address: string;
  items: { productId: number; productName: string; categoryName: string; quantity: number }[];
  createdAt: string;
}

/**
 * A stand-in for the real Elasticsearch client, swapped in below via `overrideProvider`, so
 * this whole suite runs without a live Elasticsearch cluster. Deliberately not a bare
 * `jest.fn()` per method returning canned responses -- `search()` actually replicates
 * OrdersRepository.findPage()'s own sort (`createdAt desc, id desc`) and `search_after`
 * slicing against an in-memory array, so the pagination tests below (two consecutive pages
 * never repeating an order) still exercise real cursor behavior instead of only the
 * HTTP/validation layer. Everything this stub needs to implement is exactly what
 * OrdersRepository calls (see repositories/orders.repository.ts) -- ping/indices.exists/
 * indices.create for onModuleInit, index() for create(), search() for findPage().
 */
function createElasticsearchClientStub() {
  const documents: OrderDocument[] = [];

  const sortKey = (doc: OrderDocument) => [doc.createdAt, doc.id] as const;

  return {
    ping: jest.fn().mockResolvedValue(true),
    indices: {
      exists: jest.fn().mockResolvedValue(true),
      create: jest.fn().mockResolvedValue(undefined),
    },
    index: jest.fn(async ({ id, document }: { id: string; document: OrderDocument }) => {
      documents.push({ ...document, id });
      return { result: 'created' };
    }),
    search: jest.fn(async ({ size, search_after }: { size: number; search_after?: [string, string] }) => {
      const sorted = [...documents].sort((a, b) => {
        if (a.createdAt !== b.createdAt) return b.createdAt.localeCompare(a.createdAt);
        return b.id.localeCompare(a.id);
      });

      const afterIndex = search_after
        ? sorted.findIndex((doc) => doc.createdAt === search_after[0] && doc.id === search_after[1])
        : -1;

      const page = sorted.slice(afterIndex + 1, afterIndex + 1 + size);

      return {
        hits: {
          hits: page.map((doc) => ({ _id: doc.id, _source: doc, sort: sortKey(doc) })),
          total: { value: documents.length },
        },
      };
    }),
  };
}

/**
 * Real end-to-end coverage for the one thing this service actually does: accept an order over
 * HTTP and let it be paged back out again. Boots the REAL AppModule -- real OrdersController,
 * real OrdersService, real OrdersRepository, real ValidationPipe/versioning/error-envelope
 * wiring -- but with the Elasticsearch *client* itself replaced by the in-memory stub above.
 * That's a deliberate line: OrdersRepository is real code under test here (its sort/cursor
 * logic runs for real against the stub), only the actual network client talking to a real
 * cluster is swapped out -- unlike orders.service.spec.ts, which mocks OrdersRepository
 * itself and never exercises the repository's own logic at all. This is also what makes the
 * suite runnable in CI or on a fresh clone with no Elasticsearch running anywhere.
 */
describe('Orders API (e2e)', () => {
  let app: INestApplication;

  const validOrder = {
    fullName: 'Alisa Rakhlina',
    email: 'aliska76@gmail.com',
    address: 'Tel Aviv',
    items: [{ productId: 1, productName: 'Milk 3%', categoryName: 'Dairy', quantity: 2 }],
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(ELASTICSEARCH_CLIENT)
      .useValue(createElasticsearchClientStub())
      .compile();

    app = moduleFixture.createNestApplication();

    // Mirrors main.ts's bootstrap() exactly (prefix / versioning / validation pipe) -- these
    // tests are only meaningful if they exercise the same HTTP stack the real running server
    // does, not a hand-picked subset of it.
    app.setGlobalPrefix('api', { exclude: [{ path: 'health', method: RequestMethod.GET }] });
    app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /health', () => {
    it('is reachable without the /api prefix or a version segment, and reports Elasticsearch as up', async () => {
      const response = await request(app.getHttpServer()).get('/health');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('ok');
      expect(response.body.info.elasticsearch.status).toBe('up');
    });
  });

  describe('POST /api/v1/orders', () => {
    it('creates an order and returns its generated id + createdAt', async () => {
      const response = await request(app.getHttpServer()).post('/api/v1/orders').send(validOrder);

      expect(response.status).toBe(201);
      expect(response.body.id).toEqual(expect.any(String));
      expect(response.body.createdAt).toEqual(expect.any(String));
    });

    it.each([
      ['fullName', { ...validOrder, fullName: '' }],
      ['address', { ...validOrder, address: '' }],
      ['email', { ...validOrder, email: 'not-an-email' }],
    ])('rejects an order with a bad %s', async (_field, body) => {
      const response = await request(app.getHttpServer()).post('/api/v1/orders').send(body);
      expect(response.status).toBe(400);
    });

    it('rejects a missing required field with the shared { status, message, errors[] } envelope', async () => {
      const { fullName: _fullName, ...withoutFullName } = validOrder;

      const response = await request(app.getHttpServer()).post('/api/v1/orders').send(withoutFullName);

      expect(response.status).toBe(400);
      expect(response.body).toMatchObject({ status: 400, message: 'Validation failed' });
      expect(response.body.errors.some((message: string) => message.includes('fullName'))).toBe(true);
    });

    it('rejects an empty items array', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/orders')
        .send({ ...validOrder, items: [] });

      expect(response.status).toBe(400);
    });

    it('rejects an unknown top-level field instead of silently dropping it (forbidNonWhitelisted)', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/orders')
        .send({ ...validOrder, unitPrice: 6.9 });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/v1/orders', () => {
    it('returns the order just created in its page, most recent first', async () => {
      const createResponse = await request(app.getHttpServer()).post('/api/v1/orders').send(validOrder);
      const createdId = createResponse.body.id as string;

      const response = await request(app.getHttpServer()).get('/api/v1/orders').query({ limit: 5 });

      expect(response.status).toBe(200);
      expect(response.body.items[0].id).toBe(createdId);
      expect(response.body.meta.limit).toBe(5);
      expect(response.body.meta.total).toBeGreaterThanOrEqual(1);
    });

    it('rejects a malformed cursor with 400 instead of letting it reach Elasticsearch', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/orders')
        .query({ cursor: 'not-a-real-cursor!!' });

      expect(response.status).toBe(400);
    });

    it('pages with a real cursor: two consecutive size-1 pages never repeat an order', async () => {
      // Relies on at least two orders already existing by this point in the file (created by
      // the tests above, stored in the stub's in-memory `documents` array).
      const page1 = await request(app.getHttpServer()).get('/api/v1/orders').query({ limit: 1 });
      expect(page1.body.items).toHaveLength(1);
      expect(page1.body.nextCursor).toEqual(expect.any(String));

      const page2 = await request(app.getHttpServer())
        .get('/api/v1/orders')
        .query({ limit: 1, cursor: page1.body.nextCursor });

      expect(page2.body.items).toHaveLength(1);
      expect(page2.body.items[0].id).not.toBe(page1.body.items[0].id);
    });
  });
});
