using FoodiesGoodies.Api.DTOs;

namespace FoodiesGoodies.Api.Services;

public interface IAiDietService
{
    Task<AiDietPlanResponse> GenerateDietPlanAsync(AiDietPlanRequest request, CancellationToken cancellationToken = default);
    IReadOnlyList<CuisineInfoDto> GetSupportedCuisines();
    BiometricsSummaryDto CalculateBiometrics(AiDietPlanRequest request);
}
