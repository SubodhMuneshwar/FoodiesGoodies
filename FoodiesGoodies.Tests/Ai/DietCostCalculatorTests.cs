using FoodiesGoodies.Api.DTOs.Diet;
using FoodiesGoodies.Api.Services.Diet;
using Xunit;

namespace FoodiesGoodies.Tests.Ai;

public class DietCostCalculatorTests
{
    [Fact]
    public void CalculateCostEstimate_IndiaModerate_ReturnsINRAndValidCalculations()
    {
        var request = new DietPlanRequest
        {
            Country = "India",
            Region = "Maharashtra",
            Budget = "moderate",
            MealCount = 4,
            DietPreference = "omnivore"
        };

        var cost = DietCostCalculator.CalculateCostEstimate(request);

        Assert.NotNull(cost);
        Assert.Equal("₹", cost.CurrencySymbol);
        Assert.Equal("INR", cost.CurrencyCode);
        Assert.True(cost.DailyCost > 0);
        Assert.Equal(Math.Round(cost.DailyCost * 7, 2), cost.WeeklyCost);
        Assert.Equal(Math.Round(cost.DailyCost * 30, 2), cost.MonthlyCost);
        Assert.Equal(Math.Round(cost.DailyCost * 365, 2), cost.YearlyCost);
        Assert.False(string.IsNullOrWhiteSpace(cost.CostTier));
        Assert.False(string.IsNullOrWhiteSpace(cost.PricingNotes));
        Assert.False(string.IsNullOrWhiteSpace(cost.MoneySavingTip));
    }

    [Theory]
    [InlineData("United States", "$", "USD")]
    [InlineData("United Kingdom", "£", "GBP")]
    [InlineData("Japan", "¥", "JPY")]
    [InlineData("France", "€", "EUR")]
    [InlineData("Canada", "$", "CAD")]
    [InlineData("Australia", "$", "AUD")]
    public void CalculateCostEstimate_VariousCountries_ReturnsExpectedCurrencies(string country, string expectedSymbol, string expectedCode)
    {
        var request = new DietPlanRequest
        {
            Country = country,
            Budget = "moderate",
            MealCount = 4
        };

        var cost = DietCostCalculator.CalculateCostEstimate(request);

        Assert.Equal(expectedSymbol, cost.CurrencySymbol);
        Assert.Equal(expectedCode, cost.CurrencyCode);
        Assert.True(cost.DailyCost > 0);
        Assert.True(cost.WeeklyCost > cost.DailyCost);
        Assert.True(cost.MonthlyCost > cost.WeeklyCost);
        Assert.True(cost.YearlyCost > cost.MonthlyCost);
    }

    [Fact]
    public void CalculateCostEstimate_VegetarianVsKeto_ReflectsRelativeCostDifferences()
    {
        var vegRequest = new DietPlanRequest
        {
            Country = "India",
            Budget = "moderate",
            DietPreference = "vegetarian",
            MealCount = 4
        };

        var ketoRequest = new DietPlanRequest
        {
            Country = "India",
            Budget = "moderate",
            DietPreference = "keto",
            MealCount = 4
        };

        var vegCost = DietCostCalculator.CalculateCostEstimate(vegRequest);
        var ketoCost = DietCostCalculator.CalculateCostEstimate(ketoRequest);

        Assert.True(vegCost.DailyCost < ketoCost.DailyCost);
    }
}
