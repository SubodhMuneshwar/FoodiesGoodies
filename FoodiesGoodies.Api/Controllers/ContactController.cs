using FoodiesGoodies.Api.DTOs;
using FoodiesGoodies.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace FoodiesGoodies.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ContactController : ControllerBase
{
    private readonly IContactService _contactService;
    private readonly ILogger<ContactController> _logger;

    public ContactController(IContactService contactService, ILogger<ContactController> logger)
    {
        _contactService = contactService;
        _logger = logger;
    }

    /// <summary>
    /// Processes a customer inquiry and forwards it via MailKit SMTP.
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> SubmitInquiry([FromBody] ContactRequest request, CancellationToken cancellationToken)
    {
        if (!ModelState.IsValid)
        {
            var errors = string.Join("; ", ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage));
            return BadRequest(ApiResponse.Fail(errors));
        }

        var result = await _contactService.SendInquiryAsync(request, cancellationToken);
        if (!result.Success)
        {
            return BadRequest(result);
        }

        return Ok(result);
    }
}
