import { ApiProperty } from '@nestjs/swagger';

export class CreateOrderResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  createdAt: string;

  constructor(id: string, createdAt: string) {
    this.id = id;
    this.createdAt = createdAt;
  }
}
