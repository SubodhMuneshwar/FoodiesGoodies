namespace FoodiesGoodies.Api.Configuration;

public class SmtpOptions
{
    public const string SectionName = "Smtp";

    public string Host { get; set; } = string.Empty;
    public int Port { get; set; } = 587;
    public bool UseSsl { get; set; } = false;
    public string Username { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string AdminEmail { get; set; } = "admin@foodiesgoodies.local";
    public string FromEmail { get; set; } = "noreply@foodiesgoodies.local";
    public string FromName { get; set; } = "Foodies Goodies Culinary Support";
}
