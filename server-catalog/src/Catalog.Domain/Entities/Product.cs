namespace Catalog.Domain.Entities;

public class Product
{
    public int Id { get; set; }

    public string NameEn { get; set; } = string.Empty;

    public string NameHe { get; set; } = string.Empty;

    public string? ImageUrl { get; set; }

    public string? ImagePath { get; set; }

    public int CategoryId { get; set; }

    public Category Category { get; set; } = null!;
}
