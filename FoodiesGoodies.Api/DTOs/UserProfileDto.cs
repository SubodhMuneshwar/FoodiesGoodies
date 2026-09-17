namespace FoodiesGoodies.Api.DTOs;

public class UserProfileDto
{
    public string Id { get; set; } = string.Empty;
    public string Username { get; set; } = string.Empty;
    public string Handle { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string Avatar { get; set; } = string.Empty;
    public string? Bio { get; set; }
    public string DietaryFocus { get; set; } = "Culinary Adventurer";
    public string Rank { get; set; } = "Home Cook";
    public DateTime MemberSince { get; set; }
}
