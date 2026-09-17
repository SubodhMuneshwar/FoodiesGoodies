using FoodiesGoodies.Api.DTOs;
using FoodiesGoodies.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace FoodiesGoodies.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly SignInManager<ApplicationUser> _signInManager;
    private readonly ILogger<AuthController> _logger;

    public AuthController(
        UserManager<ApplicationUser> userManager,
        SignInManager<ApplicationUser> signInManager,
        ILogger<AuthController> logger)
    {
        _userManager = userManager;
        _signInManager = signInManager;
        _logger = logger;
    }

    /// <summary>
    /// Registers a new foodie account and issues a secure authentication cookie.
    /// </summary>
    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request)
    {
        if (!ModelState.IsValid)
        {
            var errors = string.Join("; ", ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage));
            return BadRequest(AuthResponse.Fail(errors));
        }

        var cleanEmail = request.Email.Trim().ToLowerInvariant();
        var cleanUsername = request.Username.Trim();

        var existingUser = await _userManager.FindByEmailAsync(cleanEmail);
        if (existingUser != null)
        {
            return Conflict(AuthResponse.Fail("An account with this email address already exists."));
        }

        var user = new ApplicationUser
        {
            UserName = cleanEmail, // Use email as unique login username in Identity
            Email = cleanEmail,
            DisplayName = cleanUsername,
            Rank = "Home Cook",
            DietaryFocus = "Culinary Adventurer",
            ProfilePic = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        var result = await _userManager.CreateAsync(user, request.Password);
        if (!result.Succeeded)
        {
            var errorDetails = string.Join(", ", result.Errors.Select(e => e.Description));
            _logger.LogWarning("Registration failed for {Email}: {Errors}", cleanEmail, errorDetails);
            return BadRequest(AuthResponse.Fail($"Registration failed: {errorDetails}"));
        }

        // Sign the user in immediately with authentication cookie
        await _signInManager.SignInAsync(user, isPersistent: true);

        _logger.LogInformation("New user registered and signed in: {Email}", cleanEmail);

        var profile = MapToProfileDto(user);
        return Ok(AuthResponse.Ok(profile, "Registration successful! Welcome to Foodies Goodies."));
    }

    /// <summary>
    /// Authenticates a foodie account and sets the persistent authentication cookie.
    /// </summary>
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        if (!ModelState.IsValid)
        {
            var errors = string.Join("; ", ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage));
            return BadRequest(AuthResponse.Fail(errors));
        }

        var cleanEmail = request.Email.Trim().ToLowerInvariant();
        var user = await _userManager.FindByEmailAsync(cleanEmail);
        if (user == null)
        {
            _logger.LogWarning("Login attempt for non-existent user {Email}", cleanEmail);
            return Unauthorized(AuthResponse.Fail("Invalid email or password."));
        }

        var signInResult = await _signInManager.PasswordSignInAsync(
            user.UserName!,
            request.Password,
            isPersistent: request.RememberMe,
            lockoutOnFailure: false);

        if (!signInResult.Succeeded)
        {
            _logger.LogWarning("Invalid password attempt for {Email}", cleanEmail);
            return Unauthorized(AuthResponse.Fail("Invalid email or password."));
        }

        _logger.LogInformation("User logged in successfully: {Email}", cleanEmail);

        var profile = MapToProfileDto(user);
        return Ok(AuthResponse.Ok(profile, "Welcome back to Foodies Goodies!"));
    }

    /// <summary>
    /// Signs the current user out and clears the authentication cookie.
    /// </summary>
    [HttpPost("logout")]
    public async Task<IActionResult> Logout()
    {
        await _signInManager.SignOutAsync();
        return Ok(ApiResponse.Ok("You have been signed out successfully."));
    }

    /// <summary>
    /// Returns the currently authenticated user's profile or 401 Unauthorized.
    /// </summary>
    [HttpGet("me")]
    public async Task<IActionResult> GetCurrentUser()
    {
        if (!User.Identity?.IsAuthenticated ?? true)
        {
            return Unauthorized(ApiResponse<UserProfileDto?>.Fail("Not authenticated."));
        }

        var user = await _userManager.GetUserAsync(User);
        if (user == null)
        {
            return Unauthorized(ApiResponse<UserProfileDto?>.Fail("User session not found."));
        }

        var profile = MapToProfileDto(user);
        return Ok(ApiResponse<UserProfileDto>.Ok(profile));
    }

    private static UserProfileDto MapToProfileDto(ApplicationUser user)
    {
        var display = string.IsNullOrWhiteSpace(user.DisplayName)
            ? user.Email?.Split('@')[0] ?? "Foodie"
            : user.DisplayName;

        var handle = "@" + display.ToLowerInvariant().Replace(" ", "_");

        return new UserProfileDto
        {
            Id = user.Id,
            Username = display,
            DisplayName = display,
            Handle = handle,
            Email = user.Email ?? string.Empty,
            Avatar = user.ProfilePic,
            Bio = user.Bio,
            DietaryFocus = user.DietaryFocus,
            Rank = user.Rank,
            MemberSince = user.CreatedAt
        };
    }
}
