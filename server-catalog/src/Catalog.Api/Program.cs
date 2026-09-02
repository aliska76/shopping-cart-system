using Catalog.Api.HealthChecks;
using Catalog.Api.Logging;
using Catalog.Api.Middleware;
using Catalog.Api.RateLimiting;
using Catalog.DependencyInjection;
using Catalog.Infrastructure.Persistence;
using Catalog.Infrastructure.Persistence.Seed;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.OpenApi;

var builder = WebApplication.CreateBuilder(args);

builder.Logging.AddCatalogLogging(builder.Environment);

var useInMemoryStore = builder.Configuration.GetValue<bool>("Catalog:UseInMemoryStore");

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "Catalog API",
        Version = "v1",
        Description = "Read-only categories/products catalog for the shopping-cart-system take-home assignment."
    });
});

builder.Services.AddCors(options =>
{
    options.AddPolicy("Client", policy =>
    {
        var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? Array.Empty<string>();

        policy
            .WithOrigins(allowedOrigins)
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

builder.Services.AddCatalogRateLimiting(builder.Configuration);

var healthChecksBuilder = builder.Services.AddHealthChecks();
if (!useInMemoryStore)
{
    healthChecksBuilder.AddCheck<DatabaseHealthCheck>("database");
}

new CompositionRoot(builder.Services, builder.Configuration).RegisterCatalogServices();

var app = builder.Build();

app.UseMiddleware<RequestLoggingMiddleware>();
app.UseMiddleware<ExceptionHandlingMiddleware>();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseStaticFiles(new StaticFileOptions
{
    // ETag/Last-Modified/Content-Type are already set by the static file middleware itself --
    // Cache-Control is the one header it does *not* set by default, so a client (or a CDN
    // in front of this API later) has no explicit signal it's safe to skip re-fetching an
    // image it already has. Seeded product images are effectively immutable -- nothing in
    // this app ever rewrites an existing file -- so a long, public, immutable Cache-Control
    // is correct here with no staleness risk. (ASP.NET Core overrides this with no-cache
    // headers while running in Development specifically so a locally-edited file is never
    // served stale from cache; production gets the header below as configured.)
    OnPrepareResponse = context =>
    {
        context.Context.Response.Headers.CacheControl = "public, max-age=31536000, immutable";
    },
}); // serves wwwroot/images/*.jpg — see CatalogSeeder ImageUrl values
app.UseCors("Client");
app.UseRateLimiter();

app.MapControllers();

// Not app.MapHealthChecks(...) -- see HealthCheckResponseDto's own doc comment for why: that
// extension's return type doesn't support .Produces<T>(), so it can't be documented in
// Swagger without either a third-party package or manually constructed metadata objects.
// Calling HealthCheckService.CheckHealthAsync() directly (the same call MapHealthChecks makes
// internally) from a plain MapGet keeps this dependency-free and gives real Swagger docs.
app.MapGet("/health", async (HealthCheckService healthCheckService) =>
{
    var report = await healthCheckService.CheckHealthAsync();
    var response = HealthCheckResponseDto.FromReport(report);

    // Matches MapHealthChecks' own default HealthCheckOptions.ResultStatusCodes mapping:
    // Healthy and Degraded both report 200 (a degraded-but-still-serving instance shouldn't
    // be pulled out of rotation the same way a fully unhealthy one should), only Unhealthy
    // is 503.
    var statusCode = report.Status == HealthStatus.Unhealthy
        ? StatusCodes.Status503ServiceUnavailable
        : StatusCodes.Status200OK;

    return Results.Json(response, statusCode: statusCode);
})
    .WithTags("Health")
    .WithSummary("Liveness/readiness check.")
    .WithDescription("Reports each registered check by name (just \"database\", when Catalog:UseInMemoryStore is off) alongside an overall status.")
    .Produces<HealthCheckResponseDto>(StatusCodes.Status200OK)
    .Produces<HealthCheckResponseDto>(StatusCodes.Status503ServiceUnavailable)
    .DisableRateLimiting();

if (!useInMemoryStore)
{
    using var scope = app.Services.CreateScope();
    var dbContext = scope.ServiceProvider.GetRequiredService<CatalogDbContext>();
    await CatalogSeeder.SeedAsync(dbContext);
}

app.Run();
