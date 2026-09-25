using FoodiesGoodies.Api.DTOs.Diet;

namespace FoodiesGoodies.Api.Services.Diet;

public interface INutritionCalculatorService
{
    NutritionTargetsDto CalculateTargets(DietPlanRequest request);
}
