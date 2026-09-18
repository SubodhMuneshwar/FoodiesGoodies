using FoodiesGoodies.Api.DTOs;
using FoodiesGoodies.Api.Models;
using Microsoft.AspNetCore.Http;

namespace FoodiesGoodies.Api.Services;

public interface IDemoUserService
{
    Task<(ApplicationUser User, UserProfileDto Profile)> GetOrProvisionDemoUserAsync();
    Task SignInDemoUserAsync(HttpContext httpContext, ApplicationUser user);
}
