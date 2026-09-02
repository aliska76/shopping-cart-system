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

        // decimal(10,2): exact two-decimal-place money (ILS) -- SQL Server's own type for
        // this, not the binary floating point `double`/`float` would give.
        builder.Property(product => product.UnitPrice)
            .HasColumnType("decimal(10,2)");

        // Stored as the enum member's own name ("Kilogram"/"Piece"/"Liter"), not its
        // underlying int -- readable straight out of a SQL query or the DB browser, at the
        // cost of a couple more bytes per row. ProductUnit has three members today; this
        // column just needs to fit the longest one.
        builder.Property(product => product.Unit)
            .HasConversion<string>()
            .HasMaxLength(20);
    }
}
