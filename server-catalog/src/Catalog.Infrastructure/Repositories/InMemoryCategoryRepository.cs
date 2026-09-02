using Catalog.Application.Abstractions;
using Catalog.Domain.Entities;
using Catalog.Infrastructure.Persistence.Seed;

namespace Catalog.Infrastructure.Repositories;

/// <summary>
/// A zero-dependency stand-in for <see cref="CategoryRepository"/> — same contract
/// (<see cref="ICategoryRepository"/>), no SQL Server required. Swapping between the
/// two is a one-line change in <see cref="DependencyInjection.AddInfrastructureServices"/>;
/// nothing in Catalog.Application or Catalog.Api has to change, because both only ever
/// depend on the interface. Toggle with "Catalog:UseInMemoryStore" — useful for running
/// the API standalone (no Docker) while iterating on the client, or for fast tests.
///
/// Product/category data comes from <see cref="CatalogDemoData"/> — the same source
/// <see cref="Persistence.Seed.CatalogSeeder"/> uses for the real database, so this list
/// can't quietly drift out of sync with it again. SQL Server assigns real Ids via its
/// identity column when CatalogSeeder saves; here there's no database to do that, so
/// BuildSeed assigns its own (category-coded, e.g. 101/102/... for category 1).
/// </summary>
public class InMemoryCategoryRepository : ICategoryRepository
{
    private static readonly IReadOnlyList<Category> Seed = BuildSeed();

    public Task<IReadOnlyList<Category>> GetAllWithProductsAsync(CancellationToken cancellationToken = default)
        => Task.FromResult(Seed);

    public Task<ProductsPage> GetProductsPageAsync(int categoryId, int? cursor, int limit, CancellationToken cancellationToken = default)
    {
        var categoryProducts = Seed
            .Where(category => category.Id == categoryId)
            .SelectMany(category => category.Products)
            .ToList();

        // Total count of every product in the category, independent of cursor/limit -- the
        // same distinction as CategoryRepository's EF Core version: this is the category's
        // full size, not how many items happen to be on this one page.
        var total = categoryProducts.Count;

        var products = categoryProducts
            .Where(product => cursor is null || product.Id > cursor)
            .OrderBy(product => product.Id)
            .Take(limit + 1)
            .ToList();

        var hasMore = products.Count > limit;
        if (hasMore)
        {
            products.RemoveAt(products.Count - 1);
        }

        var nextCursor = hasMore ? products[^1].Id : (int?)null;

        return Task.FromResult(new ProductsPage(products, nextCursor, total));
    }

    private static IReadOnlyList<Category> BuildSeed()
    {
        var categories = CatalogDemoData.BuildCategories();

        var categoryId = 0;
        foreach (var category in categories)
        {
            category.Id = ++categoryId;

            var productSequence = 0;
            foreach (var product in category.Products)
            {
                product.Id = category.Id * 100 + ++productSequence;
                product.CategoryId = category.Id;
                product.Category = category;
            }
        }

        return categories;
    }
}
