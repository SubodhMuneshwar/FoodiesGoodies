using FoodiesGoodies.Api.Services.Cuisine;
using Xunit;

namespace FoodiesGoodies.Tests.Ai;

public class CuisineProfileServiceTests
{
    private readonly CuisineProfileService _service = new();

    [Fact]
    public void ResolveProfile_ResolvesMaharashtrianCuisineAccurately()
    {
        var profile = _service.ResolveProfile("India", "Maharashtra", "Maharashtrian");

        Assert.NotNull(profile);
        Assert.Equal("Maharashtrian", profile.Name);
        Assert.Equal("Maharashtra", profile.Region);
        Assert.Equal("India", profile.Country);
        Assert.Contains("Jowar", profile.StapleGrainsAndProteins);
        Assert.Contains("Goda Masala", profile.KeySpices);
    }

    [Fact]
    public void ResolveProfile_ResolvesPunjabiNorthIndianAccurately()
    {
        var profile = _service.ResolveProfile("India", "Punjab", "North Indian");

        Assert.NotNull(profile);
        Assert.Equal("North Indian", profile.Name);
        Assert.Contains("Paneer", profile.StapleGrainsAndProteins);
        Assert.Contains("Kasuri Methi", profile.KeySpices);
    }

    [Fact]
    public void ResolveProfile_CountryAndCuisineSeparation_AllowsLivingInCanadaWithIndianCuisine()
    {
        // User living in Canada requesting Maharashtrian or Indian cuisine
        var profile = _service.ResolveProfile("Canada", "Ontario", "Maharashtrian");

        Assert.NotNull(profile);
        Assert.Equal("Canada", profile.Country); // Preserves user's country of residence
        Assert.Equal("Ontario", profile.Region);
        Assert.Equal("Maharashtrian", profile.Name); // Preserves requested culinary heritage
        Assert.Contains("Jowar", profile.StapleGrainsAndProteins);
    }

    [Fact]
    public void ResolveProfile_ResolvesJapaneseWashoku()
    {
        var profile = _service.ResolveProfile("Japan", "Tokyo", "Japanese");

        Assert.NotNull(profile);
        Assert.Contains("Japanese", profile.Name);
        Assert.Contains("Miso", profile.StapleGrainsAndProteins);
    }

    [Fact]
    public void ResolveProfile_ResolvesMediterranean()
    {
        var profile = _service.ResolveProfile("Greece", "Crete", "Mediterranean");

        Assert.NotNull(profile);
        Assert.Contains("Mediterranean", profile.Name);
        Assert.Contains("Olive Oil", profile.KeySpices);
    }

    [Fact]
    public void GetAllProfiles_ReturnsRichCulturalCatalog()
    {
        var profiles = _service.GetAllProfiles();

        Assert.NotEmpty(profiles);
        Assert.True(profiles.Count >= 10);
        Assert.Contains(profiles, p => p.Name.Contains("Maharashtrian"));
        Assert.Contains(profiles, p => p.Name.Contains("South Indian"));
        Assert.Contains(profiles, p => p.Name.Contains("Japanese"));
        Assert.Contains(profiles, p => p.Name.Contains("Mexican"));
    }
}
