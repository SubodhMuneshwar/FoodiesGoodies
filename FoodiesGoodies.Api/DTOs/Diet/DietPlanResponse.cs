using System.Text.Json.Serialization;

namespace FoodiesGoodies.Api.DTOs.Diet;

public class DietPlanResponse
{
    [JsonPropertyName("planTitle")]
    public string PlanTitle { get; set; } = string.Empty;

    [JsonPropertyName("planSource")]
    public string PlanSource { get; set; } = "Gemini AI"; // "Gemini AI" or "FoodiesGoodies Planning Engine"

    [JsonPropertyName("cuisine")]
    public CuisineContextDto Cuisine { get; set; } = new();

    [JsonPropertyName("nutrition")]
    public NutritionTargetsDto Nutrition { get; set; } = new();

    [JsonPropertyName("days")]
    public List<DietDayDto> Days { get; set; } = new();

    [JsonPropertyName("groceryList")]
    public List<GroceryCategoryDto> GroceryList { get; set; } = new();

    [JsonPropertyName("recommendations")]
    public List<string> Recommendations { get; set; } = new();

    [JsonPropertyName("digestiveTip")]
    public string DigestiveTip { get; set; } = string.Empty;

    [JsonPropertyName("disclaimer")]
    public string Disclaimer { get; set; } = "This plan provides general lifestyle and nutritional guidance based on estimated metabolic equations and culinary traditions. It is not medical advice, diagnosis, or clinical treatment.";

    [JsonPropertyName("generatedAtUtc")]
    public DateTime GeneratedAtUtc { get; set; } = DateTime.UtcNow;
}
