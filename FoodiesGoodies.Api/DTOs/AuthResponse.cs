namespace FoodiesGoodies.Api.DTOs;

public class AuthResponse
{
    public bool Success { get; set; } = true;
    public string Message { get; set; } = string.Empty;
    public UserProfileDto? User { get; set; }

    public static AuthResponse Ok(UserProfileDto user, string message) => new()
    {
        Success = true,
        Message = message,
        User = user
    };

    public static AuthResponse Fail(string message) => new()
    {
        Success = false,
        Message = message,
        User = null
    };
}
