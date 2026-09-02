using Catalog.Application.Dtos;

namespace Catalog.Application.Services;

public interface ICategoryService
{
    Task<IReadOnlyList<CategoryDto>> GetCategoriesAsync(CancellationToken cancellationToken = default);

    Task<PagedProductsDto> GetProductsPageAsync(int categoryId, int? cursor, int limit, CancellationToken cancellationToken = default);
}
