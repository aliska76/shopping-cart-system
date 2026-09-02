namespace Catalog.Domain.Entities;

public class Category
{
    public int Id { get; set; }

    public string NameEn { get; set; } = string.Empty;

    public string NameHe { get; set; } = string.Empty;

    public ICollection<Product> Products { get; set; } = new List<Product>();
}
