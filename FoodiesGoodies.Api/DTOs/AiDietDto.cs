using System.Text.Json.Serialization;

namespace FoodiesGoodies.Api.DTOs;

public class AiDietPlanRequest
{
    public int Age { get; set; } = 25;
    public string Gender { get; set; } = "female";
    public double Height { get; set; } = 165; // in cm
    public double Weight { get; set; } = 65;  // in kg
    public double ActivityLevel { get; set; } = 1.375; // multiplier
    public string Goal { get; set; } = "maintain"; // loss, maintain, muscle, energy
    public string DietPreference { get; set; } = "omnivore"; // omnivore, vegetarian, vegan, keto, pescatarian
    public string CuisineRegion { get; set; } = "india-pan"; // india-pan, india-north, india-south, india-sattvic, mediterranean, japan, korea, mexico, middle-east, north-america, global
    public List<string> Allergies { get; set; } = new();
    public int MealCount { get; set; } = 4; // 3, 4, 2
    public string? ClientApiKey { get; set; } // Optional user-provided testing key
}

public class BiometricsSummaryDto
{
    [JsonPropertyName("bmr")]
    public int Bmr { get; set; }

    [JsonPropertyName("tdee")]
    public int Tdee { get; set; }

    [JsonPropertyName("targetCalories")]
    public int TargetCalories { get; set; }

    [JsonPropertyName("proteinGrams")]
    public int ProteinGrams { get; set; }

    [JsonPropertyName("carbsGrams")]
    public int CarbsGrams { get; set; }

    [JsonPropertyName("fatGrams")]
    public int FatGrams { get; set; }

    [JsonPropertyName("waterLiters")]
    public double WaterLiters { get; set; }

    [JsonPropertyName("waterOz")]
    public int WaterOz { get; set; }

    [JsonPropertyName("goalLabel")]
    public string GoalLabel { get; set; } = string.Empty;
}

public class AiMealItemDto
{
    [JsonPropertyName("category")]
    public string Category { get; set; } = string.Empty;

    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;

    [JsonPropertyName("calories")]
    public int Calories { get; set; }

    [JsonPropertyName("proteinGrams")]
    public int ProteinGrams { get; set; }

    [JsonPropertyName("carbsGrams")]
    public int CarbsGrams { get; set; }

    [JsonPropertyName("fatGrams")]
    public int FatGrams { get; set; }

    [JsonPropertyName("description")]
    public string Description { get; set; } = string.Empty;

    [JsonPropertyName("ingredients")]
    public List<string> Ingredients { get; set; } = new();

    [JsonPropertyName("chefTip")]
    public string ChefTip { get; set; } = string.Empty;
}

public class GroceryCategoryDto
{
    [JsonPropertyName("category")]
    public string Category { get; set; } = string.Empty;

    [JsonPropertyName("items")]
    public List<string> Items { get; set; } = new();
}

public class AiDietPlanResponse
{
    [JsonPropertyName("success")]
    public bool Success { get; set; } = true;

    [JsonPropertyName("source")]
    public string Source { get; set; } = "Gemini AI Agent";

    [JsonPropertyName("model")]
    public string Model { get; set; } = "gemini-1.5-flash";

    [JsonPropertyName("cuisineTitle")]
    public string CuisineTitle { get; set; } = string.Empty;

    [JsonPropertyName("cuisineFlag")]
    public string CuisineFlag { get; set; } = "🍽️";

    [JsonPropertyName("culturalRationale")]
    public string CulturalRationale { get; set; } = string.Empty;

    [JsonPropertyName("biometrics")]
    public BiometricsSummaryDto Biometrics { get; set; } = new();

    [JsonPropertyName("meals")]
    public List<AiMealItemDto> Meals { get; set; } = new();

    [JsonPropertyName("groceryList")]
    public List<GroceryCategoryDto> GroceryList { get; set; } = new();

    [JsonPropertyName("culturalDigestiveTip")]
    public string CulturalDigestiveTip { get; set; } = string.Empty;

    [JsonPropertyName("disclaimer")]
    public string Disclaimer { get; set; } = "Nutritional suggestions are computed via Mifflin-St Jeor guidelines. Please consult a registered medical dietitian before beginning specialized dietary regimens.";
}

public class CuisineInfoDto
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Country { get; set; } = string.Empty;
    public string Flag { get; set; } = "🍽️";
    public string Description { get; set; } = string.Empty;
    public string StapleGrainsAndProteins { get; set; } = string.Empty;
    public string KeySpices { get; set; } = string.Empty;
}
