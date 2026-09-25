using FoodiesGoodies.Api.DTOs.Diet;
using FoodiesGoodies.Api.Services.Diet;
using Xunit;

namespace FoodiesGoodies.Tests.Ai;

public class NutritionCalculatorServiceTests
{
    private readonly NutritionCalculatorService _calculator = new();

    [Fact]
    public void CalculateTargets_CalculatesAccurateMifflinStJeorForMale()
    {
        // Arrange: 25yo male, 70kg, 175cm, lightly active
        // Expected BMR = (10 * 70) + (6.25 * 175) - (5 * 25) + 5 = 700 + 1093.75 - 125 + 5 = 1673.75 -> 1674
        // Expected TDEE = 1673.75 * 1.375 = 2301.4 -> 2301
        var request = new DietPlanRequest
        {
            Age = 25,
            Gender = "male",
            WeightKg = 70,
            HeightCm = 175,
            ActivityLevel = "light",
            Goal = "maintenance"
        };

        var targets = _calculator.CalculateTargets(request);

        Assert.InRange(targets.Bmr, 1670, 1676);
        Assert.InRange(targets.Tdee, 2295, 2305);
        Assert.Equal(targets.Tdee, targets.TargetCalories);
        Assert.True(targets.ProteinGrams > 0);
        Assert.True(targets.CarbsGrams > 0);
        Assert.True(targets.FatGrams > 0);
        Assert.True(targets.HydrationLiters > 0);
    }

    [Fact]
    public void CalculateTargets_CalculatesAccurateMifflinStJeorForFemale()
    {
        // Arrange: 30yo female, 60kg, 165cm, moderate activity
        // Expected BMR = (10 * 60) + (6.25 * 165) - (5 * 30) - 161 = 600 + 1031.25 - 150 - 161 = 1320.25 -> 1320
        var request = new DietPlanRequest
        {
            Age = 30,
            Gender = "female",
            WeightKg = 60,
            HeightCm = 165,
            ActivityLevel = "moderate",
            Goal = "maintenance"
        };

        var targets = _calculator.CalculateTargets(request);

        Assert.InRange(targets.Bmr, 1318, 1323);
        Assert.Equal(targets.Tdee, targets.TargetCalories);
    }

    [Fact]
    public void CalculateTargets_FatLoss_CreatesSafeDeficitNotBelow1200()
    {
        var request = new DietPlanRequest
        {
            Age = 40,
            Gender = "female",
            WeightKg = 50,
            HeightCm = 150,
            ActivityLevel = "sedentary",
            Goal = "fat_loss"
        };

        var targets = _calculator.CalculateTargets(request);

        Assert.True(targets.TargetCalories >= 1200);
        Assert.True(targets.TargetCalories <= targets.Tdee);
        Assert.Contains("Fat Loss", targets.GoalLabel);
    }

    [Fact]
    public void CalculateTargets_MuscleGain_AddsCaloricSurplus()
    {
        var request = new DietPlanRequest
        {
            Age = 22,
            Gender = "male",
            WeightKg = 75,
            HeightCm = 180,
            ActivityLevel = "moderate",
            Goal = "muscle_gain"
        };

        var targets = _calculator.CalculateTargets(request);

        Assert.Equal(targets.Tdee + 350, targets.TargetCalories);
        Assert.Contains("Muscle", targets.GoalLabel);
    }

    [Fact]
    public void CalculateTargets_KetoDiet_ShiftsMacrosToHighFatLowCarb()
    {
        var request = new DietPlanRequest
        {
            Age = 28,
            Gender = "male",
            WeightKg = 80,
            HeightCm = 178,
            ActivityLevel = "moderate",
            Goal = "maintenance",
            DietPreference = "keto"
        };

        var targets = _calculator.CalculateTargets(request);

        // In keto: carbs are ~8% of calories, fat ~67% of calories
        double carbCals = targets.CarbsGrams * 4.0;
        double fatCals = targets.FatGrams * 9.0;
        double total = targets.TargetCalories;

        Assert.True(carbCals / total < 0.15, "Keto carbs should be under 15% of daily calories");
        Assert.True(fatCals / total > 0.55, "Keto fats should be over 55% of daily calories");
    }

    [Fact]
    public void CalculateTargets_ClampsExtremeInputsSafely()
    {
        var request = new DietPlanRequest
        {
            Age = 200, // should clamp to 100
            WeightKg = 10, // should clamp to 25
            HeightCm = 300 // should clamp to 250
        };

        var targets = _calculator.CalculateTargets(request);

        Assert.True(targets.Bmr > 0);
        Assert.True(targets.TargetCalories >= 1200);
    }
}
