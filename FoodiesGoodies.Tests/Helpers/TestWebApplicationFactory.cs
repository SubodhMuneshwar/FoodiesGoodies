using FoodiesGoodies.Api.Data;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Xunit;

namespace FoodiesGoodies.Tests.Helpers;

/// <summary>
/// Replaces MySQL with SQLite in-memory for isolated, repeatable tests.
/// Uses a kept-open SqliteConnection to keep the in-memory DB alive for the
/// duration of the factory. EnsureCreated() is called in CreateHost() so that
/// the Identity schema is automatically initialized before any test runs.
/// </summary>
public class TestWebApplicationFactory : WebApplicationFactory<Program>, IAsyncLifetime
{
    private readonly string _dbName = $"InMemoryDb_{Guid.NewGuid():N}";
    private SqliteConnection? _connection;

    public async Task InitializeAsync()
    {
        if (_connection == null)
        {
            _connection = new SqliteConnection($"Data Source={_dbName};Mode=Memory;Cache=Shared");
            await _connection.OpenAsync();
        }
    }

    public new async Task DisposeAsync()
    {
        if (_connection != null)
        {
            await _connection.DisposeAsync();
            _connection = null;
        }
        await base.DisposeAsync();
    }

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Test");

        if (_connection == null)
        {
            _connection = new SqliteConnection($"Data Source={_dbName};Mode=Memory;Cache=Shared");
            _connection.Open();
        }

        builder.ConfigureServices(services =>
        {
            // Remove the registered MySQL DbContext descriptor
            var descriptor = services.SingleOrDefault(
                d => d.ServiceType == typeof(DbContextOptions<FoodiesGoodiesDbContext>));
            if (descriptor != null)
                services.Remove(descriptor);

            // Register SQLite using the shared open connection
            services.AddDbContext<FoodiesGoodiesDbContext>(options =>
                options.UseSqlite(_connection!));
        });
    }

    protected override IHost CreateHost(IHostBuilder builder)
    {
        var host = base.CreateHost(builder);

        // Ensure database schema is created on the SQLite connection
        using var scope = host.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<FoodiesGoodiesDbContext>();
        try
        {
            db.Database.EnsureCreated();
        }
        catch
        {
            // Schema already initialized on this connection/in-memory database
        }

        return host;
    }

    /// <summary>
    /// Creates a pre-registered and signed-in HttpClient for auth-required tests.
    /// </summary>
    public async Task<(HttpClient Client, string Email, string Password)> CreateAuthenticatedClientAsync()
    {
        var email = $"test_{Guid.NewGuid():N}@foodiestest.com";
        const string password = "Test@1234";

        var client = CreateClient(new WebApplicationFactoryClientOptions
        {
            AllowAutoRedirect = false,
            HandleCookies = true
        });

        var registerPayload = new StringContent(
            System.Text.Json.JsonSerializer.Serialize(new { username = "Test Chef", email, password }),
            System.Text.Encoding.UTF8, "application/json");

        var response = await client.PostAsync("/api/auth/register", registerPayload);
        if (!response.IsSuccessStatusCode)
        {
            var body = await response.Content.ReadAsStringAsync();
            throw new InvalidOperationException(
                $"Test setup failed: register returned {response.StatusCode}. Body: {body}");
        }

        return (client, email, password);
    }
}
