using Catalog.Application.Abstractions;
using Catalog.Domain.Entities;
using Catalog.Infrastructure.Caching;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;
using Moq;
using Xunit;

namespace Catalog.Infrastructure.Tests;

/// <summary>
/// Verifies the caching decorator's actual runtime behavior, not just that it compiles:
/// the full-catalog read is served from cache on a second call within the TTL (the whole
/// point of wrapping ICategoryRepository with it), while the paginated read is never
/// cached — see CachingCategoryRepository's own doc comment for why that split is
/// deliberate, not an oversight. Uses a real MemoryCache (not mocked) so the test proves
/// the decorator and the cache actually cooperate, not just that the mock was configured
/// to look like it.
/// </summary>
public class CachingCategoryRepositoryTests
{
    private static CachingCategoryRepository CreateSut(Mock<ICategoryRepository> inner, int ttlSeconds = 60)
    {
        var cache = new MemoryCache(new MemoryCacheOptions());
        var options = Options.Create(new CachingOptions { CategoriesTtlSeconds = ttlSeconds });

        return new CachingCategoryRepository(inner.Object, cache, options);
    }

    [Fact]
    public async Task GetAllWithProductsAsync_CalledTwice_OnlyHitsInnerRepositoryOnce()
    {
        var categories = new List<Category> { new() { Id = 1, NameEn = "Dairy", NameHe = "חלב וגבינות" } };

        var inner = new Mock<ICategoryRepository>();
        inner.Setup(r => r.GetAllWithProductsAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(categories);

        var sut = CreateSut(inner);

        var first = await sut.GetAllWithProductsAsync();
        var second = await sut.GetAllWithProductsAsync();

        Assert.Same(categories, first);
        Assert.Same(categories, second);
        inner.Verify(r => r.GetAllWithProductsAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task GetProductsPageAsync_CalledTwice_WithSameArguments_NeverCached_AlwaysHitsInnerRepository()
    {
        var page = new ProductsPage(new List<Product>(), null);

        var inner = new Mock<ICategoryRepository>();
        inner.Setup(r => r.GetProductsPageAsync(1, null, 10, It.IsAny<CancellationToken>()))
            .ReturnsAsync(page);

        var sut = CreateSut(inner);

        await sut.GetProductsPageAsync(1, cursor: null, limit: 10);
        await sut.GetProductsPageAsync(1, cursor: null, limit: 10);

        // Deliberately NOT cached — its result depends on (categoryId, cursor, limit),
        // so caching every combination would defeat the point of paging a large catalog.
        inner.Verify(r => r.GetProductsPageAsync(1, null, 10, It.IsAny<CancellationToken>()), Times.Exactly(2));
    }
}
