using System.Text.Json.Serialization;

namespace FoodiesGoodies.Api.DTOs.Diet;

public class NutritionTargetsDto
{
    [JsonPropertyName("bmr")]
    public int Bmr { get; set; }

    [JsonPropertyName("tdee")]
    public int Tdee { get; set; }

    [JsonPropertyName("targetCalories")]
    public int TargetCalories { get; set; }

    [JsonPropertyName("proteinGrams")]
    public int ProteinGrams { get; set; }

    [JsonPropertyName("carbsGrams")]
    public int CarbsGrams { get; set; }

    [JsonPropertyName("fatGrams")]
    public int FatGrams { get; set; }

    [JsonPropertyName("hydrationLiters")]
    public double HydrationLiters { get; set; }

    [JsonPropertyName("hydrationOz")]
    public int HydrationOz { get; set; }

    [JsonPropertyName("goalLabel")]
    public string GoalLabel { get; set; } = string.Empty;

    [JsonPropertyName("bmi")]
    public double Bmi { get; set; }

    [JsonPropertyName("bmiCategory")]
    public string BmiCategory { get; set; } = string.Empty;

    [JsonPropertyName("healthyWeightRangeKg")]
    public string HealthyWeightRangeKg { get; set; } = string.Empty;

    [JsonPropertyName("healthyWeightRangeLbs")]
    public string HealthyWeightRangeLbs { get; set; } = string.Empty;
}
