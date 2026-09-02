using Catalog.Application.Abstractions;
using Catalog.Domain.Entities;
using Catalog.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Catalog.Infrastructure.Repositories;

public class CategoryRepository : ICategoryRepository
{
    private readonly CatalogDbContext _dbContext;

    public CategoryRepository(CatalogDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<IReadOnlyList<Category>> GetAllWithProductsAsync(CancellationToken cancellationToken = default)
    {
        return await _dbContext.Categories
            .AsNoTracking()
            .Include(category => category.Products)
            .OrderBy(category => category.Id)
            .ToListAsync(cancellationToken);
    }

    public async Task<ProductsPage> GetProductsPageAsync(int categoryId, int? cursor, int limit, CancellationToken cancellationToken = default)
    {
        var categoryProducts = _dbContext.Products
            .AsNoTracking()
            .Where(product => product.CategoryId == categoryId);

        // Total count of every product in the category, independent of cursor/limit -- not
        // "how many are in this page," which page.Items.Count already tells the caller.
        // Queried before the cursor filter is applied below, since the cursor only bounds
        // *which* page comes back, not how many products the category has overall.
        var total = await categoryProducts.CountAsync(cancellationToken);

        var query = categoryProducts;
        if (cursor is { } afterId)
        {
            query = query.Where(product => product.Id > afterId);
        }

        var items = await query
            .OrderBy(product => product.Id)
            .Take(limit + 1)
            .ToListAsync(cancellationToken);

        var hasMore = items.Count > limit;
        if (hasMore)
        {
            items.RemoveAt(items.Count - 1);
        }

        var nextCursor = hasMore ? items[^1].Id : (int?)null;

        return new ProductsPage(items, nextCursor, total);
    }
}
