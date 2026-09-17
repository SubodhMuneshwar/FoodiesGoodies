using System.Net;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using FluentAssertions;
using FoodiesGoodies.Tests.Helpers;
using Xunit;

namespace FoodiesGoodies.Tests.Auth;

public class AuthControllerTests : IClassFixture<TestWebApplicationFactory>
{
    private readonly TestWebApplicationFactory _factory;

    public AuthControllerTests(TestWebApplicationFactory factory)
    {
        _factory = factory;
    }

    private HttpClient CreateClient() => _factory.CreateClient(new()
    {
        AllowAutoRedirect = false,
        HandleCookies = true
    });

    private static StringContent Json(object payload) =>
        new(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");

    // -------------------------------------------------------------------------
    // Registration
    // -------------------------------------------------------------------------

    [Fact]
    public async Task Register_ValidCredentials_Returns200WithUser()
    {
        var client = CreateClient();
        var email = $"reg_{Guid.NewGuid():N}@test.com";

        var response = await client.PostAsync("/api/auth/register",
            Json(new { username = "Chef Test", email, password = "Password1!" }));

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = await response.Content.ReadAsStringAsync();
        body.Should().Contain("\"success\":true");
        body.Should().Contain(email);
    }

    [Fact]
    public async Task Register_DuplicateEmail_Returns409Conflict()
    {
        var client = CreateClient();
        var email = $"dup_{Guid.NewGuid():N}@test.com";
        var payload = Json(new { username = "Chef Dup", email, password = "Password1!" });

        // First registration
        await client.PostAsync("/api/auth/register", payload);

        // Duplicate — must be rejected
        var payload2 = Json(new { username = "Chef Dup", email, password = "Password1!" });
        var response = await client.PostAsync("/api/auth/register", payload2);

        response.StatusCode.Should().Be(HttpStatusCode.Conflict);
        var body = await response.Content.ReadAsStringAsync();
        body.Should().Contain("\"success\":false");
    }

    [Fact]
    public async Task Register_InvalidEmail_Returns400()
    {
        var client = CreateClient();

        var response = await client.PostAsync("/api/auth/register",
            Json(new { username = "Chef Bad", email = "not-an-email", password = "Password1!" }));

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Register_PasswordTooShort_Returns400()
    {
        var client = CreateClient();

        var response = await client.PostAsync("/api/auth/register",
            Json(new { username = "Chef Short", email = $"short_{Guid.NewGuid():N}@test.com", password = "ab" }));

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    // -------------------------------------------------------------------------
    // Login
    // -------------------------------------------------------------------------

    [Fact]
    public async Task Login_ValidCredentials_Returns200()
    {
        var (client, email, password) = await _factory.CreateAuthenticatedClientAsync();

        // Log out first, then log back in
        await client.PostAsync("/api/auth/logout", null);

        var response = await client.PostAsync("/api/auth/login",
            Json(new { email, password, rememberMe = true }));

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = await response.Content.ReadAsStringAsync();
        body.Should().Contain("\"success\":true");
    }

    [Fact]
    public async Task Login_WrongPassword_Returns401()
    {
        var (client, email, _) = await _factory.CreateAuthenticatedClientAsync();
        await client.PostAsync("/api/auth/logout", null);

        var response = await client.PostAsync("/api/auth/login",
            Json(new { email, password = "WrongPassword999!", rememberMe = false }));

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Login_UnknownEmail_Returns401()
    {
        var client = CreateClient();

        var response = await client.PostAsync("/api/auth/login",
            Json(new { email = "nobody@nowhere.com", password = "Password1!", rememberMe = false }));

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    // -------------------------------------------------------------------------
    // Logout
    // -------------------------------------------------------------------------

    [Fact]
    public async Task Logout_AuthenticatedUser_Returns200()
    {
        var (client, _, _) = await _factory.CreateAuthenticatedClientAsync();

        var response = await client.PostAsync("/api/auth/logout", null);

        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    // -------------------------------------------------------------------------
    // /api/auth/me
    // -------------------------------------------------------------------------

    [Fact]
    public async Task GetMe_Unauthenticated_Returns401()
    {
        var client = CreateClient();

        var response = await client.GetAsync("/api/auth/me");

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task GetMe_Authenticated_Returns200WithUserProfile()
    {
        var (client, email, _) = await _factory.CreateAuthenticatedClientAsync();

        var response = await client.GetAsync("/api/auth/me");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = await response.Content.ReadAsStringAsync();
        body.Should().Contain("\"success\":true");
        body.Should().Contain(email);
    }

    [Fact]
    public async Task GetMe_AfterLogout_Returns401()
    {
        var (client, _, _) = await _factory.CreateAuthenticatedClientAsync();

        await client.PostAsync("/api/auth/logout", null);
        var response = await client.GetAsync("/api/auth/me");

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    // -------------------------------------------------------------------------
    // Demo Login
    // -------------------------------------------------------------------------

    [Fact]
    public async Task DemoLogin_IssuesSessionCookieAndReturns200()
    {
        var client = CreateClient();

        var demoResponse = await client.PostAsync("/api/auth/demo", null);
        demoResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        var demoBody = await demoResponse.Content.ReadAsStringAsync();
        demoBody.Should().Contain("\"success\":true");
        demoBody.Should().Contain("demo@foodiesgoodies.local");

        // Follow up with /api/auth/me using the received cookie
        var meResponse = await client.GetAsync("/api/auth/me");
        meResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        var meBody = await meResponse.Content.ReadAsStringAsync();
        meBody.Should().Contain("\"success\":true");
        meBody.Should().Contain("demo@foodiesgoodies.local");
    }
}
