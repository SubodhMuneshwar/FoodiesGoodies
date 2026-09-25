using System.Reflection;
using FoodiesGoodies.Api.DTOs.Diet;
using Xunit;

namespace FoodiesGoodies.Tests.Ai;

public class SecurityTests
{
    [Fact]
    public void DietPlanRequest_DoesNotContainAnyApiKeyProperties()
    {
        var properties = typeof(DietPlanRequest).GetProperties(BindingFlags.Public | BindingFlags.Instance);
        var propertyNames = properties.Select(p => p.Name.ToLowerInvariant()).ToList();

        Assert.DoesNotContain("clientapikey", propertyNames);
        Assert.DoesNotContain("apikey", propertyNames);
        Assert.DoesNotContain("geminikey", propertyNames);
        Assert.DoesNotContain("key", propertyNames);
    }

    [Fact]
    public void DietPlanResponse_DoesNotContainAnySecretOrCredentialProperties()
    {
        var properties = typeof(DietPlanResponse).GetProperties(BindingFlags.Public | BindingFlags.Instance);
        var propertyNames = properties.Select(p => p.Name.ToLowerInvariant()).ToList();

        Assert.DoesNotContain("apikey", propertyNames);
        Assert.DoesNotContain("geminikey", propertyNames);
        Assert.DoesNotContain("secret", propertyNames);
        Assert.DoesNotContain("password", propertyNames);
    }
}
