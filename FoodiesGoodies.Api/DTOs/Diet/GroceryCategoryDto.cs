using System.Text.Json.Serialization;

namespace FoodiesGoodies.Api.DTOs.Diet;

public class GroceryCategoryDto
{
    [JsonPropertyName("category")]
    public string Category { get; set; } = string.Empty; // Proteins, Vegetables, Fruits, Grains & Staples, Dairy & Alternatives, Spices & Condiments, Other

    [JsonPropertyName("items")]
    public List<string> Items { get; set; } = new();
}
