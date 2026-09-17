using Microsoft.AspNetCore.Identity;

namespace FoodiesGoodies.Api.Models;

public class ApplicationUser : IdentityUser
{
    public string DisplayName { get; set; } = string.Empty;
    public string? Bio { get; set; }
    public string ProfilePic { get; set; } = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80";
    public string? CoverPic { get; set; }
    public string DietaryFocus { get; set; } = "Culinary Adventurer";
    public string Rank { get; set; } = "Home Cook";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
