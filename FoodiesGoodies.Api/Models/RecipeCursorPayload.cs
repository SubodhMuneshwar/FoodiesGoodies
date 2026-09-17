namespace FoodiesGoodies.Api.Models;

public class RecipeCursorPayload
{
    public string Query { get; set; } = string.Empty;
    public string ContinuationToken { get; set; } = string.Empty;
    public long CreatedAtUtc { get; set; } = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
}
