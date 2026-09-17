using System.Net;
using System.Text.Json;
using FoodiesGoodies.Api.DTOs;

namespace FoodiesGoodies.Api.Middleware;

public class ExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;

    public ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(ex, "Client validation error: {Message}", ex.Message);
            await HandleExceptionAsync(context, HttpStatusCode.BadRequest, ex.Message);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Invalid operation requested: {Message}", ex.Message);
            await HandleExceptionAsync(context, HttpStatusCode.BadRequest, ex.Message);
        }
        catch (TimeoutException ex)
        {
            _logger.LogError(ex, "Service timeout: {Message}", ex.Message);
            await HandleExceptionAsync(context, HttpStatusCode.GatewayTimeout, "The requested culinary service timed out. Please try again.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unhandled server error processing path '{Path}'", context.Request.Path);
            await HandleExceptionAsync(context, HttpStatusCode.InternalServerError, "An unexpected server error occurred. Please try again later.");
        }
    }

    private static Task HandleExceptionAsync(HttpContext context, HttpStatusCode statusCode, string message)
    {
        context.Response.ContentType = "application/json";
        context.Response.StatusCode = (int)statusCode;

        var response = ApiResponse.Fail(message);
        var json = JsonSerializer.Serialize(response);
        return context.Response.WriteAsync(json);
    }
}
