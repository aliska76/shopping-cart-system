using Catalog.Application;
using Catalog.Infrastructure;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Catalog.DependencyInjection;

/// <summary>
/// Composition Root for the whole Catalog service (Mark Seemann, "Dependency
/// Injection Principles, Practices, and Patterns"): the one place in the
/// solution allowed to know about every layer's DI extension method and wire
/// them together. It lives in its own project — a sibling of Catalog.Api,
/// Catalog.Application, Catalog.Domain and Catalog.Infrastructure directly
/// under src/ — precisely so it is impossible to miss when browsing the
/// repository. Catalog.Api references this project and calls it; it does not
/// know, or need to know, how many layers exist behind it or in what order
/// they must be wired.
///
/// This is a deliberate exception to YAGNI: a two-call wrapper does not
/// strictly need its own assembly to run. It earns the extra project here
/// because the explicit goal is demonstrability — making "dependencies are
/// composed in exactly one place, and that place is obvious" a fact about the
/// file tree, not just a claim in a README.
///
/// The constructor takes exactly what composition needs — the service
/// collection to populate and the configuration to read feature flags and
/// connection strings from — so CompositionRoot is itself built from injected
/// dependencies, the same discipline it enforces on everything it registers.
/// </summary>
public sealed class CompositionRoot
{
    private readonly IServiceCollection _services;
    private readonly IConfiguration _configuration;

    public CompositionRoot(IServiceCollection services, IConfiguration configuration)
    {
        _services = services ?? throw new ArgumentNullException(nameof(services));
        _configuration = configuration ?? throw new ArgumentNullException(nameof(configuration));
    }

    /// <summary>
    /// Wraps every layer's own registration call behind one method. Callers
    /// only need to know "the catalog's services get registered here" — not
    /// which layers exist, which extension methods they expose, or what order
    /// they need to run in. Add a new layer (e.g. Catalog.Caching) and this is
    /// the only place that changes.
    /// </summary>
    public IServiceCollection RegisterCatalogServices()
    {
        _services.AddApplicationServices();
        _services.AddInfrastructureServices(_configuration);

        return _services;
    }
}
