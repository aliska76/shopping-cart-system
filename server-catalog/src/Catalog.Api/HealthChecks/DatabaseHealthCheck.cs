using Catalog.Infrastructure.Persistence;
using Microsoft.Extensions.Diagnostics.HealthChecks;

namespace Catalog.Api.HealthChecks;

/// <summary>
/// Hand-written instead of pulling in the
/// Microsoft.Extensions.Diagnostics.HealthChecks.EntityFrameworkCore package —
/// IHealthCheck itself already ships in the ASP.NET Core shared framework Catalog.Api
/// references, so a one-line CanConnectAsync() check needs no new dependency. Only
/// registered when the API is actually backed by SQL Server — see Program.cs, guarded by
/// the same "Catalog:UseInMemoryStore" flag as everything else.
/// </summary>
public class DatabaseHealthCheck : IHealthCheck
{
    private readonly CatalogDbContext _dbContext;

    public DatabaseHealthCheck(CatalogDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<HealthCheckResult> CheckHealthAsync(HealthCheckContext context, CancellationToken cancellationToken = default)
    {
        return await _dbContext.Database.CanConnectAsync(cancellationToken)
            ? HealthCheckResult.Healthy("Database connection succeeded.")
            : HealthCheckResult.Unhealthy("Database connection failed.");
    }
}
