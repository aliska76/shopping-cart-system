import { ApiProperty } from '@nestjs/swagger';
import { OrderDto } from './order.dto';

export class PagedOrdersMetaDto {
  // No "page" number here on purpose: this endpoint uses search_after (keyset/cursor)
  // pagination, not offset pagination -- there is no stable "page 3 of N" concept when pages
  // are addressed by an opaque cursor instead of a skip count, and a client can't jump to an
  // arbitrary page anyway. "limit" (the page size actually applied, after defaulting/clamping)
  // and "total" (the full matching count) are what a client can meaningfully use, e.g. to
  // render "2048 orders total" or decide whether it's worth paging further.
  @ApiProperty({ description: 'Page size actually applied (after defaulting/clamping).' })
  limit: number;

  @ApiProperty({ description: 'Total number of orders matching the query, across all pages.' })
  total: number;
}

export class PagedOrdersDto {
  @ApiProperty({ type: [OrderDto] })
  items: OrderDto[];

  @ApiProperty({ nullable: true, type: String })
  nextCursor: string | null;

  @ApiProperty({ type: PagedOrdersMetaDto })
  meta: PagedOrdersMetaDto;
}
