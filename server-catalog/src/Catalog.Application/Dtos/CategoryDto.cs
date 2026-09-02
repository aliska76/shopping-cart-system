namespace Catalog.Application.Dtos;

public record CategoryDto(int Id, string NameEn, string NameHe, IReadOnlyList<ProductDto> Products);
