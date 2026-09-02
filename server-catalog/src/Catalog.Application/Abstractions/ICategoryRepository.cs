using Catalog.Domain.Entities;

namespace Catalog.Application.Abstractions;

public interface ICategoryRepository
{
    Task<IReadOnlyList<Category>> GetAllWithProductsAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// Keyset ("seek") pagination over the products in one category, ordered by Id.
    /// Pass the previous page's <see cref="ProductsPage.NextCursor"/> back in as
    /// <paramref name="cursor"/> to fetch the next page; omit it for the first page.
    /// Chosen over offset/skip paging because it stays O(limit) per page no matter how
    /// deep the catalog grows, and results don't shift under concurrent inserts.
    /// </summary>
    Task<ProductsPage> GetProductsPageAsync(int categoryId, int? cursor, int limit, CancellationToken cancellationToken = default);
}

public sealed record ProductsPage(IReadOnlyList<Product> Items, int? NextCursor, int Total);
