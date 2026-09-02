import { BadRequestException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { OrdersService } from './orders.service';
import { OrdersRepository } from './repositories/orders.repository';
import { encodeCursor } from './pagination/cursor.util';
import { createOrdersRepositoryMock, mockCreateOrderDto, mockCreateOrderResult, mockFindPageResult } from './orders.mock';

describe('OrdersService', () => {
  let service: OrdersService;
  let repository: ReturnType<typeof createOrdersRepositoryMock>;

  beforeEach(async () => {
    const repositoryMock = createOrdersRepositoryMock();

    const moduleRef = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: OrdersRepository, useValue: repositoryMock },
      ],
    }).compile();

    service = moduleRef.get(OrdersService);
    repository = moduleRef.get(OrdersRepository);
  });

  describe('createOrder', () => {
    it('delegates to the repository and maps the result to {id, createdAt}', async () => {
      repository.create.mockResolvedValue(mockCreateOrderResult);

      const result = await service.createOrder(mockCreateOrderDto);

      expect(repository.create).toHaveBeenCalledWith(mockCreateOrderDto);
      expect(result).toEqual(mockCreateOrderResult);
    });
  });

  describe('getOrdersPage', () => {
    it('defaults the page size to 20 when no limit is given', async () => {
      repository.findPage.mockResolvedValue(mockFindPageResult());
      await service.getOrdersPage(undefined, undefined);
      expect(repository.findPage).toHaveBeenCalledWith(undefined, 20);
    });

    it('caps the page size at 100 even if a larger limit is requested', async () => {
      repository.findPage.mockResolvedValue(mockFindPageResult());
      await service.getOrdersPage(undefined, 500);
      expect(repository.findPage).toHaveBeenCalledWith(undefined, 100);
    });

    it("encodes the repository's raw sort values into an opaque nextCursor string", async () => {
      repository.findPage.mockResolvedValue(
        mockFindPageResult({ nextCursorValues: ['2026-09-02T12:00:00.000Z', 'order-1'] }),
      );
      const result = await service.getOrdersPage(undefined, 10);
      expect(result.nextCursor).toBe(encodeCursor(['2026-09-02T12:00:00.000Z', 'order-1']));
    });

    it('returns meta.limit (the page size actually applied) and meta.total from the repository', async () => {
      repository.findPage.mockResolvedValue(mockFindPageResult({ total: 2048 }));
      const result = await service.getOrdersPage(undefined, 500);
      expect(result.meta).toEqual({ limit: 100, total: 2048 });
    });

    it('rejects a malformed cursor with a 400, instead of letting it reach Elasticsearch', async () => {
      await expect(service.getOrdersPage('not-a-real-cursor!!', 10)).rejects.toThrow(BadRequestException);
      expect(repository.findPage).not.toHaveBeenCalled();
    });
  });
});
