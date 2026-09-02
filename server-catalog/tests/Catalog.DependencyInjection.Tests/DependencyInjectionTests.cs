using Catalog.Application.Abstractions;
using Catalog.Application.Services;
using Catalog.DependencyInjection;
using Catalog.Infrastructure.Caching;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace Catalog.DependencyInjection.Tests;

/// <summary>
/// Proves that CompositionRoot — the class Catalog.Api actually calls — really
/// does register both layers and really does resolve the in-memory swap end to
/// end, not just that AddApplicationServices()/AddInfrastructureServices() do
/// so in isolation (already covered by their own layers' test suites).
/// </summary>
public class DependencyInjectionTests
{
    [Fact]
    public void Constructor_NullServices_Throws()
    {
        var configuration = new ConfigurationBuilder().Build();

        Assert.Throws<ArgumentNullException>(() => new CompositionRoot(null!, configuration));
    }

    [Fact]
    public void Constructor_NullConfiguration_Throws()
    {
        var services = new ServiceCollection();

        Assert.Throws<ArgumentNullException>(() => new CompositionRoot(services, null!));
    }

    [Fact]
    public void RegisterCatalogServices_ResolvesBothLayers_ThroughOneEntryPoint()
    {
        var services = new ServiceCollection();
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Catalog:UseInMemoryStore"] = "true"
            })
            .Build();

        new CompositionRoot(services, configuration).RegisterCatalogServices();
        using var provider = services.BuildServiceProvider();

        Assert.IsType<CategoryService>(provider.GetRequiredService<ICategoryService>());
        Assert.IsType<CachingCategoryRepository>(provider.GetRequiredService<ICategoryRepository>());
    }

    [Fact]
    public void RegisterCatalogServices_ReturnsSameServiceCollection_ForFluentChaining()
    {
        var services = new ServiceCollection();
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Catalog:UseInMemoryStore"] = "true"
            })
            .Build();

        var result = new CompositionRoot(services, configuration).RegisterCatalogServices();

        Assert.Same(services, result);
    }
}
