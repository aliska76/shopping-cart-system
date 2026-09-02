namespace Catalog.Api.Logging;

/// <summary>
/// Structured logging as its own DI module, wired in from Program.cs with one call —
/// kept separate from the rest of the host setup so the formatting choice lives in a
/// single place. No external framework (Serilog, NLog, ...) added: ASP.NET Core's
/// built-in console formatters already give us both output shapes this project needs.
///
/// Mirrors the exact decision made for server-orders' JsonLogger, so both services
/// behave the same way for the same reason: one-line raw JSON per log entry is the
/// right choice for production (machine-parseable, ships cleanly to log aggregation),
/// but it is genuinely hard to read by eye in a terminal during local development.
/// So: ASPNETCORE_ENVIRONMENT=Production (the default when the variable is unset, e.g.
/// a container run without an explicit override) gets the structured JSON console
/// formatter; anything else (Development — what `dotnet run`/launchSettings.json sets
/// locally — and Staging) gets ASP.NET Core's built-in "simple" console formatter,
/// which prints the same log level/category/message as short, colorized, human-read
/// lines instead of a JSON object per entry. No new configuration to set: the two
/// deploy paths that matter (`dotnet run` locally vs. the Dockerfile/a real host) already
/// select the right one on their own, exactly like NODE_ENV does for server-orders.
/// </summary>
public static class LoggingExtensions
{
    public static ILoggingBuilder AddCatalogLogging(this ILoggingBuilder logging, IHostEnvironment environment)
    {
        logging.ClearProviders();

        if (environment.IsProduction())
        {
            logging.AddJsonConsole(options =>
            {
                options.IncludeScopes = true;
                options.UseUtcTimestamp = true;
                options.TimestampFormat = "yyyy-MM-ddTHH:mm:ss.fffZ";
            });
        }
        else
        {
            logging.AddSimpleConsole(options =>
            {
                options.SingleLine = true;
                options.IncludeScopes = false;
                options.UseUtcTimestamp = true;
                options.TimestampFormat = "HH:mm:ss ";
            });
        }

        return logging;
    }
}
