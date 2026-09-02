namespace Catalog.Infrastructure.Caching;

/// <summary>
/// Bound from config section "Caching" (env var override: Caching__CategoriesTtlSeconds,
/// same pattern as Catalog__UseInMemoryStore). The default applies whenever the section —
/// or this one key — is absent, so a bare clone of the repo caches with no config changes.
/// </summary>
public class CachingOptions
{
    public int CategoriesTtlSeconds { get; set; } = 60;
}
