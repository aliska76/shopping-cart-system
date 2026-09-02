using Catalog.Application.Abstractions;
using Catalog.Infrastructure.Caching;
using Catalog.Infrastructure.Persistence;
using Catalog.Infrastructure.Repositories;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;

namespace Catalog.Infrastructure;

public static class DependencyInjection
{
    /// <summary>
    /// Registers the persistence layer behind <see cref="ICategoryRepository"/>.
    /// Catalog.Application and Catalog.Api never see this class directly — they
    /// depend only on the interface, so this method is the single place that
    /// decides which concrete implementation actually backs it. Set
    /// "Catalog:UseInMemoryStore" to true (env var: Catalog__UseInMemoryStore=true)
    /// to swap SQL Server for a zero-dependency in-memory implementation with no
    /// code changes anywhere else. Both paths are exercised in
    /// Catalog.Infrastructure.Tests/DependencyInjectionTests.
    ///
    /// Either way, ICategoryRepository resolves to a <see cref="CachingCategoryRepository"/>
    /// wrapping the real implementation chosen above — see that class for what is cached
    /// and why.
    /// </summary>
    public static IServiceCollection AddInfrastructureServices(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddMemoryCache();
        services.Configure<CachingOptions>(configuration.GetSection("Caching"));

        var useInMemoryStore = configuration.GetValue<bool>("Catalog:UseInMemoryStore");

        if (useInMemoryStore)
        {
            services.AddSingleton<InMemoryCategoryRepository>();
            services.AddSingleton<ICategoryRepository>(sp => new CachingCategoryRepository(
                sp.GetRequiredService<InMemoryCategoryRepository>(),
                sp.GetRequiredService<IMemoryCache>(),
                sp.GetRequiredService<IOptions<CachingOptions>>()));

            return services;
        }

        var connectionString = configuration.GetConnectionString("CatalogDb")
            ?? throw new InvalidOperationException("Connection string 'CatalogDb' was not found.");

        services.AddDbContext<CatalogDbContext>(options =>
            options.UseSqlServer(connectionString, sql =>
                sql.MigrationsAssembly(typeof(CatalogDbContext).Assembly.FullName)));

        services.AddScoped<CategoryRepository>();
        services.AddScoped<ICategoryRepository>(sp => new CachingCategoryRepository(
            sp.GetRequiredService<CategoryRepository>(),
            sp.GetRequiredService<IMemoryCache>(),
            sp.GetRequiredService<IOptions<CachingOptions>>()));

        return services;
    }
}
