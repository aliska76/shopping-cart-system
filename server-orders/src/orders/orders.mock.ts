import { CreateOrderDto } from './dto/create-order.dto';
import { OrdersRepository } from './repositories/orders.repository';

/**
 * Shared test fixtures for OrdersService's test suite. Pulled out after the same
 * `repository.create`/`findPage` mock boilerplate and the same "empty page" result shape
 * started getting retyped in nearly every test in orders.service.spec.ts -- one place to
 * update if OrdersRepository's method signatures or return shape change again, instead of
 * hunting down every test that happened to duplicate them.
 */

export const mockCreateOrderDto: CreateOrderDto = {
  fullName: 'Alisa Rakhlina',
  email: 'aliska76@gmail.com',
  address: 'Tel Aviv',
  items: [{ productId: 1, productName: 'Milk 3%', categoryName: 'Dairy', quantity: 2 }],
};

export const mockCreateOrderResult = { id: 'order-1', createdAt: '2026-09-02T12:00:00.000Z' };

type FindPageResult = Awaited<ReturnType<OrdersRepository['findPage']>>;

// The shape OrdersRepository.findPage() resolves with -- defaults to "nothing to page
// through" (the common case in OrdersService's own unit tests, which mock the repository out
// entirely and only care about how OrdersService maps/clamps/encodes, not about real
// Elasticsearch results), with `overrides` for the handful of tests that need a specific
// nextCursorValues/total instead.
export function mockFindPageResult(overrides: Partial<FindPageResult> = {}): FindPageResult {
  return { items: [], nextCursorValues: null, total: 0, ...overrides };
}

// jest.Mocked<OrdersRepository> would also require mocking onModuleInit and every private
// method TypeScript still considers part of the class's shape -- OrdersService only ever
// calls create()/findPage(), so that's all the double needs to implement.
export function createOrdersRepositoryMock(): jest.Mocked<Pick<OrdersRepository, 'create' | 'findPage'>> {
  return {
    create: jest.fn(),
    findPage: jest.fn(),
  };
}
