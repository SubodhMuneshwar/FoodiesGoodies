using FluentValidation;
using FluentValidation.AspNetCore;
using FoodiesGoodies.Api.Configuration;
using FoodiesGoodies.Api.Data;
using FoodiesGoodies.Api.DTOs;
using FoodiesGoodies.Api.Middleware;
using FoodiesGoodies.Api.Models;
using FoodiesGoodies.Api.Services;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);

// 1. Database & EF Core
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? throw new InvalidOperationException("Connection string 'DefaultConnection' not configured in appsettings.json or environment.");

builder.Services.AddDbContext<FoodiesGoodiesDbContext>(options =>
{
    // Use fixed MySQL 8.0 server version to allow schema generation/migrations without live server dependency
    options.UseMySql(connectionString, new MySqlServerVersion(new Version(8, 0, 36)), mySqlOptions =>
    {
        mySqlOptions.EnableRetryOnFailure(maxRetryCount: 1, maxRetryDelay: TimeSpan.FromSeconds(1), errorNumbersToAdd: null);
    });
});

// 2. ASP.NET Core Identity & Cookie Authentication (Hardened Password Policy & Lockout)
builder.Services.AddIdentity<ApplicationUser, IdentityRole>(options =>
{
    options.Password.RequireDigit = true;
    options.Password.RequireLowercase = true;
    options.Password.RequireNonAlphanumeric = true;
    options.Password.RequireUppercase = true;
    options.Password.RequiredLength = 8;
    options.User.RequireUniqueEmail = true;
    options.SignIn.RequireConfirmedAccount = false;
    options.Lockout.MaxFailedAccessAttempts = 5;
    options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(15);
})
.AddEntityFrameworkStores<FoodiesGoodiesDbContext>()
.AddDefaultTokenProviders();

builder.Services.ConfigureApplicationCookie(options =>
{
    options.Cookie.Name = "FoodiesGoodies.Auth";
    options.Cookie.HttpOnly = true;
    options.Cookie.SameSite = SameSiteMode.Lax;
    options.Cookie.SecurePolicy = CookieSecurePolicy.SameAsRequest;
    options.ExpireTimeSpan = TimeSpan.FromDays(7);
    options.SlidingExpiration = true;

    // Return 401 Unauthorized for API requests rather than an HTML login redirect
    options.Events.OnRedirectToLogin = context =>
    {
        if (context.Request.Path.StartsWithSegments("/api"))
        {
            context.Response.StatusCode = StatusCodes.Status401Unauthorized;
            return Task.CompletedTask;
        }
        context.Response.Redirect(context.RedirectUri);
        return Task.CompletedTask;
    };

    options.Events.OnRedirectToAccessDenied = context =>
    {
        if (context.Request.Path.StartsWithSegments("/api"))
        {
            context.Response.StatusCode = StatusCodes.Status403Forbidden;
            return Task.CompletedTask;
        }
        context.Response.Redirect(context.RedirectUri);
        return Task.CompletedTask;
    };
});

// 3. CORS Policy
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins(
                "http://localhost:5258",
                "https://localhost:7258",
                "http://127.0.0.1:5258",
                "http://localhost:5500",
                "http://127.0.0.1:5500",
                "http://localhost:3000",
                "http://127.0.0.1:3000",
                "http://localhost:8080",
                "http://127.0.0.1:8080")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

// 4. Typed HttpClient for Edamam Recipe Cloud
builder.Services.Configure<EdamamOptions>(builder.Configuration.GetSection(EdamamOptions.SectionName));
builder.Services.AddHttpClient<IRecipeService, RecipeService>(client =>
{
    client.Timeout = TimeSpan.FromSeconds(10);
    client.DefaultRequestHeaders.Add("User-Agent", "FoodiesGoodies-Api/1.0");
});

// 5. Application Services
builder.Services.Configure<SmtpOptions>(builder.Configuration.GetSection(SmtpOptions.SectionName));
builder.Services.AddScoped<IContactService, ContactService>();
builder.Services.AddScoped<IDemoUserService, DemoUserService>();

// 6. FluentValidation & Uniform API Response Formatting
builder.Services.AddFluentValidationAutoValidation();
builder.Services.AddValidatorsFromAssemblyContaining<Program>();

builder.Services.Configure<ApiBehaviorOptions>(options =>
{
    options.InvalidModelStateResponseFactory = context =>
    {
        var errors = string.Join("; ", context.ModelState.Values
            .SelectMany(v => v.Errors)
            .Select(e => e.ErrorMessage));
        return new BadRequestObjectResult(ApiResponse.Fail(errors));
    };
});

// 7. MVC Controllers & Swagger
builder.Services.Configure<RouteOptions>(options => options.LowercaseUrls = true);
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "Foodies Goodies Web API",
        Version = "v1",
        Description = "ASP.NET Core Web API backend powering FoodiesGoodies social kitchen, recipe discovery, and user authentication."
    });
});

var app = builder.Build();

// Startup validation check for CursorSigningKey
var cursorSigningKey = builder.Configuration["Edamam:CursorSigningKey"];
if (string.IsNullOrWhiteSpace(cursorSigningKey) || cursorSigningKey.Length < 32)
{
    app.Logger.LogWarning("Security Warning: Edamam:CursorSigningKey is empty or shorter than 32 characters. Configure via User Secrets or environment variables.");
}

// 8. Global Exception Handling Middleware
app.UseMiddleware<ExceptionHandlingMiddleware>();

// 9. Swagger Documentation in Development
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "Foodies Goodies API v1");
    });
}

// 10. Static Frontend Serving (from wwwroot)
app.UseDefaultFiles();
app.UseStaticFiles();

// 11. CORS & Routing
app.UseCors();
app.UseRouting();

// 12. Authentication & Authorization
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();

// Expose Program class for integration tests (WebApplicationFactory<Program>)
public partial class Program { }
