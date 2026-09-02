import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { CreateOrderResponseDto } from './dto/create-order-response.dto';
import { PagedOrdersDto } from './dto/paged-orders.dto';
import { ErrorEnvelopeDto } from '../common/dto/error-envelope.dto';

// Applies to every route below -- both are possible on any of them: 429 from the global
// ThrottlerGuard (APP_GUARD in AppModule, every controller unless @SkipThrottle), 503 from
// ConcurrencyLimitMiddleware (scoped to this controller specifically -- see
// app.module.ts's configure()). Documented once at the controller level instead of repeated
// per-route, same reasoning as CategoriesController's controller-level [ProducesResponseType]
// on the .NET side.
@ApiResponse({ status: 429, description: 'Rate limit exceeded.', type: ErrorEnvelopeDto })
@ApiResponse({ status: 503, description: 'Too many requests are being processed right now.', type: ErrorEnvelopeDto })
@ApiTags('orders')
@Controller({ path: 'orders', version: '1' })
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @ApiOperation({ summary: 'Create an order from the checkout form / cart contents.' })
  @ApiResponse({ status: 201, type: CreateOrderResponseDto })
  @ApiResponse({ status: 400, description: 'Validation failed (missing/invalid field).', type: ErrorEnvelopeDto })
  async createOrder(@Body() dto: CreateOrderDto): Promise<CreateOrderResponseDto> {
    return this.ordersService.createOrder(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Cursor-paginated order history, most recent first.' })
  // Both explicitly optional (required: false) -- without this, @nestjs/swagger has no way to
  // infer optionality from a plain @Query() parameter and defaults to marking it required,
  // which is what made Swagger UI show "cursor *"/"limit *" as mandatory fields even though
  // the controller method signature already has them as optional. `limit` is typed Number
  // for the same reason: Express query params always arrive as strings, but the Swagger
  // *contract* should describe the number a caller is meant to send, not the wire
  // representation -- OrdersService/getOrdersPage does the actual string-to-number handling.
  @ApiQuery({ name: 'cursor', required: false, type: String, description: 'Opaque cursor from a previous page\'s nextCursor. Omit for the first page.' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Page size, 1-100 (default 20).' })
  @ApiResponse({ status: 200, type: PagedOrdersDto })
  @ApiResponse({ status: 400, description: 'Malformed cursor.', type: ErrorEnvelopeDto })
  async getOrders(
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ): Promise<PagedOrdersDto> {
    return this.ordersService.getOrdersPage(cursor, limit ? Number(limit) : undefined);
  }
}
