using System.Text.Json.Serialization;

namespace FoodiesGoodies.Api.DTOs.Diet;

public class DietDayDto
{
    [JsonPropertyName("day")]
    public int Day { get; set; } = 1;

    [JsonPropertyName("dayName")]
    public string DayName { get; set; } = "Day 1";

    [JsonPropertyName("meals")]
    public List<DietMealDto> Meals { get; set; } = new();

    [JsonPropertyName("totalCalories")]
    public int TotalCalories { get; set; }

    [JsonPropertyName("totalProteinGrams")]
    public int TotalProteinGrams { get; set; }

    [JsonPropertyName("totalCarbsGrams")]
    public int TotalCarbsGrams { get; set; }

    [JsonPropertyName("totalFatGrams")]
    public int TotalFatGrams { get; set; }
}
