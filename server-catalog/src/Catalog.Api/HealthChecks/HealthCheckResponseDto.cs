using System.Text.Json.Serialization;
using Microsoft.Extensions.Diagnostics.HealthChecks;

namespace Catalog.Api.HealthChecks;

/// <summary>
/// app.MapHealthChecks(...) alone writes a bare "Healthy"/"Unhealthy" text body by default --
/// fine for a container orchestrator's liveness probe, not informative for a human or worth
/// documenting in Swagger. Program.cs maps GET /health as a plain minimal-API handler instead
/// (calling HealthCheckService.CheckHealthAsync() itself, the same thing MapHealthChecks does
/// internally) specifically so it returns this typed DTO and .Produces&lt;T&gt;() can document
/// it -- MapHealthChecks() returns IEndpointConventionBuilder, which .Produces&lt;T&gt;()
/// doesn't support (github.com/dotnet/aspnetcore#43985, still open); a plain MapGet() returns
/// RouteHandlerBuilder, which does.
/// </summary>
public sealed class HealthCheckResponseDto
{
    /// <summary>"Healthy", "Degraded", or "Unhealthy" -- HealthStatus's own name, as a string.</summary>
    [JsonPropertyName("status")]
    public string Status { get; set; } = string.Empty;

    [JsonPropertyName("totalDurationMs")]
    public double TotalDurationMs { get; set; }

    /// <summary>Every registered check by name -- just "database", and only when Catalog:UseInMemoryStore is off (see Program.cs).</summary>
    [JsonPropertyName("checks")]
    public IReadOnlyDictionary<string, HealthCheckEntryDto> Checks { get; set; } = new Dictionary<string, HealthCheckEntryDto>();

    public static HealthCheckResponseDto FromReport(HealthReport report) => new()
    {
        Status = report.Status.ToString(),
        TotalDurationMs = report.TotalDuration.TotalMilliseconds,
        Checks = report.Entries.ToDictionary(
            entry => entry.Key,
            entry => new HealthCheckEntryDto
            {
                Status = entry.Value.Status.ToString(),
                Description = entry.Value.Description,
                DurationMs = entry.Value.Duration.TotalMilliseconds,
            }),
    };
}

public sealed class HealthCheckEntryDto
{
    [JsonPropertyName("status")]
    public string Status { get; set; } = string.Empty;

    [JsonPropertyName("description")]
    public string? Description { get; set; }

    [JsonPropertyName("durationMs")]
    public double DurationMs { get; set; }
}
