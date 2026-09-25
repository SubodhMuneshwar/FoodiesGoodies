using System.Net;
using FoodiesGoodies.Api.Configuration;
using FoodiesGoodies.Api.Services.Gemini;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Moq;
using Moq.Protected;
using Xunit;

namespace FoodiesGoodies.Tests.Ai;

public class GeminiClientTests
{
    private static (GeminiClient client, Mock<HttpMessageHandler> mockHandler) CreateClient(
        string apiKey = "test-key-123",
        string model = "gemini-2.5-flash",
        HttpStatusCode statusCode = HttpStatusCode.OK,
        string responseContent = "{\"candidates\":[{\"content\":{\"parts\":[{\"text\":\"{\\\"planTitle\\\":\\\"Test Plan\\\"}\"}]}}]}")
    {
        var mockHandler = new Mock<HttpMessageHandler>(MockBehavior.Strict);
        mockHandler.Protected()
            .Setup<Task<HttpResponseMessage>>(
                "SendAsync",
                ItExpr.IsAny<HttpRequestMessage>(),
                ItExpr.IsAny<CancellationToken>())
            .ReturnsAsync(new HttpResponseMessage
            {
                StatusCode = statusCode,
                Content = new StringContent(responseContent)
            });

        var httpClient = new HttpClient(mockHandler.Object);
        var options = Options.Create(new GeminiOptions
        {
            ApiKey = apiKey,
            Model = model,
            BaseUrl = "https://generativelanguage.googleapis.com",
            TimeoutSeconds = 10,
            MaxAgentIterations = 3
        });
        var logger = NullLogger<GeminiClient>.Instance;

        var client = new GeminiClient(httpClient, options, logger);
        return (client, mockHandler);
    }

    [Fact]
    public void IsConfigured_ReturnsFalseWhenKeyIsEmpty()
    {
        var (client, _) = CreateClient(apiKey: "");
        Assert.False(client.IsConfigured);
    }

    [Fact]
    public void IsConfigured_ReturnsTrueWhenKeyIsSet()
    {
        var (client, _) = CreateClient(apiKey: "valid-key-abc");
        Assert.True(client.IsConfigured);
    }

    [Fact]
    public async Task GenerateContentAsync_Success_ReturnsParsedRawText()
    {
        var (client, _) = CreateClient(responseContent: "{\"candidates\":[{\"content\":{\"parts\":[{\"text\":\"Hello Gemini\"}]}}]}");

        var request = new GeminiGenerateContentRequest
        {
            Contents = new List<GeminiContent>
            {
                new GeminiContent { Parts = new List<GeminiPart> { new GeminiPart { Text = "Prompt" } } }
            }
        };

        var result = await client.GenerateContentAsync(request);

        Assert.True(result.Success);
        Assert.Equal(200, result.StatusCode);
        Assert.Equal("Hello Gemini", result.RawText);
    }

    [Fact]
    public async Task GenerateContentAsync_Http429RateLimit_ReturnsSafeError()
    {
        var (client, _) = CreateClient(statusCode: HttpStatusCode.TooManyRequests, responseContent: "{\"error\":\"Quota exceeded\"}");

        var request = new GeminiGenerateContentRequest();
        var result = await client.GenerateContentAsync(request);

        Assert.False(result.Success);
        Assert.Equal(429, result.StatusCode);
        Assert.Contains("rate limit", result.ErrorMessage, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task GenerateContentAsync_Http401Unauthorized_ReturnsSafeErrorWithoutLeakingKey()
    {
        var (client, _) = CreateClient(statusCode: HttpStatusCode.Unauthorized, responseContent: "{\"error\":\"Invalid API Key\"}");

        var request = new GeminiGenerateContentRequest();
        var result = await client.GenerateContentAsync(request);

        Assert.False(result.Success);
        Assert.Equal(401, result.StatusCode);
        Assert.DoesNotContain("test-key-123", result.ErrorMessage);
    }

    [Fact]
    public async Task GenerateContentAsync_UnconfiguredKey_ReturnsUnauthorizedWithoutNetworkCall()
    {
        var (client, mockHandler) = CreateClient(apiKey: "");

        var request = new GeminiGenerateContentRequest();
        var result = await client.GenerateContentAsync(request);

        Assert.False(result.Success);
        Assert.Equal(401, result.StatusCode);
        Assert.Contains("not configured", result.ErrorMessage);
    }
}
