using FoodiesGoodies.Api.DTOs.Diet;

namespace FoodiesGoodies.Api.Services.Diet;

public class NutritionCalculatorService : INutritionCalculatorService
{
    public NutritionTargetsDto CalculateTargets(DietPlanRequest request)
    {
        ArgumentNullException.ThrowIfNull(request);

        // 1. Sanitize & clamp boundaries
        double weightKg = Math.Clamp(request.WeightKg, 25.0, 350.0);
        double heightCm = Math.Clamp(request.HeightCm, 80.0, 250.0);
        int age = Math.Clamp(request.Age, 14, 100);

        // 2. Mifflin-St Jeor Basal Metabolic Rate (BMR)
        string gender = (request.Gender ?? "female").Trim().ToLowerInvariant();
        double bmr;
        if (gender == "male")
        {
            bmr = (10 * weightKg) + (6.25 * heightCm) - (5 * age) + 5;
        }
        else if (gender == "female")
        {
            bmr = (10 * weightKg) + (6.25 * heightCm) - (5 * age) - 161;
        }
        else
        {
            bmr = (10 * weightKg) + (6.25 * heightCm) - (5 * age) - 78;
        }

        // 3. Activity Multiplier -> TDEE
        double activityMultiplier = ParseActivityMultiplier(request.ActivityLevel);
        int tdee = (int)Math.Round(bmr * activityMultiplier);

        // 4. Goal Adjustment
        string goal = (request.Goal ?? "maintenance").Trim().ToLowerInvariant();
        int targetCalories = tdee;
        string goalLabel = "Weight Maintenance & Vitality";

        if (goal.Contains("loss") || goal.Contains("fat"))
        {
            targetCalories = Math.Max(1200, tdee - 450);
            goalLabel = "Healthy Fat Loss & Metabolic Health";
        }
        else if (goal.Contains("muscle") || goal.Contains("gain"))
        {
            targetCalories = tdee + 350;
            goalLabel = "Lean Muscle Building & Hypertrophy";
        }
        else if (goal.Contains("energy") || goal.Contains("performance"))
        {
            targetCalories = tdee + 150;
            goalLabel = "High Performance & Sustained Vitality";
        }

        // 5. Macro Distribution
        string diet = (request.DietPreference ?? "omnivore").Trim().ToLowerInvariant();
        double proteinRatio = 0.28;
        double carbRatio = 0.47;
        double fatRatio = 0.25;

        if (diet == "keto")
        {
            proteinRatio = 0.25;
            carbRatio = 0.08;
            fatRatio = 0.67;
        }
        else if (goal.Contains("muscle") || goal.Contains("gain"))
        {
            proteinRatio = 0.32;
            carbRatio = 0.45;
            fatRatio = 0.23;
        }
        else if (diet == "vegan" || diet == "vegetarian")
        {
            proteinRatio = 0.24;
            carbRatio = 0.52;
            fatRatio = 0.24;
        }

        int proteinGrams = (int)Math.Round((targetCalories * proteinRatio) / 4.0);
        int carbGrams = (int)Math.Round((targetCalories * carbRatio) / 4.0);
        int fatGrams = (int)Math.Round((targetCalories * fatRatio) / 9.0);

        // 6. Hydration
        double waterLiters = Math.Round(weightKg * 0.035, 1);
        int waterOz = (int)Math.Round(weightKg * 0.035 * 33.814);

        // 7. BMI & Healthy Weight Range
        double heightM = heightCm / 100.0;
        double bmi = Math.Round(weightKg / (heightM * heightM), 1);
        string bmiCategory = bmi switch
        {
            < 18.5 => "Underweight",
            < 25.0 => "Normal Weight",
            < 30.0 => "Overweight",
            _ => "Obese"
        };

        double minHealthyKg = Math.Round(18.5 * heightM * heightM, 1);
        double maxHealthyKg = Math.Round(24.9 * heightM * heightM, 1);
        string healthyKgStr = $"{minHealthyKg} - {maxHealthyKg} kg";

        double minHealthyLbs = Math.Round(minHealthyKg * 2.20462, 0);
        double maxHealthyLbs = Math.Round(maxHealthyKg * 2.20462, 0);
        string healthyLbsStr = $"{minHealthyLbs} - {maxHealthyLbs} lbs";

        return new NutritionTargetsDto
        {
            Bmr = (int)Math.Round(bmr),
            Tdee = tdee,
            TargetCalories = targetCalories,
            ProteinGrams = proteinGrams,
            CarbsGrams = carbGrams,
            FatGrams = fatGrams,
            HydrationLiters = waterLiters,
            HydrationOz = waterOz,
            GoalLabel = goalLabel,
            Bmi = bmi,
            BmiCategory = bmiCategory,
            HealthyWeightRangeKg = healthyKgStr,
            HealthyWeightRangeLbs = healthyLbsStr
        };
    }

    private static double ParseActivityMultiplier(string? level)
    {
        if (string.IsNullOrWhiteSpace(level)) return 1.375;

        var clean = level.Trim().ToLowerInvariant();
        if (clean.Contains("sedentary") || clean == "1.2") return 1.2;
        if (clean.Contains("light") || clean == "1.375") return 1.375;
        if (clean.Contains("moderate") || clean == "1.55") return 1.55;
        if (clean.Contains("very") || clean == "1.725") return 1.725;
        if (clean.Contains("extra") || clean.Contains("extreme") || clean == "1.9") return 1.9;

        if (double.TryParse(clean, out var val) && val >= 1.0 && val <= 2.5)
        {
            return val;
        }

        return 1.375;
    }
}
