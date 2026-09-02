using Catalog.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Catalog.Infrastructure.Persistence.Configurations;

public class ProductConfiguration : IEntityTypeConfiguration<Product>
{
    public void Configure(EntityTypeBuilder<Product> builder)
    {
        builder.ToTable("Products");

        builder.HasKey(product => product.Id);

        builder.Property(product => product.NameEn)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(product => product.NameHe)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(product => product.ImageUrl)
            .HasMaxLength(500);

        // Same-origin path into Catalog.Api/wwwroot/images/, served via app.UseStaticFiles() —
        // kept separate from ImageUrl (the original external source link) on purpose, see
        // CatalogDemoData for why both are stored side by side.
        builder.Property(product => product.ImagePath)
            .HasMaxLength(500);
    }
}
