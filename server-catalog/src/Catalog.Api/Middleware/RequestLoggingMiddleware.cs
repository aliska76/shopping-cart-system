using System.Diagnostics;

namespace Catalog.Api.Middleware;

/// <summary>
/// Outermost middleware — runs before everything else, including
/// <see cref="ExceptionHandlingMiddleware"/>, so every request gets exactly one structured
/// log line no matter how it ends. Generates a correlation id when the caller does not send
/// one, and echoes it back in the response header so a caller (or someone reading logs
/// later) can tie a client-side report to the exact server-side log line.
/// </summary>
public class RequestLoggingMiddleware
{
    private const string CorrelationIdHeader = "X-Correlation-Id";

    private readonly RequestDelegate _next;
    private readonly ILogger<RequestLoggingMiddleware> _logger;

    public RequestLoggingMiddleware(RequestDelegate next, ILogger<RequestLoggingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var correlationId = context.Request.Headers.TryGetValue(CorrelationIdHeader, out var existing) && !string.IsNullOrWhiteSpace(existing)
            ? existing.ToString()
            : Guid.NewGuid().ToString("n");

        context.Response.Headers[CorrelationIdHeader] = correlationId;

        var stopwatch = Stopwatch.StartNew();

        using (_logger.BeginScope(new Dictionary<string, object> { ["CorrelationId"] = correlationId }))
        {
            try
            {
                await _next(context);
            }
            finally
            {
                stopwatch.Stop();

                _logger.LogInformation(
                    "{Method} {Path} responded {StatusCode} in {ElapsedMs}ms",
                    context.Request.Method,
                    context.Request.Path,
                    context.Response.StatusCode,
                    stopwatch.ElapsedMilliseconds);
            }
        }
    }
}
