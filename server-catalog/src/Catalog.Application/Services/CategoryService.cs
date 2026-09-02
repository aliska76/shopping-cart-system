using Catalog.Application.Abstractions;
using Catalog.Application.Dtos;

namespace Catalog.Application.Services;

public class CategoryService : ICategoryService
{
    private readonly ICategoryRepository _categoryRepository;

    public CategoryService(ICategoryRepository categoryRepository)
    {
        _categoryRepository = categoryRepository;
    }

    public async Task<IReadOnlyList<CategoryDto>> GetCategoriesAsync(CancellationToken cancellationToken = default)
    {
        var categories = await _categoryRepository.GetAllWithProductsAsync(cancellationToken);

        return categories
            .Select(category => new CategoryDto(
                category.Id,
                category.NameEn,
                category.NameHe,
                category.Products
                    .Select(product => new ProductDto(product.Id, product.NameEn, product.NameHe, product.ImageUrl, product.ImagePath))
                    .ToList()))
            .ToList();
    }

    public async Task<PagedProductsDto> GetProductsPageAsync(int categoryId, int? cursor, int limit, CancellationToken cancellationToken = default)
    {
        var page = await _categoryRepository.GetProductsPageAsync(categoryId, cursor, limit, cancellationToken);

        var items = page.Items
            .Select(product => new ProductDto(product.Id, product.NameEn, product.NameHe, product.ImageUrl, product.ImagePath))
            .ToList();

        return new PagedProductsDto(items, page.NextCursor, new ProductsMetaDto(limit, page.Total));
    }
}
