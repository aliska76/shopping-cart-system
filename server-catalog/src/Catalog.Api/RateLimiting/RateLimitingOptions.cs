namespace Catalog.Api.RateLimiting;

/// <summary>
/// Bound from config section "RateLimiting" (env var overrides follow the same
/// Section__Key pattern as Catalog__UseInMemoryStore, e.g. RateLimiting__PermitLimit=200).
/// Every property has a sane default, so a bare clone of the repo — no .env, no
/// appsettings edits — still runs with rate limiting enabled at these defaults. Note: the
/// root .env file is read by docker-compose (for the SQL container) only; the API itself
/// picks up overrides via appsettings.json, environment variables, or dotnet user-secrets.
/// </summary>
public class RateLimitingOptions
{
    /// <summary>Sliding-window policy: requests allowed per client (by IP) per window.</summary>
    public int PermitLimit { get; set; } = 100;

    /// <summary>Sliding-window policy: length of the window, in seconds.</summary>
    public int WindowSeconds { get; set; } = 60;

    /// <summary>Sliding-window policy: how many segments the window is split into.</summary>
    public int SegmentsPerWindow { get; set; } = 4;

    /// <summary>Sliding-window policy: requests allowed to queue once the limit is hit, instead of being rejected immediately.</summary>
    public int QueueLimit { get; set; }

    /// <summary>Global concurrency limiter: requests allowed to be in flight at once, across all clients.</summary>
    public int ConcurrencyPermitLimit { get; set; } = 50;

    /// <summary>Global concurrency limiter: requests allowed to queue once the concurrency limit is hit.</summary>
    public int ConcurrencyQueueLimit { get; set; }
}
