using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Web;
using FoodiesGoodies.Api.Configuration;
using FoodiesGoodies.Api.DTOs;
using FoodiesGoodies.Api.Models;
using Microsoft.Extensions.Options;

namespace FoodiesGoodies.Api.Services;

public class RecipeService : IRecipeService
{
    private readonly HttpClient _httpClient;
    private readonly EdamamOptions _options;
    private readonly ILogger<RecipeService> _logger;

    public RecipeService(
        HttpClient httpClient,
        IOptions<EdamamOptions> options,
        ILogger<RecipeService> logger)
    {
        _httpClient = httpClient;
        _options = options.Value;
        _logger = logger;
    }

    public async Task<RecipeSearchResponse> SearchRecipesAsync(string query, CancellationToken cancellationToken = default)
    {
        var cleanQuery = ValidateAndCleanQuery(query);

        EnsureCredentialsConfigured();

        var requestUrl = $"{_options.BaseUrl}?type=public&q={Uri.EscapeDataString(cleanQuery)}&app_id={Uri.EscapeDataString(_options.AppId)}&app_key={Uri.EscapeDataString(_options.AppKey)}";

        _logger.LogInformation("Executing Edamam recipe search for query '{Query}'", cleanQuery);

        return await ExecuteEdamamRequestAsync(requestUrl, cleanQuery, cancellationToken);
    }

    public async Task<RecipeSearchResponse> GetNextPageAsync(string cursor, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(cursor))
        {
            throw new ArgumentException("Pagination cursor cannot be empty.", nameof(cursor));
        }

        var payload = DecodeCursor(cursor);
        if (payload == null || string.IsNullOrWhiteSpace(payload.ContinuationToken))
        {
            throw new ArgumentException("Invalid, malformed, or tampered pagination cursor.", nameof(cursor));
        }

        EnsureCredentialsConfigured();

        var requestUrl = $"{_options.BaseUrl}?type=public&q={Uri.EscapeDataString(payload.Query)}&_cont={Uri.EscapeDataString(payload.ContinuationToken)}&app_id={Uri.EscapeDataString(_options.AppId)}&app_key={Uri.EscapeDataString(_options.AppKey)}";

        _logger.LogInformation("Fetching next recipe page for query '{Query}'", payload.Query);

        return await ExecuteEdamamRequestAsync(requestUrl, payload.Query, cancellationToken);
    }

    private static string ValidateAndCleanQuery(string query)
    {
        if (string.IsNullOrWhiteSpace(query))
        {
            throw new ArgumentException("Search query cannot be empty.", nameof(query));
        }

        var trimmed = query.Trim();
        if (trimmed.Length > 100)
        {
            throw new ArgumentException("Search query exceeds the maximum allowed length of 100 characters.", nameof(query));
        }

        return trimmed;
    }

    private void EnsureCredentialsConfigured()
    {
        if (string.IsNullOrWhiteSpace(_options.AppId) || string.IsNullOrWhiteSpace(_options.AppKey))
        {
            _logger.LogError("Edamam API AppId or AppKey is not configured.");
            throw new InvalidOperationException("Recipe service is temporarily unconfigured. Please configure Edamam credentials in appsettings or user secrets.");
        }
    }

    private async Task<RecipeSearchResponse> ExecuteEdamamRequestAsync(string requestUrl, string query, CancellationToken cancellationToken)
    {
        using var request = new HttpRequestMessage(HttpMethod.Get, requestUrl);
        request.Headers.Add("Accept", "application/json");

        if (!string.IsNullOrWhiteSpace(_options.UserId))
        {
            request.Headers.Add("Edamam-Account-User", _options.UserId.Trim());
        }

        HttpResponseMessage response;
        try
        {
            response = await _httpClient.SendAsync(request, cancellationToken);
        }
        catch (HttpRequestException ex)
        {
            _logger.LogError(ex, "HTTP transport error while connecting to Edamam API for query '{Query}'", query);
            throw new InvalidOperationException("Failed to communicate with the culinary recipe service.", ex);
        }
        catch (TaskCanceledException ex) when (!cancellationToken.IsCancellationRequested)
        {
            _logger.LogError(ex, "Request timed out while connecting to Edamam API for query '{Query}'", query);
            throw new TimeoutException("The recipe service request timed out.", ex);
        }

        if (!response.IsSuccessStatusCode)
        {
            var errorBody = await response.Content.ReadAsStringAsync(cancellationToken);
            _logger.LogError("Edamam API returned HTTP status code {StatusCode}: {ErrorBody}", response.StatusCode, errorBody);
            throw new InvalidOperationException($"Recipe service returned error status ({response.StatusCode}).");
        }

        var contentStream = await response.Content.ReadAsStreamAsync(cancellationToken);
        using var jsonDoc = await JsonDocument.ParseAsync(contentStream, cancellationToken: cancellationToken);
        var root = jsonDoc.RootElement;

        var result = new RecipeSearchResponse
        {
            From = root.TryGetProperty("from", out var fromProp) ? fromProp.GetInt32() : 0,
            To = root.TryGetProperty("to", out var toProp) ? toProp.GetInt32() : 0,
            Count = root.TryGetProperty("count", out var countProp) ? countProp.GetInt32() : 0
        };

        // Parse hits
        if (root.TryGetProperty("hits", out var hitsProp) && hitsProp.ValueKind == JsonValueKind.Array)
        {
            foreach (var hitElement in hitsProp.EnumerateArray())
            {
                if (hitElement.TryGetProperty("recipe", out var r))
                {
                    var dto = new RecipeDto
                    {
                        Label = r.TryGetProperty("label", out var l) ? l.GetString() ?? "" : "",
                        Image = r.TryGetProperty("image", out var img) ? img.GetString() ?? "" : "",
                        Url = r.TryGetProperty("url", out var u) ? u.GetString() ?? "" : "",
                        Source = r.TryGetProperty("source", out var s) ? s.GetString() ?? "" : "",
                        Calories = r.TryGetProperty("calories", out var c) ? c.GetDouble() : 0,
                        Yield = r.TryGetProperty("yield", out var y) ? y.GetDouble() : 1,
                        TotalTime = r.TryGetProperty("totalTime", out var t) ? t.GetDouble() : 0
                    };

                    // Collections
                    if (r.TryGetProperty("cuisineType", out var cTypes) && cTypes.ValueKind == JsonValueKind.Array)
                    {
                        foreach (var ct in cTypes.EnumerateArray())
                        {
                            var val = ct.GetString();
                            if (!string.IsNullOrEmpty(val)) dto.CuisineType.Add(val);
                        }
                    }

                    if (r.TryGetProperty("mealType", out var mTypes) && mTypes.ValueKind == JsonValueKind.Array)
                    {
                        foreach (var mt in mTypes.EnumerateArray())
                        {
                            var val = mt.GetString();
                            if (!string.IsNullOrEmpty(val)) dto.MealType.Add(val);
                        }
                    }

                    if (r.TryGetProperty("dietLabels", out var dLabels) && dLabels.ValueKind == JsonValueKind.Array)
                    {
                        foreach (var dl in dLabels.EnumerateArray())
                        {
                            var val = dl.GetString();
                            if (!string.IsNullOrEmpty(val)) dto.DietLabels.Add(val);
                        }
                    }

                    if (r.TryGetProperty("healthLabels", out var hLabels) && hLabels.ValueKind == JsonValueKind.Array)
                    {
                        foreach (var hl in hLabels.EnumerateArray())
                        {
                            var val = hl.GetString();
                            if (!string.IsNullOrEmpty(val)) dto.HealthLabels.Add(val);
                        }
                    }

                    if (r.TryGetProperty("ingredientLines", out var iLines) && iLines.ValueKind == JsonValueKind.Array)
                    {
                        foreach (var il in iLines.EnumerateArray())
                        {
                            var val = il.GetString();
                            if (!string.IsNullOrEmpty(val)) dto.IngredientLines.Add(val);
                        }
                    }

                    result.Hits.Add(new RecipeHitDto { Recipe = dto });
                }
            }
        }

        // Parse continuation token from _links.next.href
        if (root.TryGetProperty("_links", out var linksProp) &&
            linksProp.TryGetProperty("next", out var nextProp) &&
            nextProp.TryGetProperty("href", out var nextHrefProp))
        {
            var nextHref = nextHrefProp.GetString();
            if (!string.IsNullOrEmpty(nextHref))
            {
                var continuationToken = ExtractContinuationToken(nextHref);
                if (!string.IsNullOrEmpty(continuationToken))
                {
                    result.NextCursor = GenerateCursor(query, continuationToken);
                }
            }
        }

        return result;
    }

    private static string? ExtractContinuationToken(string edamamUrl)
    {
        try
        {
            var uri = new Uri(edamamUrl);
            var queryParams = HttpUtility.ParseQueryString(uri.Query);
            return queryParams["_cont"];
        }
        catch
        {
            return null;
        }
    }

    private string GenerateCursor(string query, string continuationToken)
    {
        var payload = new RecipeCursorPayload
        {
            Query = query,
            ContinuationToken = continuationToken,
            CreatedAtUtc = DateTimeOffset.UtcNow.ToUnixTimeSeconds()
        };

        var json = JsonSerializer.Serialize(payload);
        var jsonBytes = Encoding.UTF8.GetBytes(json);
        var jsonBase64 = Convert.ToBase64String(jsonBytes);

        var signature = ComputeHmac(jsonBase64, _options.CursorSigningKey);
        return $"{jsonBase64}.{signature}";
    }

    private RecipeCursorPayload? DecodeCursor(string cursor)
    {
        try
        {
            var parts = cursor.Split('.');
            if (parts.Length != 2) return null;

            var jsonBase64 = parts[0];
            var signature = parts[1];

            var expectedSignature = ComputeHmac(jsonBase64, _options.CursorSigningKey);
            if (!CryptographicOperations.FixedTimeEquals(
                    Encoding.UTF8.GetBytes(signature),
                    Encoding.UTF8.GetBytes(expectedSignature)))
            {
                _logger.LogWarning("Invalid cursor signature detected.");
                return null;
            }

            var jsonBytes = Convert.FromBase64String(jsonBase64);
            var json = Encoding.UTF8.GetString(jsonBytes);
            return JsonSerializer.Deserialize<RecipeCursorPayload>(json);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to decode recipe pagination cursor.");
            return null;
        }
    }

    private static string ComputeHmac(string data, string key)
    {
        var keyBytes = Encoding.UTF8.GetBytes(key);
        var dataBytes = Encoding.UTF8.GetBytes(data);
        using var hmac = new HMACSHA256(keyBytes);
        var hash = hmac.ComputeHash(dataBytes);
        return Convert.ToBase64String(hash);
    }
}
