using Catalog.Api.Dtos;
using Catalog.Api.RateLimiting;
using Catalog.Application.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace Catalog.Api.Controllers;

/// <summary>
/// 429/500 are documented once here at the controller level (applies to every action below)
/// rather than repeated on each -- both are possible on any route in this controller: 429 from
/// either rate limiter (see RateLimitingExtensions), 500 from ExceptionHandlingMiddleware,
/// which wraps every request regardless of which action handled it.
/// </summary>
[ApiController]
[Route("api/v1/[controller]")]
[EnableRateLimiting(RateLimitingExtensions.SlidingWindowPolicy)]
[ProducesResponseType(typeof(ErrorEnvelopeDto), StatusCodes.Status429TooManyRequests)]
[ProducesResponseType(typeof(ErrorEnvelopeDto), StatusCodes.Status500InternalServerError)]
public class CategoriesController : ControllerBase
{
    private const int DefaultPageSize = 20;
    private const int MaxPageSize = 100;

    private readonly ICategoryService _categoryService;

    public CategoriesController(ICategoryService categoryService)
    {
        _categoryService = categoryService;
    }

    /// <summary>
    /// Returns every category together with the products that belong to it.
    /// </summary>
    [HttpGet]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetCategories(CancellationToken cancellationToken)
    {
        var categories = await _categoryService.GetCategoriesAsync(cancellationToken);

        return Ok(categories);
    }

    /// <summary>
    /// Cursor-paginated products within one category, ordered by id. Pass the previous
    /// response's <c>nextCursor</c> back in as <paramref name="cursor"/> to fetch the next
    /// page; omit it for the first page. A null <c>nextCursor</c> in the response means
    /// there are no more pages. <c>meta.total</c> is the category's full product count across
    /// every page, not just this one; <c>meta.limit</c> is the page size actually applied.
    /// No <c>meta.page</c> -- keyset pagination has no offset to report one from (see
    /// ProductsMetaDto).
    /// </summary>
    [HttpGet("{categoryId:int}/products")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetProductsPage(
        int categoryId,
        [FromQuery] int? cursor,
        [FromQuery] int limit,
        CancellationToken cancellationToken)
    {
        var pageSize = limit <= 0 ? DefaultPageSize : Math.Min(limit, MaxPageSize);

        var page = await _categoryService.GetProductsPageAsync(categoryId, cursor, pageSize, cancellationToken);

        return Ok(page);
    }
}
