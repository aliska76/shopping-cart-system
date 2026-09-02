import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayNotEmpty, IsArray, IsEmail, IsNotEmpty, IsString, ValidateNested } from 'class-validator';
import { OrderItemDto } from './order-item.dto';

// "fullName", not firstName+lastName: the assignment specifies 3 fields for the checkout
// form, and splitting the name into two would make it 4 -- see architecture.md, decision #4.
export class CreateOrderDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  address: string;

  @ApiProperty({ type: [OrderItemDto] })
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];
}
