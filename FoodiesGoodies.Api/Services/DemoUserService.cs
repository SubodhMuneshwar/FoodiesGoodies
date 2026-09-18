using System.Security.Claims;
using FoodiesGoodies.Api.DTOs;
using FoodiesGoodies.Api.Models;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;

namespace FoodiesGoodies.Api.Services;

public class DemoUserService : IDemoUserService
{
    private const string DemoEmail = "demo@foodiesgoodies.local";
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly SignInManager<ApplicationUser> _signInManager;
    private readonly ILogger<DemoUserService> _logger;

    public DemoUserService(
        UserManager<ApplicationUser> userManager,
        SignInManager<ApplicationUser> signInManager,
        ILogger<DemoUserService> logger)
    {
        _userManager = userManager;
        _signInManager = signInManager;
        _logger = logger;
    }

    public async Task<(ApplicationUser User, UserProfileDto Profile)> GetOrProvisionDemoUserAsync()
    {
        ApplicationUser? demoUser = null;

        try
        {
            demoUser = await _userManager.FindByEmailAsync(DemoEmail);

            if (demoUser == null)
            {
                demoUser = new ApplicationUser
                {
                    UserName = DemoEmail,
                    Email = DemoEmail,
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
                    _logger.LogWarning("Could not persist demo user to database: {Errors}",
                        string.Join(", ", createResult.Errors.Select(e => e.Description)));
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning("Database unreachable during demo user lookup, using in-memory demo principal: {Message}", ex.Message);
            demoUser = new ApplicationUser
            {
                Id = "demo_ephemeral_user",
                UserName = DemoEmail,
                Email = DemoEmail,
                DisplayName = "Demo Foodie",
                Rank = "Head Baker",
                DietaryFocus = "Mediterranean & Sourdough",
                Bio = "Passionate community baker and sourdough enthusiast exploring Foodies Goodies!",
                ProfilePic = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
        }

        var profile = new UserProfileDto
        {
            Id = demoUser.Id,
            Username = demoUser.DisplayName ?? "Demo Foodie",
            DisplayName = demoUser.DisplayName ?? "Demo Foodie",
            Handle = "@demo_foodie",
            Email = demoUser.Email ?? DemoEmail,
            Avatar = demoUser.ProfilePic,
            Bio = demoUser.Bio,
            DietaryFocus = demoUser.DietaryFocus,
            Rank = demoUser.Rank,
            MemberSince = demoUser.CreatedAt
        };

        return (demoUser, profile);
    }

    public async Task SignInDemoUserAsync(HttpContext httpContext, ApplicationUser user)
    {
        try
        {
            await _signInManager.SignInAsync(user, isPersistent: true);
        }
        catch (Exception ex)
        {
            _logger.LogWarning("SignInManager failed, issuing application cookie directly: {Message}", ex.Message);
            var claims = new List<Claim>
            {
                new(ClaimTypes.NameIdentifier, user.Id),
                new(ClaimTypes.Name, user.DisplayName ?? "Demo Foodie"),
                new(ClaimTypes.Email, user.Email ?? DemoEmail)
            };
            var identity = new ClaimsIdentity(claims, IdentityConstants.ApplicationScheme);
            var principal = new ClaimsPrincipal(identity);
            await httpContext.SignInAsync(
                IdentityConstants.ApplicationScheme,
                principal,
                new AuthenticationProperties { IsPersistent = true });
        }
    }
}
