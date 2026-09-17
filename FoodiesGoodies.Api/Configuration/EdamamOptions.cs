namespace FoodiesGoodies.Api.Configuration;

public class EdamamOptions
{
    public const string SectionName = "Edamam";

    public string AppId { get; set; } = string.Empty;
    public string AppKey { get; set; } = string.Empty;
    public string BaseUrl { get; set; } = "https://api.edamam.com/api/recipes/v2";
    public string CursorSigningKey { get; set; } = "FoodiesGoodies_Secure_Cursor_Key_2025!";
}
