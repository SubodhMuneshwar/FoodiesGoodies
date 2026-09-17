using FoodiesGoodies.Api.DTOs;
using FoodiesGoodies.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace FoodiesGoodies.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class RecipesController : ControllerBase
{
    private readonly IRecipeService _recipeService;
    private readonly ILogger<RecipesController> _logger;

    public RecipesController(IRecipeService recipeService, ILogger<RecipesController> logger)
    {
        _recipeService = recipeService;
        _logger = logger;
    }

    /// <summary>
    /// Searches culinary recipes using Edamam cloud proxy with an opaque pagination cursor.
    /// </summary>
    /// <param name="q">Recipe search query (e.g., chicken, pasta, salad).</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    [HttpGet]
    [ProducesResponseType(typeof(RecipeSearchResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Search([FromQuery] string? q, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(q))
        {
            return BadRequest(ApiResponse.Fail("A search query parameter 'q' is required."));
        }

        var result = await _recipeService.SearchRecipesAsync(q, cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Fetches the next page of recipes using a securely signed opaque cursor.
    /// </summary>
    /// <param name="cursor">The opaque nextCursor string returned by the initial search.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    [HttpGet("next")]
    [ProducesResponseType(typeof(RecipeSearchResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Next([FromQuery] string? cursor, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(cursor))
        {
            return BadRequest(ApiResponse.Fail("A valid pagination cursor parameter is required."));
        }

        var result = await _recipeService.GetNextPageAsync(cursor, cancellationToken);
        return Ok(result);
    }
}
