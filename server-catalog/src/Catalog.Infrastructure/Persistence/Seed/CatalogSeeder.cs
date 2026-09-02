using Microsoft.EntityFrameworkCore;

namespace Catalog.Infrastructure.Persistence.Seed;

public static class CatalogSeeder
{
    public static async Task SeedAsync(CatalogDbContext dbContext)
    {
        await dbContext.Database.MigrateAsync();

        if (await dbContext.Categories.AnyAsync())
        {
            return;
        }

        // Product/category data lives in CatalogDemoData — shared with InMemoryCategoryRepository
        // so the two ICategoryRepository backends can't drift apart the way they already had.
        dbContext.Categories.AddRange(CatalogDemoData.BuildCategories());

        await dbContext.SaveChangesAsync();
    }
}