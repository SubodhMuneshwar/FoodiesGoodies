using FoodiesGoodies.Api.DTOs.Diet;
using FoodiesGoodies.Api.Services.Diet;
using Xunit;

namespace FoodiesGoodies.Tests.Ai;

public class DietPlanValidatorTests
{
    private readonly DietPlanValidator _validator = new();

    private static DietPlanRequest CreateSampleRequest() => new()
    {
        Age = 25,
        Gender = "female",
        HeightCm = 165,
        WeightKg = 60,
        Goal = "maintenance",
        DietPreference = "vegetarian",
        Allergies = new List<string> { "peanuts" }
    };

    private static NutritionTargetsDto CreateSampleTargets() => new()
    {
        TargetCalories = 2000,
        ProteinGrams = 140,
        CarbsGrams = 235,
        FatGrams = 55
    };

    [Fact]
    public void ValidatePlan_ValidPlan_ReturnsIsValidTrue()
    {
        var request = CreateSampleRequest();
        var targets = CreateSampleTargets();

        var plan = new DietPlanResponse
        {
            PlanTitle = "Sample Plan",
            Days = new List<DietDayDto>
            {
                new DietDayDto
                {
                    Day = 1,
                    Meals = new List<DietMealDto>
                    {
                        new DietMealDto { Name = "Moong Dal Chilla", Description = "Savory lentil crepes", Ingredients = new List<string> { "Moong Dal", "Ginger" }, Calories = 500 },
                        new DietMealDto { Name = "Dal Tadka with Phulka", Description = "Lentils and flatbread", Ingredients = new List<string> { "Toor Dal", "Atta" }, Calories = 700 },
                        new DietMealDto { Name = "Roasted Makhana", Description = "Fox nuts", Ingredients = new List<string> { "Fox Nuts" }, Calories = 300 },
                        new DietMealDto { Name = "Palak Paneer", Description = "Spinach and paneer", Ingredients = new List<string> { "Spinach", "Paneer" }, Calories = 500 }
                    }
                }
            },
            GroceryList = new List<GroceryCategoryDto>
            {
                new GroceryCategoryDto { Category = "Produce", Items = new List<string> { "Spinach" } }
            }
        };

        var result = _validator.ValidatePlan(plan, request, targets);

        Assert.True(result.IsValid);
        Assert.Empty(result.Errors);
    }

    [Fact]
    public void ValidatePlan_AllergyViolation_FailsValidation()
    {
        var request = CreateSampleRequest(); // Has allergy "peanuts"
        var targets = CreateSampleTargets();

        var plan = new DietPlanResponse
        {
            PlanTitle = "Sample Plan",
            Days = new List<DietDayDto>
            {
                new DietDayDto
                {
                    Day = 1,
                    Meals = new List<DietMealDto>
                    {
                        new DietMealDto
                        {
                            Name = "Kande Pohe with Crunchy Roasted Peanuts",
                            Description = "Flattened rice with peanuts",
                            Ingredients = new List<string> { "Poha", "Peanuts" }, // ALLERGEN!
                            Calories = 500
                        }
                    }
                }
            },
            GroceryList = new List<GroceryCategoryDto>()
        };

        var result = _validator.ValidatePlan(plan, request, targets);

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.Contains("Allergy violation") && e.Contains("peanuts"));
    }

    [Fact]
    public void ValidatePlan_VegetarianViolation_DetectsNonVegItem()
    {
        var request = CreateSampleRequest();
        request.DietPreference = "vegetarian";
        var targets = CreateSampleTargets();

        var plan = new DietPlanResponse
        {
            PlanTitle = "Sample Plan",
            Days = new List<DietDayDto>
            {
                new DietDayDto
                {
                    Day = 1,
                    Meals = new List<DietMealDto>
                    {
                        new DietMealDto
                        {
                            Name = "Grilled Chicken Breast with Rice",
                            Description = "Chicken breast",
                            Ingredients = new List<string> { "Chicken", "Rice" },
                            Calories = 600
                        }
                    }
                }
            }
        };

        var result = _validator.ValidatePlan(plan, request, targets);

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.Contains("non-vegetarian"));
    }

    [Fact]
    public void ValidatePlan_EmptyDays_FailsValidation()
    {
        var request = CreateSampleRequest();
        var targets = CreateSampleTargets();

        var plan = new DietPlanResponse
        {
            PlanTitle = "Empty Plan",
            Days = new List<DietDayDto>()
        };

        var result = _validator.ValidatePlan(plan, request, targets);

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.Contains("at least 1 day"));
    }
}
