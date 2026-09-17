using System.Net;
using System.Text;
using System.Text.Json;
using FluentAssertions;
using FoodiesGoodies.Api.DTOs;
using FoodiesGoodies.Api.Services;
using FoodiesGoodies.Tests.Helpers;
using Microsoft.Extensions.DependencyInjection;
using Moq;
using Xunit;

namespace FoodiesGoodies.Tests.Contact;

public class ContactControllerTests : IClassFixture<TestWebApplicationFactory>
{
    private readonly TestWebApplicationFactory _factory;

    public ContactControllerTests(TestWebApplicationFactory factory)
    {
        _factory = factory;
    }

    private static StringContent Json(object payload) =>
        new(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");

    private static object ValidPayload(
        string name = "Jane Chef",
        string email = "jane@test.com",
        string subject = "Recipe Question",
        string message = "I have a question about the pasta recipe, please help me.") =>
        new { name, email, subject, message };

    private HttpClient ClientWithMockedService(Mock<IContactService> mock) =>
        _factory.WithWebHostBuilder(builder =>
        {
            builder.ConfigureServices(services =>
            {
                var descriptor = services.SingleOrDefault(d => d.ServiceType == typeof(IContactService));
                if (descriptor != null) services.Remove(descriptor);
                services.AddScoped<IContactService>(_ => mock.Object);
            });
        }).CreateClient();

    // -------------------------------------------------------------------------
    // Validation
    // -------------------------------------------------------------------------

    [Fact]
    public async Task Contact_ValidRequest_Returns200()
    {
        var mock = new Mock<IContactService>();
        mock.Setup(s => s.SendInquiryAsync(It.IsAny<ContactRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(ApiResponse.Ok("Message sent successfully."));

        var response = await ClientWithMockedService(mock).PostAsync("/api/contact", Json(ValidPayload()));

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = await response.Content.ReadAsStringAsync();
        body.Should().Contain("\"success\":true");
    }

    [Fact]
    public async Task Contact_MissingName_Returns400()
    {
        var client = _factory.CreateClient();

        var response = await client.PostAsync("/api/contact", Json(new
        {
            name = "",
            email = "test@test.com",
            subject = "Hello",
            message = "This is a test message with enough characters."
        }));

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Contact_InvalidEmail_Returns400()
    {
        var client = _factory.CreateClient();

        var response = await client.PostAsync("/api/contact", Json(new
        {
            name = "Chef Valid",
            email = "not-a-valid-email",
            subject = "Hello",
            message = "This is a test message with enough characters."
        }));

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Contact_MissingSubject_Returns400()
    {
        var client = _factory.CreateClient();

        var response = await client.PostAsync("/api/contact", Json(new
        {
            name = "Chef Valid",
            email = "valid@test.com",
            subject = "",
            message = "This is a test message with enough characters."
        }));

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Contact_MissingMessage_Returns400()
    {
        var client = _factory.CreateClient();

        var response = await client.PostAsync("/api/contact", Json(new
        {
            name = "Chef Valid",
            email = "valid@test.com",
            subject = "Hello there",
            message = ""
        }));

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Contact_OversizedMessage_Returns400()
    {
        var client = _factory.CreateClient();
        var hugeMessage = new string('X', 3001); // Exceeds 3000 char limit

        var response = await client.PostAsync("/api/contact", Json(new
        {
            name = "Chef Valid",
            email = "valid@test.com",
            subject = "Hello",
            message = hugeMessage
        }));

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Contact_OversizedName_Returns400()
    {
        var client = _factory.CreateClient();
        var longName = new string('A', 101); // Exceeds 100 char limit

        var response = await client.PostAsync("/api/contact", Json(new
        {
            name = longName,
            email = "valid@test.com",
            subject = "Hello",
            message = "Normal length message here that is certainly long enough."
        }));

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    // -------------------------------------------------------------------------
    // Service behaviour
    // -------------------------------------------------------------------------

    [Fact]
    public async Task Contact_SmtpFailure_Returns400()
    {
        var mock = new Mock<IContactService>();
        mock.Setup(s => s.SendInquiryAsync(It.IsAny<ContactRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(ApiResponse.Fail("Failed to send email. Please try again later."));

        var response = await ClientWithMockedService(mock).PostAsync("/api/contact", Json(ValidPayload()));

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        var body = await response.Content.ReadAsStringAsync();
        body.Should().Contain("\"success\":false");
    }

    [Fact]
    public async Task Contact_ServiceCalledOnce_WithCorrectPayload()
    {
        var mock = new Mock<IContactService>();
        mock.Setup(s => s.SendInquiryAsync(It.IsAny<ContactRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(ApiResponse.Ok("Sent."));

        await ClientWithMockedService(mock).PostAsync("/api/contact", Json(ValidPayload(
            name: "Unique Chef",
            email: "unique@chef.com",
            subject: "Important query",
            message: "Please respond to my detailed inquiry about your cooking techniques.")));

        mock.Verify(
            s => s.SendInquiryAsync(
                It.Is<ContactRequest>(r => r.Email == "unique@chef.com" && r.Name == "Unique Chef"),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }
}
