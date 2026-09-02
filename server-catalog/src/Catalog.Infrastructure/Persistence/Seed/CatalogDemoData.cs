using System.Text.Json;
using Catalog.Domain.Entities;

namespace Catalog.Infrastructure.Persistence.Seed;

/// <summary>
/// Single source of truth for the demo catalog (3 categories, 18 products), shared by both
/// <see cref="ICategoryRepository"/> implementations — <see cref="CatalogSeeder"/> (real SQL
/// Server, via EF Core) and <see cref="Repositories.InMemoryCategoryRepository"/>
/// (zero-dependency stand-in). The actual data lives in catalog-demo-data.json (embedded
/// resource, next to this file) — not hardcoded as C# object initializers — so adding or
/// editing a product is a one-line JSON edit, not a new C# statement, and the 18 products
/// don't read as 18 near-identical lines of code. This class only deserializes that file and
/// maps it onto the domain entities; both ICategoryRepository backends call BuildCategories()
/// so they can't drift apart the way they already had once (the in-memory copy still had the
/// original 9 products after the catalog grew to 18).
///
/// Ids are intentionally NOT set here: SQL Server assigns them via the identity column when
/// CatalogSeeder saves, and InMemoryCategoryRepository assigns its own sequential Ids
/// afterward, since it has no database to do that for it.
/// </summary>
public static class CatalogDemoData
{
    private const string ResourceName = "Catalog.Infrastructure.Persistence.Seed.catalog-demo-data.json";
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    public static List<Category> BuildCategories()
    {
        var categoryRecords = LoadCategoryRecords();

        var categories = new List<Category>();
        foreach (var categoryRecord in categoryRecords)
        {
            var category = new Category { NameEn = categoryRecord.NameEn, NameHe = categoryRecord.NameHe };

            foreach (var productRecord in categoryRecord.Products)
            {
                category.Products.Add(new Product
                {
                    NameEn = productRecord.NameEn,
                    NameHe = productRecord.NameHe,
                    ImageUrl = productRecord.ImageUrl,
                    ImagePath = productRecord.ImagePath,
                });
            }

            categories.Add(category);
        }

        return categories;
    }

    private static List<CategoryRecord> LoadCategoryRecords()
    {
        var assembly = typeof(CatalogDemoData).Assembly;
        using var stream = assembly.GetManifestResourceStream(ResourceName)
            ?? throw new InvalidOperationException($"Embedded resource '{ResourceName}' not found — check the EmbeddedResource item in Catalog.Infrastructure.csproj.");

        return JsonSerializer.Deserialize<List<CategoryRecord>>(stream, JsonOptions)
            ?? throw new InvalidOperationException("catalog-demo-data.json deserialized to null — check the file isn't empty or malformed.");
    }

    private sealed record CategoryRecord(string NameEn, string NameHe, List<ProductRecord> Products);

    private sealed record ProductRecord(string NameEn, string NameHe, string? ImageUrl, string? ImagePath);
}
