using FoodiesGoodies.Api.DTOs.Diet;

namespace FoodiesGoodies.Api.Services.Diet;

public class DietPlanValidationResult
{
    public bool IsValid => Errors.Count == 0;
    public List<string> Errors { get; set; } = new();
    public List<string> Warnings { get; set; } = new();
}

public interface IDietPlanValidator
{
    DietPlanValidationResult ValidatePlan(DietPlanResponse plan, DietPlanRequest request, NutritionTargetsDto targets);
}
