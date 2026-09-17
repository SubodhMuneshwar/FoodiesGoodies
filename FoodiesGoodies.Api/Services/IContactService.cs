using FoodiesGoodies.Api.DTOs;

namespace FoodiesGoodies.Api.Services;

public interface IContactService
{
    Task<ApiResponse> SendInquiryAsync(ContactRequest request, CancellationToken cancellationToken = default);
}
