using System.Text.Json.Serialization;

namespace FoodiesGoodies.Api.DTOs.Diet;

public class DietMealDto
{
    [JsonPropertyName("mealId")]
    public string MealId { get; set; } = string.Empty;

    [JsonPropertyName("category")]
    public string Category { get; set; } = string.Empty; // Breakfast, Lunch, Snack, Dinner

    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;

    [JsonPropertyName("description")]
    public string Description { get; set; } = string.Empty;

    [JsonPropertyName("ingredients")]
    public List<string> Ingredients { get; set; } = new();

    [JsonPropertyName("calories")]
    public int Calories { get; set; }

    [JsonPropertyName("proteinGrams")]
    public int ProteinGrams { get; set; }

    [JsonPropertyName("carbsGrams")]
    public int CarbsGrams { get; set; }

    [JsonPropertyName("fatGrams")]
    public int FatGrams { get; set; }

    [JsonPropertyName("chefTip")]
    public string ChefTip { get; set; } = string.Empty;

    [JsonPropertyName("recipeUrl")]
    public string? RecipeUrl { get; set; }

    [JsonPropertyName("cookingTimeMinutes")]
    public int CookingTimeMinutes { get; set; } = 25;
}
