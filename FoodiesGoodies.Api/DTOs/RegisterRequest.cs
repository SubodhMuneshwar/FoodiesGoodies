using System.ComponentModel.DataAnnotations;

namespace FoodiesGoodies.Api.DTOs;

public class RegisterRequest
{
    [Required(ErrorMessage = "Username is required.")]
    [StringLength(50, MinimumLength = 2, ErrorMessage = "Username must be between 2 and 50 characters.")]
    public string Username { get; set; } = string.Empty;

    [Required(ErrorMessage = "Email is required.")]
    [EmailAddress(ErrorMessage = "Please enter a valid email address.")]
    [StringLength(255, ErrorMessage = "Email cannot exceed 255 characters.")]
    public string Email { get; set; } = string.Empty;

    [Required(ErrorMessage = "Password is required.")]
    [StringLength(100, MinimumLength = 6, ErrorMessage = "Password must be at least 6 characters.")]
    public string Password { get; set; } = string.Empty;
}
