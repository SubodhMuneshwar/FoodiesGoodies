using FoodiesGoodies.Api.DTOs.Diet;

namespace FoodiesGoodies.Api.Services.Diet;

public interface IFallbackDietPlanner
{
    DietPlanResponse Generate7DayFallbackPlan(DietPlanRequest request, NutritionTargetsDto targets, CuisineContextDto cuisine);
    DietMealDto GenerateFallbackSwapMeal(MealSwapRequest request);
}
