namespace Catalog.Application.Dtos;

// No "page" number here on purpose -- same reasoning as server-orders' meta ("architecture.md",
// point 26): GetProductsPageAsync is keyset (cursor) pagination, ordered by Id and filtered
// Id > cursor, not offset/skip. There's no coherent "page 7" to report when pages are addressed
// by an opaque cursor instead of a skip count -- a client can only walk forward one cursor at a
// time. Limit and Total are what a client can actually use: Limit is the page size that was
// really applied (after clamping in the controller), Total is the full count of products in the
// category across every page.
public sealed record ProductsMetaDto(int Limit, int Total);

public record PagedProductsDto(IReadOnlyList<ProductDto> Items, int? NextCursor, ProductsMetaDto Meta);
