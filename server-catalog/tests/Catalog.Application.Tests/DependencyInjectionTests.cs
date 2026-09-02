using Catalog.Application.Services;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace Catalog.Application.Tests;

public class DependencyInjectionTests
{
    [Fact]
    public void AddApplicationServices_Registers_ICategoryService_As_CategoryService()
    {
        var services = new ServiceCollection();

        services.AddApplicationServices();

        var descriptor = Assert.Single(services, d => d.ServiceType == typeof(ICategoryService));

        Assert.Equal(typeof(CategoryService), descriptor.ImplementationType);
        Assert.Equal(ServiceLifetime.Scoped, descriptor.Lifetime);
    }
}
