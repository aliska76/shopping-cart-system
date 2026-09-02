using Catalog.Infrastructure.Repositories;
using Xunit;

namespace Catalog.Infrastructure.Tests;

public class InMemoryCategoryRepositoryTests
{
    [Fact]
    public async Task GetAllWithProductsAsync_ReturnsCategories_WithConsistentProductOwnership()
    {
        var repository = new InMemoryCategoryRepository();

        var categories = await repository.GetAllWithProductsAsync();

        Assert.NotEmpty(categories);

        foreach (var category in categories)
        {
            Assert.NotEmpty(category.Products);
            Assert.All(category.Products, product => Assert.Equal(category.Id, product.CategoryId));
        }
    }

    [Fact]
    public async Task GetProductsPageAsync_FirstPage_ReturnsOneItem_AndNonNullCursor_WhenMoreRemain()
    {
        var repository = new InMemoryCategoryRepository();
        var categories = await repository.GetAllWithProductsAsync();
        var category = categories.First(c => c.Products.Count >= 2);

        var page = await repository.GetProductsPageAsync(category.Id, cursor: null, limit: 1);

        Assert.Single(page.Items);
        Assert.NotNull(page.NextCursor);
        Assert.Equal(page.Items[0].Id, page.NextCursor);
    }

    [Fact]
    public async Task GetProductsPageAsync_WalkingCursorToTheEnd_ReturnsEveryProductExactlyOnce_AndEndsWithNullCursor()
    {
        var repository = new InMemoryCategoryRepository();
        var categories = await repository.GetAllWithProductsAsync();
        var category = categories.First(c => c.Products.Count >= 2);

        var seenIds = new List<int>();
        int? cursor = null;

        do
        {
            var page = await repository.GetProductsPageAsync(category.Id, cursor, limit: 1);
            seenIds.AddRange(page.Items.Select(p => p.Id));
            cursor = page.NextCursor;
        } while (cursor is not null);

        Assert.Equal(category.Products.Select(p => p.Id).OrderBy(id => id), seenIds.OrderBy(id => id));
    }

    [Fact]
    public async Task GetProductsPageAsync_Total_ReflectsTheWholeCategory_NotJustThisPage()
    {
        var repository = new InMemoryCategoryRepository();
        var categories = await repository.GetAllWithProductsAsync();
        var category = categories.First(c => c.Products.Count >= 2);

        // limit: 1 asks for a one-item page on purpose -- Total should still report every
        // product in the category, proving it isn't just Items.Count in disguise.
        var page = await repository.GetProductsPageAsync(category.Id, cursor: null, limit: 1);

        Assert.Single(page.Items);
        Assert.Equal(category.Products.Count, page.Total);
    }
}
