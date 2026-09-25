using FoodiesGoodies.Api.DTOs;
using FoodiesGoodies.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace FoodiesGoodies.Api.Controllers;

[ApiController]
[Route("api/ai")]
public class AiDietController : ControllerBase
{
    private readonly IAiDietService _aiDietService;
    private readonly ILogger<AiDietController> _logger;

    public AiDietController(IAiDietService aiDietService, ILogger<AiDietController> logger)
    {
        _aiDietService = aiDietService;
        _logger = logger;
    }

    /// <summary>
    /// Returns the catalog of supported world culinary cultures and regional dietary traditions.
    /// </summary>
    [HttpGet("cuisines")]
    [ProducesResponseType(typeof(IReadOnlyList<CuisineInfoDto>), StatusCodes.Status200OK)]
    public IActionResult GetSupportedCuisines()
    {
        var list = _aiDietService.GetSupportedCuisines();
        return Ok(list);
    }

    /// <summary>
    /// Generates a personalized daily diet plan powered by Google Gemini AI and authentic cultural anthropology.
    /// </summary>
    [HttpPost("diet-plan")]
    [ProducesResponseType(typeof(AiDietPlanResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GenerateDietPlan([FromBody] AiDietPlanRequest request, CancellationToken cancellationToken)
    {
        if (request == null)
        {
            return BadRequest(ApiResponse.Fail("Diet plan request body is required."));
        }

        if (request.Age < 10 || request.Age > 110)
        {
            return BadRequest(ApiResponse.Fail("Please provide a valid age between 10 and 110 years."));
        }

        if (request.Weight < 20 || request.Weight > 400)
        {
            return BadRequest(ApiResponse.Fail("Please provide a valid weight between 20kg and 400kg."));
        }

        if (request.Height < 60 || request.Height > 260)
        {
            return BadRequest(ApiResponse.Fail("Please provide a valid height between 60cm and 260cm."));
        }

        try
        {
            var plan = await _aiDietService.GenerateDietPlanAsync(request, cancellationToken);
            return Ok(plan);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error generating AI diet plan.");
            return StatusCode(StatusCodes.Status500InternalServerError, ApiResponse.Fail("Unable to generate diet plan. Please try again."));
        }
    }

    /// <summary>
    /// Calculates biometric metrics (BMR, TDEE, Macros, Water) without generating the full meal schedule.
    /// </summary>
    [HttpPost("calculate")]
    [ProducesResponseType(typeof(BiometricsSummaryDto), StatusCodes.Status200OK)]
    public IActionResult CalculateBiometrics([FromBody] AiDietPlanRequest request)
    {
        var bio = _aiDietService.CalculateBiometrics(request);
        return Ok(bio);
    }
}
