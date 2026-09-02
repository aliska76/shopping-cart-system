using Catalog.Application.Abstractions;
using Catalog.Application.Dtos;
using Catalog.Application.Services;
using Catalog.Domain.Entities;
using Moq;
using Xunit;

namespace Catalog.Application.Tests;

public class CategoryServiceTests
{
    [Fact]
    public async Task GetCategoriesAsync_MapsEntitiesToDtos_PreservingFieldsAndNesting()
    {
        var dairy = new Category { Id = 1, NameEn = "Dairy", NameHe = "חלב וגבינות" };
        dairy.Products.Add(new Product { Id = 101, NameEn = "Milk", NameHe = "חלב", ImageUrl = "https://example.com/milk.png", ImagePath = "/images/milk.png", CategoryId = 1, Category = dairy });

        var meat = new Category { Id = 2, NameEn = "Meat", NameHe = "בשר" };
        meat.Products.Add(new Product { Id = 201, NameEn = "Salmon", NameHe = "סלמון", CategoryId = 2, Category = meat });
        meat.Products.Add(new Product { Id = 202, NameEn = "Sausages", NameHe = "נקניקיות", CategoryId = 2, Category = meat });

        var repository = new Mock<ICategoryRepository>();
        repository
            .Setup(r => r.GetAllWithProductsAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<Category> { dairy, meat });

        var service = new CategoryService(repository.Object);

        var result = await service.GetCategoriesAsync();

        Assert.Equal(2, result.Count);

        var dairyDto = Assert.Single(result, c => c.Id == 1);
        Assert.Equal("Dairy", dairyDto.NameEn);
        Assert.Equal("חלב וגבינות", dairyDto.NameHe);
        var dairyProduct = Assert.Single(dairyDto.Products);
        Assert.Equal("https://example.com/milk.png", dairyProduct.ImageUrl);
        Assert.Equal("/images/milk.png", dairyProduct.ImagePath);

        var meatDto = Assert.Single(result, c => c.Id == 2);
        Assert.Equal(2, meatDto.Products.Count);
        Assert.DoesNotContain(meatDto.Products, p => p.Id == 101); // products from one category never leak into another
    }

    [Fact]
    public async Task GetCategoriesAsync_EmptyRepository_ReturnsEmptyList()
    {
        var repository = new Mock<ICategoryRepository>();
        repository
            .Setup(r => r.GetAllWithProductsAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<Category>());

        var service = new CategoryService(repository.Object);

        var result = await service.GetCategoriesAsync();

        Assert.Empty(result);
    }

    [Fact]
    public async Task GetProductsPageAsync_MapsRepositoryResult_IncludingMeta()
    {
        var dairy = new Category { Id = 1, NameEn = "Dairy", NameHe = "חלב וגבינות" };
        var milk = new Product { Id = 101, NameEn = "Milk", NameHe = "חלב", CategoryId = 1, Category = dairy };

        var repository = new Mock<ICategoryRepository>();
        repository
            // Total (37) deliberately doesn't match Items.Count (1) here -- Total is the
            // category's full product count across every page, not this page's size, and the
            // test should fail if CategoryService ever conflated the two.
            .Setup(r => r.GetProductsPageAsync(1, null, 20, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ProductsPage(new List<Product> { milk }, NextCursor: null, Total: 37));

        var service = new CategoryService(repository.Object);

        var result = await service.GetProductsPageAsync(1, cursor: null, limit: 20);

        var item = Assert.Single(result.Items);
        Assert.Equal(101, item.Id);
        Assert.Null(result.NextCursor);
        // Meta.Limit is the limit CategoryService was actually called with (already clamped by
        // the controller before this point), not anything the repository reports back.
        Assert.Equal(new ProductsMetaDto(Limit: 20, Total: 37), result.Meta);
    }
}
