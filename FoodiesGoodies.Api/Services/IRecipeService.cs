using FoodiesGoodies.Api.DTOs;

namespace FoodiesGoodies.Api.Services;

public interface IRecipeService
{
    Task<RecipeSearchResponse> SearchRecipesAsync(string query, CancellationToken cancellationToken = default);
    Task<RecipeSearchResponse> GetNextPageAsync(string cursor, CancellationToken cancellationToken = default);
}
