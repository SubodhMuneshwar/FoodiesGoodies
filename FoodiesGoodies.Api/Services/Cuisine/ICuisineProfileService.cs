using FoodiesGoodies.Api.DTOs.Diet;

namespace FoodiesGoodies.Api.Services.Cuisine;

public interface ICuisineProfileService
{
    CuisineContextDto ResolveProfile(string? country, string? region, string? cuisine);
    IReadOnlyList<CuisineContextDto> GetAllProfiles();
    IReadOnlyList<string> GetSupportedCountries();
}
