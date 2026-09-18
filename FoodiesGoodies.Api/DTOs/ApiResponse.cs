namespace FoodiesGoodies.Api.DTOs;

public class ApiResponse<T>
{
    public bool Success { get; set; } = true;
    public string Message { get; set; } = string.Empty;
    public T? Data { get; set; }

    [System.Text.Json.Serialization.JsonIgnore(Condition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull)]
    public T? User => typeof(T) == typeof(UserProfileDto) ? Data : default;

    public static ApiResponse<T> Ok(T data, string message = "") => new()
    {
        Success = true,
        Message = message,
        Data = data
    };

    public static ApiResponse<T> Fail(string message, T? data = default) => new()
    {
        Success = false,
        Message = message,
        Data = data
    };
}

public class ApiResponse
{
    public bool Success { get; set; } = true;
    public string Message { get; set; } = string.Empty;

    public static ApiResponse Ok(string message = "") => new()
    {
        Success = true,
        Message = message
    };

    public static ApiResponse Fail(string message) => new()
    {
        Success = false,
        Message = message
    };
}
