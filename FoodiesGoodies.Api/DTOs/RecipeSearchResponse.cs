using System.Text.Json.Serialization;

namespace FoodiesGoodies.Api.DTOs;

public class RecipeSearchResponse
{
    [JsonPropertyName("from")]
    public int From { get; set; }

    [JsonPropertyName("to")]
    public int To { get; set; }

    [JsonPropertyName("count")]
    public int Count { get; set; }

    [JsonPropertyName("nextCursor")]
    public string? NextCursor { get; set; }

    [JsonPropertyName("hits")]
    public List<RecipeHitDto> Hits { get; set; } = new();
}

public class RecipeHitDto
{
    [JsonPropertyName("recipe")]
    public RecipeDto Recipe { get; set; } = new();
}

public class RecipeDto
{
    [JsonPropertyName("label")]
    public string Label { get; set; } = string.Empty;

    [JsonPropertyName("image")]
    public string Image { get; set; } = string.Empty;

    [JsonPropertyName("url")]
    public string Url { get; set; } = string.Empty;

    [JsonPropertyName("source")]
    public string Source { get; set; } = string.Empty;

    [JsonPropertyName("calories")]
    public double Calories { get; set; }

    [JsonPropertyName("yield")]
    public double Yield { get; set; } = 1;

    [JsonPropertyName("totalTime")]
    public double TotalTime { get; set; }

    [JsonPropertyName("cuisineType")]
    public List<string> CuisineType { get; set; } = new();

    [JsonPropertyName("mealType")]
    public List<string> MealType { get; set; } = new();

    [JsonPropertyName("dietLabels")]
    public List<string> DietLabels { get; set; } = new();

    [JsonPropertyName("healthLabels")]
    public List<string> HealthLabels { get; set; } = new();

    [JsonPropertyName("ingredientLines")]
    public List<string> IngredientLines { get; set; } = new();
}
