namespace FoodiesGoodies.Api.Configuration;

public class GeminiOptions
{
    public const string SectionName = "Gemini";

    public string ApiKey { get; set; } = string.Empty;
    public string Model { get; set; } = "gemini-flash-latest";
    public string BaseUrl { get; set; } = "https://generativelanguage.googleapis.com";
    public int TimeoutSeconds { get; set; } = 45;
    public int MaxAgentIterations { get; set; } = 5;
}
