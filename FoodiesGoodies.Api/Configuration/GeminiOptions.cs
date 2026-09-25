namespace FoodiesGoodies.Api.Configuration;

public class GeminiOptions
{
    public const string SectionName = "Gemini";

    public string ApiKey { get; set; } = string.Empty;
    public string Model { get; set; } = "gemini-1.5-flash";
    public string ApiUrl { get; set; } = "https://generativelanguage.googleapis.com/v1beta/models";
}
