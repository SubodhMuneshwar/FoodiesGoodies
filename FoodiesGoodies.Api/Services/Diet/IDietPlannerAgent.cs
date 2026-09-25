using FoodiesGoodies.Api.DTOs.Diet;

namespace FoodiesGoodies.Api.Services.Diet;

public interface IDietPlannerAgent
{
    Task<DietPlanResponse> GenerateDietPlanAsync(DietPlanRequest request, CancellationToken cancellationToken = default);
    Task<MealSwapResponse> SwapSingleMealAsync(MealSwapRequest request, CancellationToken cancellationToken = default);
}
