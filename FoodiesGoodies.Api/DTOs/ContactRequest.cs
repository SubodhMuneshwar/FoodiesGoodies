using System.ComponentModel.DataAnnotations;

namespace FoodiesGoodies.Api.DTOs;

public class ContactRequest
{
    [Required(ErrorMessage = "Please enter your full name.")]
    [StringLength(100, MinimumLength = 2, ErrorMessage = "Name must be between 2 and 100 characters.")]
    public string Name { get; set; } = string.Empty;

    [Required(ErrorMessage = "Please enter your email address.")]
    [EmailAddress(ErrorMessage = "Please enter a valid email address.")]
    [StringLength(255, ErrorMessage = "Email cannot exceed 255 characters.")]
    public string Email { get; set; } = string.Empty;

    [Required(ErrorMessage = "Please enter a message subject.")]
    [StringLength(150, MinimumLength = 3, ErrorMessage = "Subject must be between 3 and 150 characters.")]
    public string Subject { get; set; } = string.Empty;

    [Required(ErrorMessage = "Please enter your message.")]
    [StringLength(3000, MinimumLength = 10, ErrorMessage = "Message must be between 10 and 3000 characters.")]
    public string Message { get; set; } = string.Empty;
}
