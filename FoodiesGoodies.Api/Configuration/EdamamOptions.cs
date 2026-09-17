namespace FoodiesGoodies.Api.Configuration;

public class EdamamOptions
{
    public const string SectionName = "Edamam";

    public string AppId { get; set; } = string.Empty;
    public string AppKey { get; set; } = string.Empty;
    public string BaseUrl { get; set; } = "https://api.edamam.com/api/recipes/v2";
    /// <summary>
    /// Secret key used to HMAC-sign pagination cursors.
    /// Must be set via User Secrets (dev) or environment variables (prod).
    /// Never hardcode or commit a real value here.
    /// </summary>
    public string CursorSigningKey { get; set; } = string.Empty;
}
