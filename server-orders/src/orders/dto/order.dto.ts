import { ApiProperty } from '@nestjs/swagger';
import { OrderItemDto } from './order-item.dto';

export class OrderDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  fullName: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  address: string;

  @ApiProperty({ type: [OrderItemDto] })
  items: OrderItemDto[];

  @ApiProperty()
  createdAt: string;
}
