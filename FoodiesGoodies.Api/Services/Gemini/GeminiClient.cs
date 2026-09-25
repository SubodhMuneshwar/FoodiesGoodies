using System.Net;
using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;
using FoodiesGoodies.Api.Configuration;
using Microsoft.Extensions.Options;

namespace FoodiesGoodies.Api.Services.Gemini;

public class GeminiClient : IGeminiClient
{
    private readonly HttpClient _httpClient;
    private readonly GeminiOptions _options;
    private readonly ILogger<GeminiClient> _logger;

    public GeminiClient(
        HttpClient httpClient,
        IOptions<GeminiOptions> options,
        ILogger<GeminiClient> logger)
    {
        _httpClient = httpClient;
        _options = options.Value;
        _logger = logger;
    }

    public bool IsConfigured => !string.IsNullOrWhiteSpace(_options.ApiKey);

    public async Task<GeminiInteractionResult> GenerateContentAsync(
        GeminiGenerateContentRequest request,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);

        if (!IsConfigured)
        {
            return new GeminiInteractionResult
            {
                Success = false,
                ErrorMessage = "Gemini API key is not configured in server settings.",
                StatusCode = (int)HttpStatusCode.Unauthorized
            };
        }

        string model = string.IsNullOrWhiteSpace(_options.Model) ? "gemini-2.5-flash" : _options.Model.Trim();
        string baseUrl = string.IsNullOrWhiteSpace(_options.BaseUrl) ? "https://generativelanguage.googleapis.com" : _options.BaseUrl.TrimEnd('/');
        string endpoint = $"{baseUrl}/v1beta/models/{model}:generateContent";

        // Build Payload
        var payloadObj = new JsonObject
        {
            ["contents"] = JsonSerializer.SerializeToNode(request.Contents)
        };

        if (!string.IsNullOrWhiteSpace(request.SystemInstruction))
        {
            payloadObj["systemInstruction"] = new JsonObject
            {
                ["parts"] = new JsonArray
                {
                    new JsonObject { ["text"] = request.SystemInstruction }
                }
            };
        }

        var generationConfig = new JsonObject
        {
            ["temperature"] = request.Temperature ?? 0.4
        };

        if (!string.IsNullOrWhiteSpace(request.ResponseMimeType))
        {
            generationConfig["responseMimeType"] = request.ResponseMimeType;
        }

        payloadObj["generationConfig"] = generationConfig;

        if (request.Tools != null && request.Tools.Count > 0)
        {
            payloadObj["tools"] = JsonSerializer.SerializeToNode(request.Tools);
        }

        string requestJson = payloadObj.ToJsonString();

        using var httpRequest = new HttpRequestMessage(HttpMethod.Post, endpoint)
        {
            Content = new StringContent(requestJson, Encoding.UTF8, "application/json")
        };

        // Authenticate strictly via official server-side header - never in URL query parameter
        httpRequest.Headers.Add("x-goog-api-key", _options.ApiKey.Trim());

        using var timeoutCts = new CancellationTokenSource(TimeSpan.FromSeconds(Math.Max(5, _options.TimeoutSeconds)));
        using var linkedCts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken, timeoutCts.Token);

        try
        {
            _logger.LogInformation("Dispatching Gemini generateContent request to model '{Model}' (Interactions/REST)", model);

            using var response = await _httpClient.SendAsync(httpRequest, linkedCts.Token);

            string responseBody = await response.Content.ReadAsStringAsync(linkedCts.Token);

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning("Gemini API call failed with HTTP {StatusCode}", response.StatusCode);

                string safeError = response.StatusCode switch
                {
                    HttpStatusCode.Unauthorized => "Gemini authentication failed. Please verify server API key configuration.",
                    HttpStatusCode.Forbidden => "Access to Gemini model was forbidden. Check API permissions.",
                    HttpStatusCode.TooManyRequests => "Gemini API rate limit or quota exceeded. Please try again shortly.",
                    HttpStatusCode.InternalServerError => "Google Gemini service encountered an internal error.",
                    _ => $"Gemini service returned HTTP {(int)response.StatusCode}."
                };

                return new GeminiInteractionResult
                {
                    Success = false,
                    StatusCode = (int)response.StatusCode,
                    ErrorMessage = safeError,
                    ModelUsed = model
                };
            }

            // Parse candidates
            using var doc = JsonDocument.Parse(responseBody);
            var root = doc.RootElement;

            if (!root.TryGetProperty("candidates", out var candidates) || candidates.GetArrayLength() == 0)
            {
                return new GeminiInteractionResult
                {
                    Success = false,
                    StatusCode = (int)response.StatusCode,
                    ErrorMessage = "No response candidates returned by Gemini model.",
                    ModelUsed = model
                };
            }

            var firstCandidate = candidates[0];
            if (!firstCandidate.TryGetProperty("content", out var content) ||
                !content.TryGetProperty("parts", out var parts) ||
                parts.GetArrayLength() == 0)
            {
                return new GeminiInteractionResult
                {
                    Success = false,
                    StatusCode = (int)response.StatusCode,
                    ErrorMessage = "Candidate contained empty parts.",
                    ModelUsed = model
                };
            }

            var result = new GeminiInteractionResult
            {
                Success = true,
                StatusCode = 200,
                ModelUsed = model
            };

            var textBuilder = new StringBuilder();

            foreach (var part in parts.EnumerateArray())
            {
                if (part.TryGetProperty("text", out var textProp))
                {
                    textBuilder.Append(textProp.GetString());
                }

                if (part.TryGetProperty("functionCall", out var fnCallProp))
                {
                    var fnCall = new GeminiFunctionCall
                    {
                        Name = fnCallProp.GetProperty("name").GetString() ?? string.Empty
                    };

                    if (fnCallProp.TryGetProperty("args", out var argsProp))
                    {
                        fnCall.Args = JsonSerializer.Deserialize<Dictionary<string, object?>>(argsProp.GetRawText())
                                      ?? new Dictionary<string, object?>();
                    }

                    result.FunctionCalls.Add(fnCall);
                }
            }

            result.RawText = textBuilder.ToString();
            return result;
        }
        catch (OperationCanceledException) when (timeoutCts.IsCancellationRequested && !cancellationToken.IsCancellationRequested)
        {
            _logger.LogWarning("Gemini request timed out after {TimeoutSeconds} seconds", _options.TimeoutSeconds);
            return new GeminiInteractionResult
            {
                Success = false,
                StatusCode = (int)HttpStatusCode.RequestTimeout,
                ErrorMessage = $"Gemini request timed out after {_options.TimeoutSeconds} seconds.",
                ModelUsed = model
            };
        }
        catch (OperationCanceledException)
        {
            return new GeminiInteractionResult
            {
                Success = false,
                StatusCode = 499,
                ErrorMessage = "Request was cancelled.",
                ModelUsed = model
            };
        }
        catch (JsonException ex)
        {
            _logger.LogError(ex, "Failed to parse JSON response from Gemini API");
            return new GeminiInteractionResult
            {
                Success = false,
                StatusCode = (int)HttpStatusCode.BadGateway,
                ErrorMessage = "Received malformed JSON from Gemini service.",
                ModelUsed = model
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error communicating with Gemini API");
            return new GeminiInteractionResult
            {
                Success = false,
                StatusCode = (int)HttpStatusCode.InternalServerError,
                ErrorMessage = "An unexpected error occurred while communicating with the AI service.",
                ModelUsed = model
            };
        }
    }
}
