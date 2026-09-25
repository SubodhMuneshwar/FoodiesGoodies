using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace FoodiesGoodies.Api.DTOs.Diet;

public class MealSwapRequest
{
    [Range(1, 7)]
    public int Day { get; set; } = 1;

    [Required]
    public string MealCategory { get; set; } = "Dinner"; // Breakfast, Lunch, Snack, Dinner

    public string CurrentMealName { get; set; } = string.Empty;

    public int TargetCalories { get; set; } = 500;

    public int TargetProteinGrams { get; set; } = 30;

    public int TargetCarbsGrams { get; set; } = 60;

    public int TargetFatGrams { get; set; } = 15;

    public string Country { get; set; } = "India";

    public string Region { get; set; } = "Maharashtra";

    public string Cuisine { get; set; } = "Maharashtrian";

    public string DietPreference { get; set; } = "vegetarian";

    public List<string> Allergies { get; set; } = new();

    public List<string> FoodsToAvoid { get; set; } = new();

    public int MaxCookingTimeMinutes { get; set; } = 30;

    public string Budget { get; set; } = "moderate";
}

public class MealSwapResponse
{
    [JsonPropertyName("success")]
    public bool Success { get; set; } = true;

    [JsonPropertyName("day")]
    public int Day { get; set; }

    [JsonPropertyName("mealCategory")]
    public string MealCategory { get; set; } = string.Empty;

    [JsonPropertyName("swappedMeal")]
    public DietMealDto SwappedMeal { get; set; } = new();

    [JsonPropertyName("message")]
    public string Message { get; set; } = string.Empty;
}
