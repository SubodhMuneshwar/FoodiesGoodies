using System.Text.Json.Serialization;

namespace FoodiesGoodies.Api.Services.Gemini;

public class GeminiContent
{
    [JsonPropertyName("role")]
    public string Role { get; set; } = "user"; // "user", "model", "function"

    [JsonPropertyName("parts")]
    public List<GeminiPart> Parts { get; set; } = new();
}

public class GeminiPart
{
    [JsonPropertyName("text")]
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? Text { get; set; }

    [JsonPropertyName("functionCall")]
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public GeminiFunctionCall? FunctionCall { get; set; }

    [JsonPropertyName("functionResponse")]
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public GeminiFunctionResponse? FunctionResponse { get; set; }
}

public class GeminiFunctionCall
{
    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;

    [JsonPropertyName("args")]
    public Dictionary<string, object?> Args { get; set; } = new();
}

public class GeminiFunctionResponse
{
    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;

    [JsonPropertyName("response")]
    public Dictionary<string, object?> Response { get; set; } = new();
}

public class GeminiToolDeclaration
{
    [JsonPropertyName("functionDeclarations")]
    public List<GeminiFunctionDeclaration> FunctionDeclarations { get; set; } = new();
}

public class GeminiFunctionDeclaration
{
    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;

    [JsonPropertyName("description")]
    public string Description { get; set; } = string.Empty;

    [JsonPropertyName("parameters")]
    public object? Parameters { get; set; }
}

public class GeminiGenerateContentRequest
{
    public string? SystemInstruction { get; set; }
    public List<GeminiContent> Contents { get; set; } = new();
    public string? ResponseMimeType { get; set; } = "application/json";
    public List<GeminiToolDeclaration>? Tools { get; set; }
    public double? Temperature { get; set; } = 0.4;
}

public class GeminiInteractionResult
{
    public bool Success { get; set; }
    public string? RawText { get; set; }
    public List<GeminiFunctionCall> FunctionCalls { get; set; } = new();
    public string? ErrorMessage { get; set; }
    public int StatusCode { get; set; }
    public string? ModelUsed { get; set; }
}

public interface IGeminiClient
{
    bool IsConfigured { get; }
    Task<GeminiInteractionResult> GenerateContentAsync(
        GeminiGenerateContentRequest request,
        CancellationToken cancellationToken = default);
}
