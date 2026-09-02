using System.Text.Json;
using System.Threading.RateLimiting;
using Catalog.Api.Dtos;
using Microsoft.AspNetCore.RateLimiting;

namespace Catalog.Api.RateLimiting;

/// <summary>
/// Both limiters below are built into ASP.NET Core (System.Threading.RateLimiting /
/// Microsoft.AspNetCore.RateLimiting, available since .NET 7) — no extra NuGet package.
///
///  - A global <see cref="ConcurrencyLimiter"/>: caps how many requests are being processed
///    at once, across every client. This is the one that actually protects the SQL Server
///    connection pool from being exhausted by a burst of concurrent requests — a per-client
///    sliding window alone would not, since it counts requests per client, not requests
///    in flight.
///  - A per-client (by IP) sliding-window limiter, applied via the "sliding-window" policy:
///    caps how many requests one caller can make per time window, with the window itself
///    split into segments so the limit does not reset in one cliff-edge burst the moment a
///    fixed window rolls over.
/// </summary>
public static class RateLimitingExtensions
{
    public const string SlidingWindowPolicy = "sliding-window";

    public static IServiceCollection AddCatalogRateLimiting(this IServiceCollection services, IConfiguration configuration)
    {
        services.Configure<RateLimitingOptions>(configuration.GetSection("RateLimiting"));
        var options = configuration.GetSection("RateLimiting").Get<RateLimitingOptions>() ?? new RateLimitingOptions();

        services.AddRateLimiter(limiterOptions =>
        {
            limiterOptions.RejectionStatusCode = StatusCodes.Status429TooManyRequests;

            // Without this, a rejected request gets the status code above and an empty body --
            // no way for a caller (or a Swagger reviewer) to tell a rate-limit rejection apart
            // from any other empty 429 without reading the docs elsewhere. Both limiters below
            // (the per-client sliding window and the global concurrency cap) share this one
            // OnRejected handler, so a 429 always carries the same ErrorEnvelopeDto shape as
            // every other error response on this API (see ExceptionHandlingMiddleware) --
            // there's no way for a caller to tell *which* limiter rejected them from the
            // response body, which is fine: both mean the same thing to a client ("retry
            // later"), and neither the sliding window nor the global concurrency limiter
            // distinguishes itself at this layer, unlike server-orders where the throttler
            // (429) and the concurrency middleware (503) are genuinely different status codes.
            limiterOptions.OnRejected = async (context, cancellationToken) =>
            {
                context.HttpContext.Response.ContentType = "application/json";

                var payload = new ErrorEnvelopeDto
                {
                    Status = context.HttpContext.Response.StatusCode,
                    Message = "Too many requests. Please try again later.",
                };

                await context.HttpContext.Response.WriteAsync(JsonSerializer.Serialize(payload), cancellationToken);
            };

            limiterOptions.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(_ =>
                RateLimitPartition.GetConcurrencyLimiter("global-concurrency", _ => new ConcurrencyLimiterOptions
                {
                    PermitLimit = options.ConcurrencyPermitLimit,
                    QueueLimit = options.ConcurrencyQueueLimit,
                    QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                }));

            limiterOptions.AddPolicy(SlidingWindowPolicy, httpContext =>
            {
                var clientKey = httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";

                return RateLimitPartition.GetSlidingWindowLimiter(clientKey, _ => new SlidingWindowRateLimiterOptions
                {
                    PermitLimit = options.PermitLimit,
                    Window = TimeSpan.FromSeconds(options.WindowSeconds),
                    SegmentsPerWindow = options.SegmentsPerWindow,
                    QueueLimit = options.QueueLimit,
                    QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                });
            });
        });

        return services;
    }
}
