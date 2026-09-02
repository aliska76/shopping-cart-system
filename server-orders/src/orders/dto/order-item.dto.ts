import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsString, Min } from 'class-validator';

export class OrderItemDto {
  @ApiProperty()
  @IsInt()
  @Min(1)
  productId: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  productName: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  categoryName: string;

  @ApiProperty()
  @IsInt()
  @Min(1)
  quantity: number;
}
