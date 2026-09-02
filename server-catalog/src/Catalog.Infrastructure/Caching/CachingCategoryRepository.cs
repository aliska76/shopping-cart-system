using Catalog.Application.Abstractions;
using Catalog.Domain.Entities;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;

namespace Catalog.Infrastructure.Caching;

/// <summary>
/// Decorates <see cref="ICategoryRepository"/> with an in-process <see cref="IMemoryCache"/>.
/// Only <see cref="GetAllWithProductsAsync"/> is cached — it is the hot, low-cardinality read
/// behind GET /api/v1/categories. The paginated product query is deliberately NOT cached:
/// its result depends on (categoryId, cursor, limit), so caching it would mean one cache
/// entry per page/parameter combination, which defeats the point of paging a large catalog.
/// Registered in <see cref="DependencyInjection.AddInfrastructureServices"/>, wrapping
/// whichever concrete repository "Catalog:UseInMemoryStore" selects — the caching layer is
/// the same either way.
/// </summary>
public class CachingCategoryRepository : ICategoryRepository
{
    private const string CacheKey = "categories:all";

    private readonly ICategoryRepository _inner;
    private readonly IMemoryCache _cache;
    private readonly CachingOptions _options;

    public CachingCategoryRepository(ICategoryRepository inner, IMemoryCache cache, IOptions<CachingOptions> options)
    {
        _inner = inner;
        _cache = cache;
        _options = options.Value;
    }

    public async Task<IReadOnlyList<Category>> GetAllWithProductsAsync(CancellationToken cancellationToken = default)
    {
        if (_cache.TryGetValue(CacheKey, out IReadOnlyList<Category>? cached) && cached is not null)
        {
            return cached;
        }

        var categories = await _inner.GetAllWithProductsAsync(cancellationToken);

        _cache.Set(CacheKey, categories, TimeSpan.FromSeconds(_options.CategoriesTtlSeconds));

        return categories;
    }

    public Task<ProductsPage> GetProductsPageAsync(int categoryId, int? cursor, int limit, CancellationToken cancellationToken = default)
        => _inner.GetProductsPageAsync(categoryId, cursor, limit, cancellationToken);
}
