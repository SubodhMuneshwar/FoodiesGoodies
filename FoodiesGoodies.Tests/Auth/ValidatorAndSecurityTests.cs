using FluentAssertions;
using FoodiesGoodies.Api.DTOs;
using FoodiesGoodies.Api.Validators;
using Xunit;

namespace FoodiesGoodies.Tests.Auth;

public class ValidatorAndSecurityTests
{
    private readonly RegisterRequestValidator _registerValidator = new();
    private readonly LoginRequestValidator _loginValidator = new();

    [Fact]
    public void RegisterValidator_StrongPassword_PassesValidation()
    {
        var model = new RegisterRequest
        {
            Username = "MasterChef",
            Email = "chef@foodiesgoodies.local",
            Password = "SecurePassword2025!"
        };

        var result = _registerValidator.Validate(model);

        result.IsValid.Should().BeTrue();
    }

    [Theory]
    [InlineData("short", "at least 8 characters")]
    [InlineData("nouppercase1!", "uppercase letter")]
    [InlineData("NOLOWERCASE1!", "lowercase letter")]
    [InlineData("NoDigitsAtAll!", "at least one digit")]
    [InlineData("NoSpecialCharacter1", "special character")]
    public void RegisterValidator_WeakPassword_FailsValidationWithSpecificMessage(string password, string expectedErrorSubstring)
    {
        var model = new RegisterRequest
        {
            Username = "MasterChef",
            Email = "chef@foodiesgoodies.local",
            Password = password
        };

        var result = _registerValidator.Validate(model);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.ErrorMessage.Contains(expectedErrorSubstring));
    }

    [Fact]
    public void LoginValidator_ValidCredentials_PassesValidation()
    {
        var model = new LoginRequest
        {
            Email = "foodie@test.com",
            Password = "ValidPassword1!"
        };

        var result = _loginValidator.Validate(model);

        result.IsValid.Should().BeTrue();
    }

    [Theory]
    [InlineData("", "ValidPassword1!")]
    [InlineData("invalid-email", "ValidPassword1!")]
    [InlineData("foodie@test.com", "")]
    public void LoginValidator_InvalidInputs_FailsValidation(string email, string password)
    {
        var model = new LoginRequest
        {
            Email = email,
            Password = password
        };

        var result = _loginValidator.Validate(model);

        result.IsValid.Should().BeFalse();
    }
}
