using FoodiesGoodies.Api.Configuration;
using FoodiesGoodies.Api.DTOs;
using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Options;
using MimeKit;

namespace FoodiesGoodies.Api.Services;

public class ContactService : IContactService
{
    private readonly SmtpOptions _options;
    private readonly ILogger<ContactService> _logger;

    public ContactService(IOptions<SmtpOptions> options, ILogger<ContactService> logger)
    {
        _options = options.Value;
        _logger = logger;
    }

    public async Task<ApiResponse> SendInquiryAsync(ContactRequest request, CancellationToken cancellationToken = default)
    {
        var cleanName = request.Name?.Trim() ?? string.Empty;
        var cleanEmail = request.Email?.Trim() ?? string.Empty;
        var cleanSubject = request.Subject?.Trim() ?? string.Empty;
        var cleanMessage = request.Message?.Trim() ?? string.Empty;
        _logger.LogInformation("Contact inquiry received from '{Email}' with subject '{Subject}'", cleanEmail, cleanSubject);

        if (string.IsNullOrWhiteSpace(_options.Host) || string.IsNullOrWhiteSpace(_options.AdminEmail))
        {
            _logger.LogWarning("SMTP host or AdminEmail is not configured. Inquiry could not be dispatched via SMTP.");
            return ApiResponse.Fail("Email delivery is not configured on this server. Unable to send your message.");
        }

        var message = new MimeMessage();
        message.From.Add(new MailboxAddress(_options.FromName, _options.FromEmail));
        message.To.Add(new MailboxAddress("Foodies Goodies Admin", _options.AdminEmail));
        message.ReplyTo.Add(new MailboxAddress(cleanName, cleanEmail));
        message.Subject = $"[FoodiesGoodies Inquiry] {cleanSubject}";

        var bodyBuilder = new BodyBuilder
        {
            TextBody = $"New inquiry received from Foodies Goodies:\n\n" +
                       $"Name: {cleanName}\n" +
                       $"Email: {cleanEmail}\n" +
                       $"Subject: {cleanSubject}\n\n" +
                       $"Message:\n{cleanMessage}\n"
        };
        message.Body = bodyBuilder.ToMessageBody();

        try
        {
            using var client = new SmtpClient();
            client.Timeout = 10000;

            var secureOption = _options.UseSsl ? SecureSocketOptions.SslOnConnect : SecureSocketOptions.StartTlsWhenAvailable;
            await client.ConnectAsync(_options.Host, _options.Port, secureOption, cancellationToken);

            if (!string.IsNullOrWhiteSpace(_options.Username) && !string.IsNullOrWhiteSpace(_options.Password))
            {
                await client.AuthenticateAsync(_options.Username, _options.Password, cancellationToken);
            }

            await client.SendAsync(message, cancellationToken);
            await client.DisconnectAsync(true, cancellationToken);

            _logger.LogInformation("Contact email successfully dispatched via SMTP to '{AdminEmail}'", _options.AdminEmail);
            return ApiResponse.Ok("Your message has been sent successfully! Our culinary team will get back to you soon.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to deliver contact email via SMTP host '{Host}'", _options.Host);
            return ApiResponse.Fail("Unable to deliver your message at this time. Please try again later or contact us directly.");
        }
    }
}
