import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { CreateOrderResponseDto } from './dto/create-order-response.dto';
import { PagedOrdersDto } from './dto/paged-orders.dto';
import { OrdersRepository } from './repositories/orders.repository';
import { decodeCursor, encodeCursor, SortValues } from './pagination/cursor.util';

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

/**
 * Application-layer logic -- the one place with actual behavior in this service, the same
 * role CategoryService plays in server-catalog: page-size defaulting/clamping and cursor
 * string <-> SortValues translation live here, not in the controller or the repository.
 */
@Injectable()
export class OrdersService {
  constructor(private readonly ordersRepository: OrdersRepository) {}

  async createOrder(dto: CreateOrderDto): Promise<CreateOrderResponseDto> {
    const { id, createdAt } = await this.ordersRepository.create(dto);

    return new CreateOrderResponseDto(id, createdAt);
  }

  async getOrdersPage(cursor: string | undefined, limit: number | undefined): Promise<PagedOrdersDto> {
    const pageSize = !limit || limit <= 0 ? DEFAULT_PAGE_SIZE : Math.min(limit, MAX_PAGE_SIZE);
    const searchAfter = cursor ? this.safeDecodeCursor(cursor) : undefined;

    const { items, nextCursorValues, total } = await this.ordersRepository.findPage(searchAfter, pageSize);

    return {
      items,
      nextCursor: nextCursorValues ? encodeCursor(nextCursorValues) : null,
      meta: { limit: pageSize, total },
    };
  }

  private safeDecodeCursor(cursor: string): SortValues {
    try {
      return decodeCursor(cursor);
    } catch {
      throw new BadRequestException('Invalid pagination cursor.');
    }
  }
}
