using FoodiesGoodies.Api.Configuration;
using FoodiesGoodies.Api.DTOs;
using FoodiesGoodies.Api.Services;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Xunit;

namespace FoodiesGoodies.Tests.Ai;

public class AiDietServiceTests
{
    private readonly GeminiDietAgentService _service;

    public AiDietServiceTests()
    {
        var httpClient = new HttpClient();
        var options = Options.Create(new GeminiOptions());
        var inMemoryConfig = new ConfigurationBuilder().Build();
        var logger = NullLogger<GeminiDietAgentService>.Instance;

        _service = new GeminiDietAgentService(httpClient, options, inMemoryConfig, logger);
    }

    [Fact]
    public void GetSupportedCuisines_ReturnsAllGlobalAndIndianCuisines()
    {
        var cuisines = _service.GetSupportedCuisines();
        Assert.NotEmpty(cuisines);
        Assert.Contains(cuisines, c => c.Id == "india-pan");
        Assert.Contains(cuisines, c => c.Id == "india-north");
        Assert.Contains(cuisines, c => c.Id == "india-south");
        Assert.Contains(cuisines, c => c.Id == "india-sattvic");
        Assert.Contains(cuisines, c => c.Id == "mediterranean");
        Assert.Contains(cuisines, c => c.Id == "japan");
    }

    [Fact]
    public void CalculateBiometrics_CalculatesAccurateMifflinStJeorForMale()
    {
        var request = new AiDietPlanRequest
        {
            Age = 25,
            Gender = "male",
            Weight = 70, // 10 * 70 = 700
            Height = 175, // 6.25 * 175 = 1093.75
            ActivityLevel = 1.375,
            Goal = "maintain"
        };
        // Expected BMR: 700 + 1093.75 - (5 * 25) + 5 = 1673.75 -> 1674
        // Expected TDEE: 1673.75 * 1.375 = 2301.4 -> 2301

        var bio = _service.CalculateBiometrics(request);
        Assert.InRange(bio.Bmr, 1670, 1676);
        Assert.InRange(bio.Tdee, 2295, 2305);
        Assert.Equal(bio.Tdee, bio.TargetCalories);
        Assert.True(bio.ProteinGrams > 0);
        Assert.True(bio.CarbsGrams > 0);
        Assert.True(bio.FatGrams > 0);
    }

    [Fact]
    public void CalculateBiometrics_CalculatesFatLossDeficitAndFloor()
    {
        var request = new AiDietPlanRequest
        {
            Age = 30,
            Gender = "female",
            Weight = 60,
            Height = 160,
            ActivityLevel = 1.2,
            Goal = "loss"
        };

        var bio = _service.CalculateBiometrics(request);
        Assert.Equal("Healthy Fat Loss", bio.GoalLabel);
        Assert.True(bio.TargetCalories < bio.Tdee);
        Assert.True(bio.TargetCalories >= 1200);
    }

    [Theory]
    [InlineData("india-north", "Chilla")]
    [InlineData("india-south", "Idli")]
    [InlineData("india-sattvic", "Khichdi")]
    [InlineData("mediterranean", "Shakshuka")]
    [InlineData("japan", "Miso")]
    public async Task GenerateDietPlanAsync_ProvidesAuthenticCuisineDishesInFallback(string cuisineId, string expectedDishKeyword)
    {
        var request = new AiDietPlanRequest
        {
            Age = 28,
            Gender = "male",
            Weight = 75,
            Height = 178,
            ActivityLevel = 1.55,
            Goal = "maintain",
            DietPreference = "vegetarian",
            CuisineRegion = cuisineId,
            MealCount = 4
        };

        var plan = await _service.GenerateDietPlanAsync(request);

        Assert.NotNull(plan);
        Assert.True(plan.Success);
        Assert.NotEmpty(plan.Meals);
        Assert.NotEmpty(plan.GroceryList);
        Assert.False(string.IsNullOrWhiteSpace(plan.CulturalRationale));
        Assert.False(string.IsNullOrWhiteSpace(plan.CulturalDigestiveTip));

        // Ensure authentic dishes match the country cuisine
        bool containsExpected = plan.Meals.Any(m => m.Name.Contains(expectedDishKeyword, StringComparison.OrdinalIgnoreCase) ||
                                                    m.Description.Contains(expectedDishKeyword, StringComparison.OrdinalIgnoreCase));
        Assert.True(containsExpected, $"Expected plan for {cuisineId} to mention {expectedDishKeyword}");
    }
}
