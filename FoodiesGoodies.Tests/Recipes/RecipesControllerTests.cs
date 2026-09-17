using System.Net;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using FluentAssertions;
using FoodiesGoodies.Api.Services;
using FoodiesGoodies.Tests.Helpers;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Moq;
using Xunit;

namespace FoodiesGoodies.Tests.Recipes;

public class RecipesControllerTests : IClassFixture<TestWebApplicationFactory>
{
    private readonly TestWebApplicationFactory _factory;

    public RecipesControllerTests(TestWebApplicationFactory factory)
    {
        _factory = factory;
    }

    private static StringContent Json(object payload) =>
        new(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");

    private static FoodiesGoodies.Api.DTOs.RecipeSearchResponse MockSearchResponse(string? nextContinuation = null) =>
        new()
        {
            From = 1,
            To = 20,
            Count = 100,
            NextCursor = nextContinuation != null ? "test_cursor_value" : null,
            Hits = new List<FoodiesGoodies.Api.DTOs.RecipeHitDto>
            {
                new()
                {
                    Recipe = new FoodiesGoodies.Api.DTOs.RecipeDto
                    {
                        Label = "Test Pasta",
                        Image = "https://example.com/pasta.jpg",
                        Source = "Test Source",
                        Calories = 400,
                        Yield = 4
                    }
                }
            }
        };

    // -------------------------------------------------------------------------
    // Validation
    // -------------------------------------------------------------------------

    [Fact]
    public async Task Search_EmptyQuery_Returns400()
    {
        var client = _factory.CreateClient();

        var response = await client.GetAsync("/api/recipes?q=");

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Search_MissingQueryParam_Returns400()
    {
        var client = _factory.CreateClient();

        var response = await client.GetAsync("/api/recipes");

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Search_QueryOver100Chars_Returns400()
    {
        var client = _factory.CreateClient();
        var longQuery = new string('a', 101);

        var response = await client.GetAsync($"/api/recipes?q={longQuery}");

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Search_UnconfiguredCredentials_Returns400OrServiceError()
    {
        // The default test app has no Edamam credentials configured
        // so it should return a 4xx or 5xx (not a 200 with empty results)
        var client = _factory.CreateClient();

        var response = await client.GetAsync("/api/recipes?q=pasta");

        // Either 400 (validation by service) or 500 (unhandled upstream config error)
        ((int)response.StatusCode).Should().BeGreaterThanOrEqualTo(400);
    }

    // -------------------------------------------------------------------------
    // Mocked HTTP — upstream success
    // -------------------------------------------------------------------------

    [Fact]
    public async Task Search_MockedUpstreamSuccess_Returns200WithHits()
    {
        var mockService = new Mock<IRecipeService>();
        mockService
            .Setup(s => s.SearchRecipesAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(MockSearchResponse("next_token"));

        var client = _factory.WithWebHostBuilder(builder =>
        {
            builder.ConfigureServices(services =>
            {
                // Replace real service with mock
                var descriptor = services.SingleOrDefault(d => d.ServiceType == typeof(IRecipeService));
                if (descriptor != null) services.Remove(descriptor);
                services.AddScoped<IRecipeService>(_ => mockService.Object);
            });
        }).CreateClient();

        var response = await client.GetAsync("/api/recipes?q=pasta");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = await response.Content.ReadAsStringAsync();
        body.Should().Contain("Test Pasta");
        body.Should().Contain("hits");
    }

    // -------------------------------------------------------------------------
    // Mocked HTTP — upstream failure
    // -------------------------------------------------------------------------

    [Fact]
    public async Task Search_MockedUpstreamFailure_Returns5xx()
    {
        var mockService = new Mock<IRecipeService>();
        mockService
            .Setup(s => s.SearchRecipesAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("Upstream recipe service failed."));

        var client = _factory.WithWebHostBuilder(builder =>
        {
            builder.ConfigureServices(services =>
            {
                var descriptor = services.SingleOrDefault(d => d.ServiceType == typeof(IRecipeService));
                if (descriptor != null) services.Remove(descriptor);
                services.AddScoped<IRecipeService>(_ => mockService.Object);
            });
        }).CreateClient();

        var response = await client.GetAsync("/api/recipes?q=pasta");

        ((int)response.StatusCode).Should().BeGreaterThanOrEqualTo(400);
    }

    // -------------------------------------------------------------------------
    // Pagination cursor
    // -------------------------------------------------------------------------

    [Fact]
    public async Task Next_MissingCursor_Returns400()
    {
        var client = _factory.CreateClient();

        var response = await client.GetAsync("/api/recipes/next");

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Next_EmptyCursor_Returns400()
    {
        var client = _factory.CreateClient();

        var response = await client.GetAsync("/api/recipes/next?cursor=");

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Next_TamperedCursor_Returns4xxOr5xx()
    {
        var client = _factory.CreateClient();

        var response = await client.GetAsync("/api/recipes/next?cursor=INVALID_TAMPERED_CURSOR_XYZ");

        ((int)response.StatusCode).Should().BeGreaterThanOrEqualTo(400);
    }

    [Fact]
    public async Task Next_MockedValidCursor_Returns200()
    {
        var mockService = new Mock<IRecipeService>();
        mockService
            .Setup(s => s.GetNextPageAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(MockSearchResponse());

        var client = _factory.WithWebHostBuilder(builder =>
        {
            builder.ConfigureServices(services =>
            {
                var descriptor = services.SingleOrDefault(d => d.ServiceType == typeof(IRecipeService));
                if (descriptor != null) services.Remove(descriptor);
                services.AddScoped<IRecipeService>(_ => mockService.Object);
            });
        }).CreateClient();

        var response = await client.GetAsync("/api/recipes/next?cursor=any_cursor_accepted_by_mock");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = await response.Content.ReadAsStringAsync();
        body.Should().Contain("Test Pasta");
    }
}
