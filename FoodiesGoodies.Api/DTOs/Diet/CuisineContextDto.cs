using System.Text.Json.Serialization;

namespace FoodiesGoodies.Api.DTOs.Diet;

public class CuisineContextDto
{
    [JsonPropertyName("country")]
    public string Country { get; set; } = string.Empty;

    [JsonPropertyName("region")]
    public string Region { get; set; } = string.Empty;

    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;

    [JsonPropertyName("flag")]
    public string Flag { get; set; } = "🍽️";

    [JsonPropertyName("description")]
    public string Description { get; set; } = string.Empty;

    [JsonPropertyName("stapleGrainsAndProteins")]
    public string StapleGrainsAndProteins { get; set; } = string.Empty;

    [JsonPropertyName("keySpices")]
    public string KeySpices { get; set; } = string.Empty;

    [JsonPropertyName("digestiveTradition")]
    public string DigestiveTradition { get; set; } = string.Empty;
}
