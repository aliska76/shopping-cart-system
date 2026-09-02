namespace Catalog.Domain.Entities;

public class Product
{
    public int Id { get; set; }

    public string NameEn { get; set; } = string.Empty;

    public string NameHe { get; set; } = string.Empty;

    public string? ImageUrl { get; set; }

    public string? ImagePath { get; set; }

    // ILS, 2 decimal places -- see ProductConfiguration for the SQL Server column type
    // (decimal(10,2): exact money, not the binary floating point double/float would give).
    public decimal UnitPrice { get; set; }

    public ProductUnit Unit { get; set; }

    public int CategoryId { get; set; }

    public Category Category { get; set; } = null!;
}
