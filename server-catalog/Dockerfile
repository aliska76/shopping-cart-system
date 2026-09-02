# Multi-stage build -- the SDK image (~800MB, full compiler toolchain) is only needed to
# restore/publish; the final image ships just the ASP.NET Core runtime (~220MB) plus the
# published output, not the SDK itself.
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Project files copied (and restored) before the rest of the source, so Docker's layer cache
# only re-runs "dotnet restore" -- the slow step, downloading every NuGet package -- when a
# .csproj actually changed, not on every source edit.
COPY Directory.Build.props ./
COPY src/Catalog.Domain/Catalog.Domain.csproj src/Catalog.Domain/
COPY src/Catalog.Application/Catalog.Application.csproj src/Catalog.Application/
COPY src/Catalog.Infrastructure/Catalog.Infrastructure.csproj src/Catalog.Infrastructure/
COPY src/Catalog.DependencyInjection/Catalog.DependencyInjection.csproj src/Catalog.DependencyInjection/
COPY src/Catalog.Api/Catalog.Api.csproj src/Catalog.Api/
RUN dotnet restore src/Catalog.Api/Catalog.Api.csproj

COPY src/ src/
RUN dotnet publish src/Catalog.Api/Catalog.Api.csproj -c Release -o /app --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app
# dotnet publish already copies wwwroot/ (the seeded product images, when
# download-product-images.mjs has been run -- see README) into the output above as part of
# the SDK's normal content-file handling; nothing extra needed here for that.
COPY --from=build /app .

# Schema creation and demo-data seeding happen at startup (CatalogSeeder.SeedAsync, called
# from Program.cs) the same way they do with "dotnet run" locally -- no separate migration
# step in this image. Fine for this project's single-instance local/demo scope; see
# README/architecture.md for why a real multi-instance deployment would sequence migrations
# as their own release step instead.
ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080

ENTRYPOINT ["dotnet", "Catalog.Api.dll"]
