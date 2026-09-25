using FoodiesGoodies.Api.Configuration;
using FoodiesGoodies.Api.DTOs.Diet;
using FoodiesGoodies.Api.Services;
using FoodiesGoodies.Api.Services.Cuisine;
using FoodiesGoodies.Api.Services.Diet;
using FoodiesGoodies.Api.Services.Gemini;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Moq;
using Xunit;

namespace FoodiesGoodies.Tests.Ai;

public class DietPlannerAgentTests
{
    private readonly Mock<IGeminiClient> _mockGeminiClient = new();
    private readonly NutritionCalculatorService _nutritionCalculator = new();
    private readonly CuisineProfileService _cuisineProfileService = new();
    private readonly DietPlanValidator _validator = new();
    private readonly FallbackDietPlanner _fallbackPlanner = new();
    private readonly Mock<IRecipeService> _mockRecipeService = new();
    private readonly IOptions<GeminiOptions> _options = Options.Create(new GeminiOptions { MaxAgentIterations = 3 });

    private GeminiDietPlannerAgent CreateAgent()
    {
        return new GeminiDietPlannerAgent(
            _mockGeminiClient.Object,
            _nutritionCalculator,
            _cuisineProfileService,
            _validator,
            _fallbackPlanner,
            _mockRecipeService.Object,
            _options,
            NullLogger<GeminiDietPlannerAgent>.Instance);
    }

    [Fact]
    public async Task GenerateDietPlanAsync_MinorAggressiveWeightLoss_ReturnsClinicalReferral()
    {
        var agent = CreateAgent();
        var request = new DietPlanRequest
        {
            Age = 15, // Minor
            Gender = "female",
            WeightKg = 45,
            HeightCm = 155,
            Goal = "fat_loss" // Aggressive weight loss
        };

        var response = await agent.GenerateDietPlanAsync(request);

        Assert.NotNull(response);
        Assert.Contains("Clinical Care Referral", response.PlanTitle);
        Assert.Equal("FoodiesGoodies Safety Engine", response.PlanSource);
        Assert.NotEmpty(response.Recommendations);
    }

    [Fact]
    public async Task GenerateDietPlanAsync_EatingDisorderKeyword_ReturnsSafetyReferral()
    {
        var agent = CreateAgent();
        var request = new DietPlanRequest
        {
            Age = 24,
            Gender = "female",
            WeightKg = 50,
            HeightCm = 165,
            Goal = "recovering from anorexia",
            FoodsToAvoid = new List<string> { "eating disorder triggers" }
        };

        var response = await agent.GenerateDietPlanAsync(request);

        Assert.NotNull(response);
        Assert.Contains("Clinical Care Referral", response.PlanTitle);
    }

    [Fact]
    public async Task GenerateDietPlanAsync_WhenGeminiUnconfigured_UsesFallbackGenerating7Days()
    {
        _mockGeminiClient.Setup(c => c.IsConfigured).Returns(false);

        var agent = CreateAgent();
        var request = new DietPlanRequest
        {
            Age = 24,
            Gender = "male",
            HeightCm = 175,
            WeightKg = 75,
            ActivityLevel = "moderate",
            Goal = "muscle_gain",
            Country = "India",
            Region = "Maharashtra",
            Cuisine = "Maharashtrian",
            DietPreference = "vegetarian",
            MealCount = 4
        };

        var response = await agent.GenerateDietPlanAsync(request);

        Assert.NotNull(response);
        Assert.Equal("FoodiesGoodies Planning Engine", response.PlanSource);
        Assert.Equal(7, response.Days.Count); // Exactly 7 days
        Assert.All(response.Days, day => Assert.Equal(4, day.Meals.Count)); // 4 meals each
        Assert.NotEmpty(response.GroceryList);
        Assert.Contains("Maharashtrian", response.PlanTitle);
    }

    [Fact]
    public async Task SwapSingleMealAsync_ReturnsValidSwappedMeal()
    {
        _mockGeminiClient.Setup(c => c.IsConfigured).Returns(false);

        var agent = CreateAgent();
        var swapReq = new MealSwapRequest
        {
            Day = 2,
            MealCategory = "Dinner",
            CurrentMealName = "Palak Paneer",
            TargetCalories = 500,
            Cuisine = "Maharashtrian",
            DietPreference = "vegetarian"
        };

        var response = await agent.SwapSingleMealAsync(swapReq);

        Assert.NotNull(response);
        Assert.True(response.Success);
        Assert.Equal(2, response.Day);
        Assert.Equal("Dinner", response.MealCategory);
        Assert.NotNull(response.SwappedMeal);
        Assert.NotEqual("Palak Paneer", response.SwappedMeal.Name);
    }
}
