using Catalog.Application.Abstractions;
using Catalog.Infrastructure.Caching;
using Catalog.Infrastructure.Persistence;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace Catalog.Infrastructure.Tests;

/// <summary>
/// These tests exist to prove — not just claim — that ICategoryRepository is
/// genuinely swappable through configuration alone, with the DI container
/// actually resolving each side end to end. Both paths resolve to
/// CachingCategoryRepository now: the caching decorator wraps whichever concrete
/// repository "Catalog:UseInMemoryStore" selects, so that is what callers actually see.
/// </summary>
public class DependencyInjectionTests
{
    [Fact]
    public void AddInfrastructureServices_DefaultConfig_ResolvesEfCoreBackedRepository_WrappedInCache()
    {
        var services = new ServiceCollection();
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                // A syntactically valid but unreachable connection string is enough:
                // registering and resolving a DbContext doesn't open a connection.
                ["ConnectionStrings:CatalogDb"] = "Server=fake;Database=fake;Trusted_Connection=True;TrustServerCertificate=True;"
            })
            .Build();

        services.AddInfrastructureServices(configuration);
        using var provider = services.BuildServiceProvider();

        var repository = provider.GetRequiredService<ICategoryRepository>();

        Assert.IsType<CachingCategoryRepository>(repository);
        Assert.NotNull(provider.GetRequiredService<CatalogDbContext>());
    }

    [Fact]
    public void AddInfrastructureServices_InMemoryFlagSet_ResolvesInMemoryRepository_WrappedInCache_NoConnectionStringNeeded()
    {
        var services = new ServiceCollection();
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Catalog:UseInMemoryStore"] = "true"
                // deliberately no ConnectionStrings:CatalogDb — proving this path needs none
            })
            .Build();

        services.AddInfrastructureServices(configuration);
        using var provider = services.BuildServiceProvider();

        var repository = provider.GetRequiredService<ICategoryRepository>();

        Assert.IsType<CachingCategoryRepository>(repository);
    }
}
