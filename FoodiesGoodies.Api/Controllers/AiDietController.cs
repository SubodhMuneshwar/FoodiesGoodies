using FoodiesGoodies.Api.DTOs;
using FoodiesGoodies.Api.DTOs.Diet;
using FoodiesGoodies.Api.Services.Cuisine;
using FoodiesGoodies.Api.Services.Diet;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace FoodiesGoodies.Api.Controllers;

[ApiController]
[Route("api/ai")]
public class AiDietController : ControllerBase
{
    private readonly IDietPlannerAgent _plannerAgent;
    private readonly INutritionCalculatorService _nutritionCalculator;
    private readonly ICuisineProfileService _cuisineProfileService;
    private readonly ILogger<AiDietController> _logger;

    public AiDietController(
        IDietPlannerAgent plannerAgent,
        INutritionCalculatorService nutritionCalculator,
        ICuisineProfileService cuisineProfileService,
        ILogger<AiDietController> logger)
    {
        _plannerAgent = plannerAgent;
        _nutritionCalculator = nutritionCalculator;
        _cuisineProfileService = cuisineProfileService;
        _logger = logger;
    }

    /// <summary>
    /// Returns the catalog of supported world culinary cultures and regional dietary traditions.
    /// </summary>
    [HttpGet("cuisines")]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<CuisineContextDto>>), StatusCodes.Status200OK)]
    public IActionResult GetSupportedCuisines()
    {
        var list = _cuisineProfileService.GetAllProfiles();
        return Ok(ApiResponse<IReadOnlyList<CuisineContextDto>>.Ok(list));
    }

    /// <summary>
    /// Generates a personalized 7-day diet plan powered by Google Gemini AI and cultural nutritional anthropology.
    /// </summary>
    [HttpPost("diet-plan")]
    [EnableRateLimiting("AiDietRateLimit")]
    [ProducesResponseType(typeof(ApiResponse<DietPlanResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GenerateDietPlan([FromBody] DietPlanRequest request, CancellationToken cancellationToken)
    {
        if (request == null)
        {
            return BadRequest(ApiResponse.Fail("Diet plan request body is required."));
        }

        if (request.Age < 10 || request.Age > 110)
        {
            return BadRequest(ApiResponse.Fail("Please provide a valid age between 10 and 110 years."));
        }

        if (request.WeightKg < 20 || request.WeightKg > 400)
        {
            return BadRequest(ApiResponse.Fail("Please provide a valid weight between 20kg and 400kg."));
        }

        if (request.HeightCm < 60 || request.HeightCm > 260)
        {
            return BadRequest(ApiResponse.Fail("Please provide a valid height between 60cm and 260cm."));
        }

        try
        {
            var plan = await _plannerAgent.GenerateDietPlanAsync(request, cancellationToken);
            return Ok(ApiResponse<DietPlanResponse>.Ok(plan, "Diet plan generated successfully."));
        }
        catch (OperationCanceledException)
        {
            return StatusCode(499, ApiResponse.Fail("Client closed request."));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error in diet plan controller.");
            return StatusCode(StatusCodes.Status500InternalServerError,
                ApiResponse.Fail("An unexpected error occurred while generating your nutrition plan. Please try again."));
        }
    }

    /// <summary>
    /// Regenerates/swaps a single meal without regenerating the entire 7-day schedule.
    /// </summary>
    [HttpPost("diet-plan/swap-meal")]
    [EnableRateLimiting("AiDietRateLimit")]
    [ProducesResponseType(typeof(ApiResponse<MealSwapResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> SwapSingleMeal([FromBody] MealSwapRequest request, CancellationToken cancellationToken)
    {
        if (request == null)
        {
            return BadRequest(ApiResponse.Fail("Meal swap request body is required."));
        }

        if (request.Day < 1 || request.Day > 7)
        {
            return BadRequest(ApiResponse.Fail("Day must be between 1 and 7."));
        }

        try
        {
            var swapResponse = await _plannerAgent.SwapSingleMealAsync(request, cancellationToken);
            return Ok(ApiResponse<MealSwapResponse>.Ok(swapResponse, "Meal swapped successfully."));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error swapping single meal.");
            return StatusCode(StatusCodes.Status500InternalServerError,
                ApiResponse.Fail("Unable to swap meal at this time."));
        }
    }

    /// <summary>
    /// Calculates deterministic biometric targets (BMR, TDEE, Macros, Water) without generating the full meal schedule.
    /// </summary>
    [HttpPost("calculate")]
    [ProducesResponseType(typeof(ApiResponse<NutritionTargetsDto>), StatusCodes.Status200OK)]
    public IActionResult CalculateBiometrics([FromBody] DietPlanRequest request)
    {
        if (request == null)
        {
            return BadRequest(ApiResponse.Fail("Diet plan request body is required."));
        }

        var targets = _nutritionCalculator.CalculateTargets(request);
        return Ok(ApiResponse<NutritionTargetsDto>.Ok(targets));
    }
}
