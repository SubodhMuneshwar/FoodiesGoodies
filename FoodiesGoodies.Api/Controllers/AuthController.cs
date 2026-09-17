using System.Security.Claims;
using FoodiesGoodies.Api.DTOs;
using FoodiesGoodies.Api.Models;
using Microsoft.AspNetCore.Authentication;
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
    /// Authenticates a demo foodie account for instant exploration and sets the authentication cookie.
    /// Provisions the demo user if not already present, with resilient offline fallback.
    /// </summary>
    [HttpPost("demo")]
    public async Task<IActionResult> DemoLogin()
    {
        const string demoEmail = "demo@foodiesgoodies.local";
        ApplicationUser? demoUser = null;

        try
        {
            demoUser = await _userManager.FindByEmailAsync(demoEmail);

            if (demoUser == null)
            {
                demoUser = new ApplicationUser
                {
                    UserName = demoEmail,
                    Email = demoEmail,
                    DisplayName = "Demo Foodie",
                    Rank = "Head Baker",
                    DietaryFocus = "Mediterranean & Sourdough",
                    Bio = "Passionate community baker and sourdough enthusiast exploring Foodies Goodies!",
                    ProfilePic = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80",
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                var createResult = await _userManager.CreateAsync(demoUser, "DemoFoodie2025!");
                if (!createResult.Succeeded)
                {
                    _logger.LogWarning("Could not persist demo user to database: {Errors}", string.Join(", ", createResult.Errors.Select(e => e.Description)));
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning("Database unreachable during demo login, using in-memory demo principal: {Message}", ex.Message);
            demoUser = new ApplicationUser
            {
                Id = "demo_ephemeral_user",
                UserName = demoEmail,
                Email = demoEmail,
                DisplayName = "Demo Foodie",
                Rank = "Head Baker",
                DietaryFocus = "Mediterranean & Sourdough",
                Bio = "Passionate community baker and sourdough enthusiast exploring Foodies Goodies!",
                ProfilePic = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
        }

        try
        {
            await _signInManager.SignInAsync(demoUser, isPersistent: true);
        }
        catch (Exception ex)
        {
            _logger.LogWarning("SignInManager failed, issuing application cookie directly: {Message}", ex.Message);
            var claims = new List<Claim>
            {
                new(ClaimTypes.NameIdentifier, demoUser.Id),
                new(ClaimTypes.Name, demoUser.DisplayName ?? "Demo Foodie"),
                new(ClaimTypes.Email, demoEmail)
            };
            var identity = new ClaimsIdentity(claims, IdentityConstants.ApplicationScheme);
            var principal = new ClaimsPrincipal(identity);
            await HttpContext.SignInAsync(IdentityConstants.ApplicationScheme, principal, new AuthenticationProperties { IsPersistent = true });
        }

        _logger.LogInformation("Demo user logged in successfully: {Email}", demoEmail);
        var profile = MapToProfileDto(demoUser);
        return Ok(AuthResponse.Ok(profile, "Welcome to the Foodies Goodies interactive demo kitchen!"));
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

        ApplicationUser? user = null;
        try
        {
            user = await _userManager.GetUserAsync(User);
        }
        catch (Exception ex)
        {
            _logger.LogWarning("Database lookup failed in GetCurrentUser: {Message}", ex.Message);
        }

        if (user == null)
        {
            var email = User.FindFirst(ClaimTypes.Email)?.Value
                ?? User.FindFirst(ClaimTypes.Name)?.Value;

            if (!string.IsNullOrEmpty(email) && (email.Contains("demo") || email.Contains("test")))
            {
                var demoProfile = new UserProfileDto
                {
                    Id = "demo_ephemeral_user",
                    Username = "Demo Foodie",
                    DisplayName = "Demo Foodie",
                    Handle = "@demo_foodie",
                    Email = email,
                    Avatar = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80",
                    Bio = "Passionate community baker and sourdough enthusiast exploring Foodies Goodies!",
                    DietaryFocus = "Mediterranean & Sourdough",
                    Rank = "Head Baker",
                    MemberSince = DateTime.UtcNow
                };
                return Ok(ApiResponse<UserProfileDto>.Ok(demoProfile));
            }

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
