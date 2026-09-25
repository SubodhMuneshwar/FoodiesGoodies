using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using FoodiesGoodies.Api.Configuration;
using FoodiesGoodies.Api.DTOs;
using Microsoft.Extensions.Options;

namespace FoodiesGoodies.Api.Services;

public class GeminiDietAgentService : IAiDietService
{
    private readonly HttpClient _httpClient;
    private readonly GeminiOptions _options;
    private readonly IConfiguration _configuration;
    private readonly ILogger<GeminiDietAgentService> _logger;

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true
    };

    public GeminiDietAgentService(
        HttpClient httpClient,
        IOptions<GeminiOptions> options,
        IConfiguration configuration,
        ILogger<GeminiDietAgentService> logger)
    {
        _httpClient = httpClient;
        _options = options.Value;
        _configuration = configuration;
        _logger = logger;
    }

    public static readonly List<CuisineInfoDto> SupportedCuisines = new()
    {
        new CuisineInfoDto
        {
            Id = "india-pan",
            Name = "Pan-Indian Balanced Nutrition",
            Country = "India",
            Flag = "🇮🇳",
            Description = "Aromatic, balanced home-style Indian cuisine with lentils, roti, seasonal subzis, and gut-healthy curd.",
            StapleGrainsAndProteins = "Moong/Toor Dal, Chickpeas, Multigrain Atta, Paneer, Sprouted Legumes, Chicken",
            KeySpices = "Turmeric, Cumin, Coriander, Ginger, Curry Leaves, Mustard Seeds"
        },
        new CuisineInfoDto
        {
            Id = "india-north",
            Name = "North Indian Vitality & Spices",
            Country = "India",
            Flag = "🇮🇳",
            Description = "Rich, wholesome North Indian fare featuring tandoori grills, hearty dals, chillas, paneer, and fragrant masalas.",
            StapleGrainsAndProteins = "Besan (Gram Flour), Wheat Phulkas, Rajma, Paneer, Lean Chicken, Greek Curd",
            KeySpices = "Garam Masala, Kasuri Methi, Ginger, Garlic, Cumin, Green Chillies"
        },
        new CuisineInfoDto
        {
            Id = "india-south",
            Name = "South Indian Coastal & Fermented",
            Country = "India",
            Flag = "🇮🇳",
            Description = "Gut-friendly fermented batters, aromatic lentil sambars, steamed idlis, ragi dosas, and coastal fish curries.",
            StapleGrainsAndProteins = "Ragi, Parboiled Rice, Urad Dal, Coconut, Sambar Dal, Coastal Fish, Egg",
            KeySpices = "Curry Leaves, Mustard Seeds, Black Pepper, Tamarind, Asafetida, Turmeric"
        },
        new CuisineInfoDto
        {
            Id = "india-sattvic",
            Name = "Ayurvedic Sattvic Pure Vegetarian",
            Country = "India",
            Flag = "🇮🇳",
            Description = "Mindful, clean Ayurvedic cuisine without onion or garlic. Focuses on digestible mung dal, ghee, and fresh squash.",
            StapleGrainsAndProteins = "Mung Dal, Ash Gourd, Cow Ghee, Soaked Almonds, Quinoa, Seasonal Squash",
            KeySpices = "Cumin, Coriander, Fennel, Cardamom, Fresh Turmeric, Rock Salt"
        },
        new CuisineInfoDto
        {
            Id = "mediterranean",
            Name = "Mediterranean Blue-Zone Vitality",
            Country = "Greece & Italy",
            Flag = "🇬🇷 🇮🇹",
            Description = "Heart-healthy culinary gold standard: cold-pressed olive oil, wild fish, tomatoes, feta, and ancient grains.",
            StapleGrainsAndProteins = "Wild Salmon/Cod, Chickpeas, Lentils, Greek Yogurt, Farro, Walnuts",
            KeySpices = "Extra Virgin Olive Oil, Oregano, Rosemary, Lemon Zest, Garlic, Basil"
        },
        new CuisineInfoDto
        {
            Id = "japan",
            Name = "Japanese Washoku & Longevity",
            Country = "Japan",
            Flag = "🇯🇵",
            Description = "Harmonious, clean Washoku meals featuring fermented miso, dashi broths, seaweed, steamed fish, and edamame.",
            StapleGrainsAndProteins = "Miso, Firm Tofu, Edamame, Wild Salmon, Buckwheat Soba, Brown Rice",
            KeySpices = "Dashi, Ginger, Sesame Seeds, Seaweed (Nori/Wakame), Green Tea (Matcha)"
        },
        new CuisineInfoDto
        {
            Id = "korea",
            Name = "Korean Hansik & Fermented Power",
            Country = "South Korea",
            Flag = "🇰🇷",
            Description = "Metabolism-boosting Korean cuisine rich in fermented kimchi, bibimbap vegetable bowls, and lean braised proteins.",
            StapleGrainsAndProteins = "Tofu, Boiled Egg, Lean Beef/Chicken, Kimchi, Brown Rice, Perilla Seeds",
            KeySpices = "Gochugaru, Garlic, Toasted Sesame Oil, Fermented Doenjang, Scallions"
        },
        new CuisineInfoDto
        {
            Id = "mexico",
            Name = "Latin American & Traditional Mexican",
            Country = "Mexico",
            Flag = "🇲🇽",
            Description = "Fresh, vibrant Mexican traditions: slow-simmered black beans, handmade corn tortillas, fresh avocado, and lime.",
            StapleGrainsAndProteins = "Black/Pinto Beans, Corn Tortillas, Grilled Chicken, Avocado, Queso Fresco",
            KeySpices = "Cumin, Fresh Lime, Cilantro, Jalapeno, Oregano, Smoked Paprika"
        },
        new CuisineInfoDto
        {
            Id = "middle-east",
            Name = "Middle Eastern Levant & Mezze",
            Country = "Lebanon & Levant",
            Flag = "🇱🇧",
            Description = "Aromatic, fiber-rich Levantine nutrition: freshly whipped hummus, za'atar, labneh, shakshuka, and grilled skewers.",
            StapleGrainsAndProteins = "Hummus, Chickpeas, Labneh, Bulgur, Grilled Chicken Shish, Pine Nuts",
            KeySpices = "Za'atar, Sumac, Garlic, Lemon, Parsley, Mint, Extra Virgin Olive Oil"
        },
        new CuisineInfoDto
        {
            Id = "north-america",
            Name = "Modern American Farm-to-Table",
            Country = "United States & Canada",
            Flag = "🇺🇸 🇨🇦",
            Description = "Clean, nutrient-dense contemporary cooking: roasted sweet potatoes, sourdough, farm eggs, and fresh berries.",
            StapleGrainsAndProteins = "Pasture Eggs, Turkey, Wild Salmon, Quinoa, Sweet Potato, Steel Cut Oats",
            KeySpices = "Smoked Paprika, Black Pepper, Fresh Thyme, Garlic Herb Rub, Cinnamon"
        },
        new CuisineInfoDto
        {
            Id = "global",
            Name = "Global Culinary Explorer",
            Country = "International",
            Flag = "🌍",
            Description = "A creative world-fusion diet that harmonizes the best superfoods and cooking methods from across continents.",
            StapleGrainsAndProteins = "Quinoa, Salmon, Tofu, Lentils, Avocado, Hemp Hearts, Berries",
            KeySpices = "Turmeric, Black Pepper, Ginger, Lemon, Olive Oil, Sea Salt"
        }
    };

    public IReadOnlyList<CuisineInfoDto> GetSupportedCuisines() => SupportedCuisines;

    public BiometricsSummaryDto CalculateBiometrics(AiDietPlanRequest req)
    {
        // 1. Standardize weight and height
        double weightKg = Math.Max(25, Math.Min(350, req.Weight));
        double heightCm = Math.Max(80, Math.Min(250, req.Height));
        int age = Math.Max(14, Math.Min(100, req.Age));

        // 2. Mifflin-St Jeor Equation
        double bmr;
        string gender = (req.Gender ?? "female").ToLowerInvariant();
        if (gender == "male")
        {
            bmr = (10 * weightKg) + (6.25 * heightCm) - (5 * age) + 5;
        }
        else if (gender == "female")
        {
            bmr = (10 * weightKg) + (6.25 * heightCm) - (5 * age) - 161;
        }
        else
        {
            bmr = (10 * weightKg) + (6.25 * heightCm) - (5 * age) - 78;
        }

        // 3. TDEE with activity multiplier
        double activity = req.ActivityLevel > 0 ? req.ActivityLevel : 1.375;
        int tdee = (int)Math.Round(bmr * activity);

        // 4. Goal Adjustment
        int targetCalories = tdee;
        string goal = (req.Goal ?? "maintain").ToLowerInvariant();
        string goalLabel = "Weight Maintenance & Vitality";

        if (goal == "loss")
        {
            targetCalories = Math.Max(1200, tdee - 450);
            goalLabel = "Healthy Fat Loss";
        }
        else if (goal == "muscle")
        {
            targetCalories = tdee + 350;
            goalLabel = "Lean Muscle Building";
        }
        else if (goal == "energy")
        {
            targetCalories = tdee + 150;
            goalLabel = "High Performance & Metabolic Energy";
        }

        // 5. Macronutrient ratios
        string diet = (req.DietPreference ?? "omnivore").ToLowerInvariant();
        double proteinRatio = 0.28;
        double carbRatio = 0.47;
        double fatRatio = 0.25;

        if (diet == "keto")
        {
            proteinRatio = 0.25;
            carbRatio = 0.08;
            fatRatio = 0.67;
        }
        else if (goal == "muscle")
        {
            proteinRatio = 0.32;
            carbRatio = 0.46;
            fatRatio = 0.22;
        }
        else if (diet == "vegan" || diet == "vegetarian")
        {
            proteinRatio = 0.24;
            carbRatio = 0.52;
            fatRatio = 0.24;
        }

        int proteinGrams = (int)Math.Round((targetCalories * proteinRatio) / 4);
        int carbGrams = (int)Math.Round((targetCalories * carbRatio) / 4);
        int fatGrams = (int)Math.Round((targetCalories * fatRatio) / 9);

        double waterLiters = Math.Round(weightKg * 0.035, 1);
        int waterOz = (int)Math.Round(weightKg * 0.035 * 33.814);

        return new BiometricsSummaryDto
        {
            Bmr = (int)Math.Round(bmr),
            Tdee = tdee,
            TargetCalories = targetCalories,
            ProteinGrams = proteinGrams,
            CarbsGrams = carbGrams,
            FatGrams = fatGrams,
            WaterLiters = waterLiters,
            WaterOz = waterOz,
            GoalLabel = goalLabel
        };
    }

    public async Task<AiDietPlanResponse> GenerateDietPlanAsync(AiDietPlanRequest request, CancellationToken cancellationToken = default)
    {
        var biometrics = CalculateBiometrics(request);
        var cuisine = SupportedCuisines.FirstOrDefault(c => c.Id.Equals(request.CuisineRegion, StringComparison.OrdinalIgnoreCase))
                      ?? SupportedCuisines[0];

        // Resolve Gemini API key (Client Provided -> appsettings -> Environment variable)
        string apiKey = ResolveGeminiApiKey(request.ClientApiKey);

        if (!string.IsNullOrWhiteSpace(apiKey))
        {
            try
            {
                var geminiPlan = await CallGeminiAgentAsync(request, biometrics, cuisine, apiKey, cancellationToken);
                if (geminiPlan != null && geminiPlan.Meals.Count > 0)
                {
                    _logger.LogInformation("Successfully generated personalized diet plan via Gemini AI Agent for cuisine {Cuisine}", cuisine.Name);
                    return geminiPlan;
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Gemini AI Agent call failed or timed out. Gracefully switching to Curated Cultural Knowledge Engine.");
            }
        }
        else
        {
            _logger.LogInformation("No Gemini API key detected. Engaging Curated Cultural Knowledge Engine for {Cuisine}.", cuisine.Name);
        }

        // Seamless fallback to high-fidelity cultural knowledge engine
        return GenerateCuratedCulturalPlan(request, biometrics, cuisine);
    }

    private string ResolveGeminiApiKey(string? clientProvidedKey)
    {
        if (!string.IsNullOrWhiteSpace(clientProvidedKey))
            return clientProvidedKey.Trim();

        if (!string.IsNullOrWhiteSpace(_options.ApiKey))
            return _options.ApiKey.Trim();

        var envKey = Environment.GetEnvironmentVariable("GEMINI_API_KEY");
        if (!string.IsNullOrWhiteSpace(envKey))
            return envKey.Trim();

        var confKey = _configuration["Gemini:ApiKey"];
        if (!string.IsNullOrWhiteSpace(confKey))
            return confKey.Trim();

        return string.Empty;
    }

    private async Task<AiDietPlanResponse?> CallGeminiAgentAsync(
        AiDietPlanRequest req,
        BiometricsSummaryDto bio,
        CuisineInfoDto cuisine,
        string apiKey,
        CancellationToken cancellationToken)
    {
        string model = string.IsNullOrWhiteSpace(_options.Model) ? "gemini-1.5-flash" : _options.Model;
        string endpoint = $"{_options.ApiUrl.TrimEnd('/')}/{model}:generateContent?key={apiKey}";

        string allergyNote = (req.Allergies != null && req.Allergies.Count > 0)
            ? $"Strict Allergies/Avoidances: {string.Join(", ", req.Allergies)}."
            : "No specific food allergies reported.";

        int mealCount = req.MealCount is 2 or 3 or 4 ? req.MealCount : 4;

        string systemInstruction = @"You are Foodies Goodies Master AI Dietitian & Culinary Anthropologist.
Your mission is to craft deeply authentic, mouthwatering, culturally accurate diet plans tailored to the user's specific country and food traditions.
CRITICAL RULES:
1. Embody the user's requested country cuisine (use authentic local recipe names, staple grains, traditional spices, and cultural cooking techniques).
2. For Indian cuisines, use genuine regional terminology (e.g., Chilla, Dal Tadka, Paneer Bhurji, Sambar, Ragi, Kootu, Khichdi, Idli). Never prescribe bland generic Western bowls unless specifically requested.
3. Obey the exact biometric daily target calories and macros.
4. Output STRICTLY in valid JSON matching the requested schema. No markdown formatting outside the JSON.";

        string userPrompt = $@"Generate a 1-day personalized culinary nutrition plan for:
- Food Culture / Country: {cuisine.Name} ({cuisine.Country} {cuisine.Flag})
- Traditional Staples: {cuisine.StapleGrainsAndProteins}
- Key Spices: {cuisine.KeySpices}
- Daily Target: {bio.TargetCalories} kcal
- Macros Target: Protein {bio.ProteinGrams}g, Carbs {bio.CarbsGrams}g, Healthy Fats {bio.FatGrams}g
- Goal: {bio.GoalLabel}
- Dietary Preference: {req.DietPreference}
- {allergyNote}
- Number of Meals to schedule: {mealCount}

Respond ONLY with this exact JSON structure:
{{
  ""cuisineTitle"": ""{cuisine.Name} - Personalized Meal Plan"",
  ""cuisineFlag"": ""{cuisine.Flag}"",
  ""culturalRationale"": ""2-3 sentences explaining why these specific cultural dishes, spices, and ingredients fuel this user's metabolism and goal."",
  ""culturalDigestiveTip"": ""An authentic cultural wellness or digestive habit from {cuisine.Country} (e.g. herbal tea, cumin water, meal pacing)."",
  ""meals"": [
    {{
      ""category"": ""Breakfast"",
      ""name"": ""Authentic Dish Name in Local Cuisine"",
      ""calories"": 450,
      ""proteinGrams"": 28,
      ""carbsGrams"": 50,
      ""fatGrams"": 14,
      ""description"": ""Rich sensory description of the meal."",
      ""ingredients"": [""ingredient 1"", ""ingredient 2""],
      ""chefTip"": ""An authentic cooking tip or spice tempering method.""
    }}
  ],
  ""groceryList"": [
    {{
      ""category"": ""Fresh Produce & Herbs"",
      ""items"": [""item 1"", ""item 2""]
    }},
    {{
      ""category"": ""Proteins & Pantry Staples"",
      ""items"": [""item 1"", ""item 2""]
    }}
  ]
}}";

        var payload = new
        {
            contents = new[]
            {
                new
                {
                    role = "user",
                    parts = new object[]
                    {
                        new { text = $"{systemInstruction}\n\n{userPrompt}" }
                    }
                }
            },
            generationConfig = new
            {
                responseMimeType = "application/json",
                temperature = 0.4,
                maxOutputTokens = 2048
            }
        };

        var content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");

        using var requestMessage = new HttpRequestMessage(HttpMethod.Post, endpoint);
        requestMessage.Content = content;

        var response = await _httpClient.SendAsync(requestMessage, cancellationToken);
        if (!response.IsSuccessStatusCode)
        {
            var errText = await response.Content.ReadAsStringAsync(cancellationToken);
            _logger.LogWarning("Gemini API returned status {Status}: {Error}", response.StatusCode, errText);
            return null;
        }

        var json = await response.Content.ReadAsStringAsync(cancellationToken);
        using var doc = JsonDocument.Parse(json);

        var candidates = doc.RootElement.GetProperty("candidates");
        if (candidates.GetArrayLength() == 0) return null;

        var contentProp = candidates[0].GetProperty("content").GetProperty("parts")[0].GetProperty("text").GetString();
        if (string.IsNullOrWhiteSpace(contentProp)) return null;

        var cleanJson = contentProp.Trim();
        if (cleanJson.StartsWith("```json", StringComparison.OrdinalIgnoreCase))
        {
            cleanJson = cleanJson.Substring(7).Trim();
            if (cleanJson.EndsWith("```")) cleanJson = cleanJson.Substring(0, cleanJson.Length - 3).Trim();
        }

        var parsedPlan = JsonSerializer.Deserialize<AiDietPlanResponse>(cleanJson, JsonOptions);
        if (parsedPlan == null) return null;

        parsedPlan.Success = true;
        parsedPlan.Source = $"Gemini AI Agent ({model})";
        parsedPlan.Model = model;
        parsedPlan.Biometrics = bio;
        if (string.IsNullOrWhiteSpace(parsedPlan.CuisineFlag)) parsedPlan.CuisineFlag = cuisine.Flag;

        return parsedPlan;
    }

    private AiDietPlanResponse GenerateCuratedCulturalPlan(
        AiDietPlanRequest req,
        BiometricsSummaryDto bio,
        CuisineInfoDto cuisine)
    {
        string diet = (req.DietPreference ?? "omnivore").ToLowerInvariant();
        bool isVeg = diet is "vegetarian" or "vegan" or "sattvic";
        bool isVegan = diet is "vegan";
        bool isKeto = diet is "keto";

        int targetCals = bio.TargetCalories;
        int mealCount = req.MealCount is 2 or 3 or 4 ? req.MealCount : 4;

        var meals = new List<AiMealItemDto>();
        var groceryList = new List<GroceryCategoryDto>();
        string rationale;
        string digestiveTip;

        switch (cuisine.Id)
        {
            case "india-north":
            case "india-pan":
                rationale = $"North Indian regional nutrition balances complex carbohydrates from whole grains with high-satiety legumes and warming carminative spices. Spices like cumin, ginger, and turmeric stimulate digestive agni, aiding rapid nutrient absorption for {bio.GoalLabel.ToLowerInvariant()}.";
                digestiveTip = "Drink 1 cup of warm cumin-fennel (Jeera-Saunf) water 20 minutes after your main meals to prevent bloating and optimize nutrient assimilation.";

                meals.Add(new AiMealItemDto
                {
                    Category = "Breakfast",
                    Name = isKeto
                        ? "Paneer & Spinach Bhurji with Spiced Flax Seeds"
                        : "Moong Dal & Spinach Chilla with Fresh Mint-Coriander Chutney",
                    Calories = (int)(targetCals * 0.26),
                    ProteinGrams = (int)(bio.ProteinGrams * 0.27),
                    CarbsGrams = isKeto ? (int)(bio.CarbsGrams * 0.25) : (int)(bio.CarbsGrams * 0.30),
                    FatGrams = (int)(bio.FatGrams * 0.25),
                    Description = "Savory yellow moong batter whipped with baby spinach, chopped ginger, green chillies, and pan-crisped with a teaspoon of cold-pressed oil, served with zesty mint dip.",
                    Ingredients = new() { "Yellow Moong Dal (soaked)", "Baby Spinach", "Fresh Mint & Coriander", "Ginger & Green Chilli", "Rock Salt & Roasted Cumin" },
                    ChefTip = "Grind the soaked dal with minimal water for an airy, crepe-like crispiness without needing excess oil."
                });

                meals.Add(new AiMealItemDto
                {
                    Category = "Lunch",
                    Name = isVeg
                        ? "Home-Style Dal Tadka with Methi Phulkas & Cucumber Kachumber"
                        : "Clay-Oven Tandoori Chicken Tikka with Multigrain Roti & Cucumber Salad",
                    Calories = (int)(targetCals * 0.35),
                    ProteinGrams = (int)(bio.ProteinGrams * 0.36),
                    CarbsGrams = (int)(bio.CarbsGrams * 0.35),
                    FatGrams = (int)(bio.FatGrams * 0.32),
                    Description = isVeg
                        ? "Hearty yellow toor and masoor lentils tempered with cumin, crushed garlic, and plum tomatoes, accompanied by 2 multigrain rotis and shredded kachumber."
                        : "Succulent chicken breast marinated in hung curd, Kashmiri paprika, and roasted kasuri methi, charred tender and paired with warm phulkas.",
                    Ingredients = isVeg
                        ? new() { "Toor & Masoor Dal", "Whole Wheat / Jowar Atta", "Tomatoes & Garlic", "Fresh Fenugreek (Methi)", "Cumin & Ghee" }
                        : new() { "Chicken Breast", "Hung Curd", "Kasuri Methi", "Whole Wheat Roti", "Lemon & Chaat Masala" },
                    ChefTip = "Add the tadka (tempering) at the very final second with the lid closed to trap all aromatic essential oils in the dal."
                });

                if (mealCount >= 4)
                {
                    meals.Add(new AiMealItemDto
                    {
                        Category = "Mid-Day Fuel",
                        Name = "Spiced Sprouted Moong & Pomegranate Chaat",
                        Calories = (int)(targetCals * 0.14),
                        ProteinGrams = (int)(bio.ProteinGrams * 0.15),
                        CarbsGrams = (int)(bio.CarbsGrams * 0.15),
                        FatGrams = (int)(bio.FatGrams * 0.13),
                        Description = "Crunchy sprouted green moong beans tossed with sweet ruby pomegranate arils, diced cucumber, fresh lemon juice, and black rock salt.",
                        Ingredients = new() { "Sprouted Green Moong", "Pomegranate Seeds", "Cucumber", "Black Rock Salt (Kala Namak)", "Fresh Lemon Juice" },
                        ChefTip = "Lightly steam sprouts for 90 seconds to preserve live enzymes while significantly easing digestion."
                    });
                }

                meals.Add(new AiMealItemDto
                {
                    Category = "Dinner",
                    Name = isVeg
                        ? "Palak Paneer with Jeera Brown Basmati Rice"
                        : "Amritsari Baked Fish with Steamed Spiced Veggies & Brown Basmati",
                    Calories = (int)(targetCals * 0.25),
                    ProteinGrams = (int)(bio.ProteinGrams * 0.22),
                    CarbsGrams = (int)(bio.CarbsGrams * 0.20),
                    FatGrams = (int)(bio.FatGrams * 0.30),
                    Description = isVeg
                        ? "Slow-blanched velvety spinach gravy folded over high-protein paneer cubes, lightly scented with clove and served alongside aromatic brown basmati."
                        : "Light white fish fillet rubbed with ajwain (carom), turmeric, and lemon, oven-baked crisp alongside tender broccoli and brown basmati.",
                    Ingredients = isVeg
                        ? new() { "Fresh Spinach (Palak)", "Low-fat Paneer", "Brown Basmati Rice", "Garlic & Cloves", "Garam Masala" }
                        : new() { "White Fish Fillet", "Ajwain (Carom seeds)", "Brown Basmati", "Steamed Florets", "Cold-Pressed Mustard Oil" },
                    ChefTip = "Shock blanched spinach immediately in ice water to maintain vibrant emerald green color and prevent nutrient breakdown."
                });

                groceryList.Add(new GroceryCategoryDto
                {
                    Category = "Fresh Produce & Herbs",
                    Items = new() { "Baby Spinach (Palak)", "Fresh Mint & Coriander", "Tomatoes & Cucumbers", "Ginger & Garlic", "Lemons & Pomegranate" }
                });
                groceryList.Add(new GroceryCategoryDto
                {
                    Category = "Lentils, Grains & Pantry",
                    Items = new() { "Yellow Moong Dal", "Toor Dal", "Sprouted Moong Beans", "Multigrain Atta", "Brown Basmati Rice" }
                });
                groceryList.Add(new GroceryCategoryDto
                {
                    Category = "Proteins & Dairy",
                    Items = isVeg
                        ? new() { "Fresh Low-Fat Paneer", "Greek / Hung Curd", "A2 Desi Cow Ghee" }
                        : new() { "Skinless Chicken Breast", "White Fish Fillets", "Fresh Paneer", "Greek Curd" }
                });
                break;

            case "india-south":
                rationale = "South Indian cuisine harnesses the power of fermented batters, native millets (Ragi), and curry leaves rich in antioxidants. Fermentation enhances bioavailability of B-vitamins and simplifies digestion, ideal for sustained stamina.";
                digestiveTip = "Sip a warm bowl of freshly crushed black pepper and cumin Rasam after lunch to accelerate metabolic rate.";

                meals.Add(new AiMealItemDto
                {
                    Category = "Breakfast",
                    Name = "Steamed Soft Idlis with Drumstick Vegetable Sambar & Coconut Chutney",
                    Calories = (int)(targetCals * 0.28),
                    ProteinGrams = (int)(bio.ProteinGrams * 0.25),
                    CarbsGrams = (int)(bio.CarbsGrams * 0.34),
                    FatGrams = (int)(bio.FatGrams * 0.22),
                    Description = "Naturally fermented rice-urad idlis steamed light as clouds, paired with protein-packed drumstick sambar and fresh coconut dip.",
                    Ingredients = new() { "Fermented Idli Batter", "Toor Dal & Drumstick", "Fresh Grated Coconut", "Mustard Seeds & Curry Leaves", "Tamarind" },
                    ChefTip = "Ferment batter in a warm corner for 12 hours for peak probiotic cultivation."
                });

                meals.Add(new AiMealItemDto
                {
                    Category = "Lunch",
                    Name = isVeg
                        ? "Curry-Leaf Tempered Poriyal with Lemon Red Rice & Sambar"
                        : "Malabar Pepper Chicken / Fish with Steamed Red Rice & Cabbage Poriyal",
                    Calories = (int)(targetCals * 0.36),
                    ProteinGrams = (int)(bio.ProteinGrams * 0.38),
                    CarbsGrams = (int)(bio.CarbsGrams * 0.33),
                    FatGrams = (int)(bio.FatGrams * 0.30),
                    Description = "Nutrient-rich Kerala red rice served with crunchy green bean poriyal and savory lentil broth, topped with freshly cracked Malabar pepper.",
                    Ingredients = new() { "Kerala Matta Red Rice", "Green Beans / Chicken", "Fresh Curry Leaves", "Black Pepper", "Coconut Oil" },
                    ChefTip = "Always temper mustard and curry leaves in pure virgin coconut oil for authentic coastal depth."
                });

                if (mealCount >= 4)
                {
                    meals.Add(new AiMealItemDto
                    {
                        Category = "Mid-Day Fuel",
                        Name = "Chilled Spiced Buttermilk (Neer Moru)",
                        Calories = (int)(targetCals * 0.10),
                        ProteinGrams = (int)(bio.ProteinGrams * 0.12),
                        CarbsGrams = (int)(bio.CarbsGrams * 0.08),
                        FatGrams = (int)(bio.FatGrams * 0.15),
                        Description = "Light churned buttermilk whisked with crushed ginger, green chilli, asafetida, and tempered mustard seeds.",
                        Ingredients = new() { "Fresh Curd (Dahi)", "Ginger & Green Chilli", "Asafetida (Hing)", "Curry Leaves", "Chilled Water" },
                        ChefTip = "Dilute buttermilk 1:3 with chilled water for ultra-hydrating electrolyte recovery."
                    });
                }

                meals.Add(new AiMealItemDto
                {
                    Category = "Dinner",
                    Name = "Crispy Ragi (Finger Millet) Dosa with Mixed Vegetable Kootu",
                    Calories = (int)(targetCals * 0.26),
                    ProteinGrams = (int)(bio.ProteinGrams * 0.25),
                    CarbsGrams = (int)(bio.CarbsGrams * 0.25),
                    FatGrams = (int)(bio.FatGrams * 0.33),
                    Description = "Calcium-dense ragi dosa griddled thin and crisp, served alongside a comforting stew of bottle gourd, chana dal, and coconut milk.",
                    Ingredients = new() { "Ragi Flour", "Bottle Gourd (Lauki)", "Chana Dal", "Curry Leaves", "Coconut Milk" },
                    ChefTip = "Let the ragi batter rest 15 minutes before cooking so the millet absorbs liquid evenly."
                });

                groceryList.Add(new GroceryCategoryDto
                {
                    Category = "Flours, Grains & Dals",
                    Items = new() { "Ragi (Finger Millet) Flour", "Idli Rice & Urad Dal", "Toor Dal & Chana Dal", "Kerala Matta Rice" }
                });
                groceryList.Add(new GroceryCategoryDto
                {
                    Category = "Coastal Produce & Spices",
                    Items = new() { "Fresh Curry Leaves", "Fresh Coconut", "Drumsticks (Moringa)", "Tamarind Pulp", "Black Peppercorns" }
                });
                break;

            case "india-sattvic":
                rationale = "Ayurvedic Sattvic nutrition emphasizes calm mental clarity, prana (life vitality), and gut ease. Prepared without alliums (no onion/garlic), it relies on easily assimilated mung dal, sweet gourds, and A2 ghee.";
                digestiveTip = "Chew 1/2 teaspoon of roasted fennel and cardamom seeds following meals to pacify digestive fire (Pitta).";

                meals.Add(new AiMealItemDto
                {
                    Category = "Breakfast",
                    Name = "Ayurvedic Warm Spiced Oats & Ash Gourd Elixir",
                    Calories = (int)(targetCals * 0.25),
                    ProteinGrams = (int)(bio.ProteinGrams * 0.22),
                    CarbsGrams = (int)(bio.CarbsGrams * 0.35),
                    FatGrams = (int)(bio.FatGrams * 0.25),
                    Description = "Steel-cut oats simmered in fresh almond milk with cardamom pods, golden raisins, and crushed pumpkin seeds, accompanied by pure ash gourd juice.",
                    Ingredients = new() { "Steel-Cut Oats", "Almond Milk", "Green Cardamom", "Soaked Raisins", "Fresh Ash Gourd" },
                    ChefTip = "Always crush whole cardamom pods right before infusing to release fresh volatile healing terpenes."
                });

                meals.Add(new AiMealItemDto
                {
                    Category = "Lunch",
                    Name = "Tri-Doshic Mung Dal Khichdi with Steamed Zucchini & A2 Ghee",
                    Calories = (int)(targetCals * 0.38),
                    ProteinGrams = (int)(bio.ProteinGrams * 0.38),
                    CarbsGrams = (int)(bio.CarbsGrams * 0.38),
                    FatGrams = (int)(bio.FatGrams * 0.30),
                    Description = "Healing pot of split yellow mung dal and hand-pounded rice cooked soft with fresh turmeric root, cumin, ginger, and a drizzle of grass-fed A2 ghee.",
                    Ingredients = new() { "Split Yellow Mung Dal", "Sona Masoori Rice", "Fresh Turmeric Root", "A2 Cow Ghee", "Zucchini & Cumin" },
                    ChefTip = "Khichdi is celebrated in Ayurveda as the ultimate balancing food because it provides complete protein while requiring near-zero digestive exertion."
                });

                if (mealCount >= 4)
                {
                    meals.Add(new AiMealItemDto
                    {
                        Category = "Mid-Day Fuel",
                        Name = "Soaked Almonds & Coconut Water with Tulsi",
                        Calories = (int)(targetCals * 0.12),
                        ProteinGrams = (int)(bio.ProteinGrams * 0.15),
                        CarbsGrams = (int)(bio.CarbsGrams * 0.10),
                        FatGrams = (int)(bio.FatGrams * 0.20),
                        Description = "Ten overnight-soaked and peeled Mamra almonds alongside tender fresh coconut water infused with holy basil leaves.",
                        Ingredients = new() { "Mamra Almonds (peeled)", "Fresh Coconut Water", "Holy Basil (Tulsi)", "Rock Sugar (Mishri optional)" },
                        ChefTip = "Peeling soaked almonds removes enzyme inhibitors (tannins), enhancing nutrient uptake."
                    });
                }

                meals.Add(new AiMealItemDto
                {
                    Category = "Dinner",
                    Name = "Steamed Pumpkin & Lauki Curry with Quinoa Phulkas",
                    Calories = (int)(targetCals * 0.25),
                    ProteinGrams = (int)(bio.ProteinGrams * 0.25),
                    CarbsGrams = (int)(bio.CarbsGrams * 0.17),
                    FatGrams = (int)(bio.FatGrams * 0.25),
                    Description = "Gentle, hydrating bottle gourd and golden pumpkin cubes braised in cumin-ginger broth, served alongside 2 warm gluten-free quinoa rotis.",
                    Ingredients = new() { "Bottle Gourd (Lauki)", "Yellow Pumpkin", "Quinoa Flour", "Ginger", "Rock Salt" },
                    ChefTip = "Dine before 7:30 PM so the body completes digestive work before natural sleep cycles begin."
                });

                groceryList.Add(new GroceryCategoryDto
                {
                    Category = "Sattvic Produce & Herbs",
                    Items = new() { "Fresh Ash Gourd", "Bottle Gourd (Lauki)", "Yellow Pumpkin", "Fresh Ginger & Turmeric", "Holy Basil (Tulsi)" }
                });
                groceryList.Add(new GroceryCategoryDto
                {
                    Category = "Purity Staples & Nuts",
                    Items = new() { "Yellow Mung Dal", "A2 Cow Ghee", "Mamra Almonds", "Green Cardamom", "Steel-Cut Oats" }
                });
                break;

            case "mediterranean":
                rationale = "The Mediterranean dietary archetype is globally recognized for cardiovascular and cellular health, built upon heart-healthy monounsaturated fats from extra virgin olive oil, wild seafood, and colorful polyphenols.";
                digestiveTip = "Drizzle raw extra virgin olive oil over warm meals right before eating to preserve delicate heat-sensitive polyphenols.";

                meals.Add(new AiMealItemDto
                {
                    Category = "Breakfast",
                    Name = "Mediterranean Shakshuka with Whole Grain Sourdough",
                    Calories = (int)(targetCals * 0.28),
                    ProteinGrams = (int)(bio.ProteinGrams * 0.28),
                    CarbsGrams = (int)(bio.CarbsGrams * 0.28),
                    FatGrams = (int)(bio.FatGrams * 0.30),
                    Description = "Two farm eggs poached gently in a spiced stew of crushed San Marzano tomatoes, bell peppers, garlic, and crumbled sheep feta, paired with artisan sourdough.",
                    Ingredients = new() { "Pasture Eggs", "Plum Tomatoes", "Bell Peppers", "Feta Cheese", "Artisan Sourdough", "EVOO" },
                    ChefTip = "Simmer the tomato-pepper reduction until thick before cracking the eggs so they poach in pure flavor."
                });

                meals.Add(new AiMealItemDto
                {
                    Category = "Lunch",
                    Name = isVeg
                        ? "Santorini Herb Lentil Salad with Kalamata Olives & Roasted Walnuts"
                        : "Grilled Herb Lemon Salmon with Warm Quinoa & Roasted Greek Vegetables",
                    Calories = (int)(targetCals * 0.36),
                    ProteinGrams = (int)(bio.ProteinGrams * 0.38),
                    CarbsGrams = (int)(bio.CarbsGrams * 0.32),
                    FatGrams = (int)(bio.FatGrams * 0.32),
                    Description = "Wild fillet seared with fresh oregano, garlic, and lemon zest, resting on fluffy quinoa and charred zucchini ribbons.",
                    Ingredients = new() { "Wild Salmon Fillet / Brown Lentils", "Quinoa", "Kalamata Olives", "Zucchini & Cherry Tomatoes", "Extra Virgin Olive Oil" },
                    ChefTip = "Rest the salmon for 3 minutes off the skillet to retain all savory natural omega-3 juices."
                });

                if (mealCount >= 4)
                {
                    meals.Add(new AiMealItemDto
                    {
                        Category = "Mid-Day Fuel",
                        Name = "Greek Strained Yogurt with Crushed Walnuts & Thyme Honey",
                        Calories = (int)(targetCals * 0.12),
                        ProteinGrams = (int)(bio.ProteinGrams * 0.14),
                        CarbsGrams = (int)(bio.CarbsGrams * 0.10),
                        FatGrams = (int)(bio.FatGrams * 0.15),
                        Description = "Creamy authentic Greek yogurt topped with raw walnuts and a drizzle of golden thyme honey.",
                        Ingredients = new() { "Greek Yogurt (0% or 2%)", "Raw Walnuts", "Thyme Honey" },
                        ChefTip = "Walnuts are uniquely rich in plant-based ALA omega-3s, perfectly complementing probiotic yogurt."
                    });
                }

                meals.Add(new AiMealItemDto
                {
                    Category = "Dinner",
                    Name = "Charred Mediterranean Chicken / Eggplant Souvlaki with Tzatziki",
                    Calories = (int)(targetCals * 0.24),
                    ProteinGrams = (int)(bio.ProteinGrams * 0.20),
                    CarbsGrams = (int)(bio.CarbsGrams * 0.30),
                    FatGrams = (int)(bio.FatGrams * 0.23),
                    Description = "Skewers of rosemary-garlic chicken breast or roasted eggplant cubes served with cool cucumber-dill tzatziki and a crisp rocket salad.",
                    Ingredients = new() { "Chicken Breast / Eggplant", "Cucumber & Dill", "Greek Yogurt", "Rosemary & Garlic", "Wild Arugula" },
                    ChefTip = "Squeeze fresh lemon juice over skewers immediately after grilling to tenderize the lean protein."
                });

                groceryList.Add(new GroceryCategoryDto
                {
                    Category = "Produce & Greens",
                    Items = new() { "San Marzano Tomatoes", "Bell Peppers & Zucchini", "Wild Arugula & Cucumbers", "Fresh Dill & Rosemary", "Lemons" }
                });
                groceryList.Add(new GroceryCategoryDto
                {
                    Category = "Proteins, Dairy & Pantry",
                    Items = new() { "Wild Salmon / White Fish", "Pasture-Raised Eggs", "Authentic Greek Yogurt", "Extra Virgin Olive Oil", "Kalamata Olives" }
                });
                break;

            case "japan":
                rationale = "Traditional Japanese Washoku (和食) is celebrated for longevity and metabolic balance. Incorporating seaweed, fermented miso, and steamed omega-3 seafood provides rich umami with minimal added fats.";
                digestiveTip = "Drink a small cup of warm green tea (sencha or hojicha) 30 minutes following meals to stimulate digestion with EGCG antioxidants.";

                meals.Add(new AiMealItemDto
                {
                    Category = "Breakfast",
                    Name = "Japanese Traditional Asagohan: Salmon, Steamed Egg & Miso",
                    Calories = (int)(targetCals * 0.27),
                    ProteinGrams = (int)(bio.ProteinGrams * 0.28),
                    CarbsGrams = (int)(bio.CarbsGrams * 0.28),
                    FatGrams = (int)(bio.FatGrams * 0.25),
                    Description = "Lightly salted broiled salmon, soft onsen egg, and steaming wakame miso soup served with a small bowl of brown rice.",
                    Ingredients = new() { "Wild Salmon Fillet", "Shiro Miso Paste", "Wakame Seaweed", "Pasture Egg", "Brown Rice" },
                    ChefTip = "Never boil miso paste; dissolve it in hot dashi off the heat to keep beneficial probiotics alive."
                });

                meals.Add(new AiMealItemDto
                {
                    Category = "Lunch",
                    Name = isVeg
                        ? "Sesame Ginger Glazed Tofu with Soba Noodles & Bok Choy"
                        : "Chicken Yakitori Bowl with Soba Noodles & Steamed Bok Choy",
                    Calories = (int)(targetCals * 0.36),
                    ProteinGrams = (int)(bio.ProteinGrams * 0.38),
                    CarbsGrams = (int)(bio.CarbsGrams * 0.34),
                    FatGrams = (int)(bio.FatGrams * 0.28),
                    Description = "Buckwheat soba tossed in ginger-tamari glaze with grilled skewers, sesame seeds, and tender steamed bok choy.",
                    Ingredients = new() { "Buckwheat Soba Noodles", "Firm Tofu / Chicken", "Bok Choy", "Tamari (Gluten-Free)", "Toasted Sesame Oil" },
                    ChefTip = "Rinse cooked soba noodles thoroughly in ice water to remove starch and create springy al dente texture."
                });

                if (mealCount >= 4)
                {
                    meals.Add(new AiMealItemDto
                    {
                        Category = "Mid-Day Fuel",
                        Name = "Sea-Salt Steamed Edamame Pods",
                        Calories = (int)(targetCals * 0.12),
                        ProteinGrams = (int)(bio.ProteinGrams * 0.14),
                        CarbsGrams = (int)(bio.CarbsGrams * 0.10),
                        FatGrams = (int)(bio.FatGrams * 0.15),
                        Description = "Whole young green soybeans steamed in their pods, tossed with coarse Japanese sea salt.",
                        Ingredients = new() { "Fresh/Frozen Edamame Pods", "Coarse Sea Salt (Maldon or Oshima)" },
                        ChefTip = "Edamame contains all nine essential amino acids, making it a complete plant protein."
                    });
                }

                meals.Add(new AiMealItemDto
                {
                    Category = "Dinner",
                    Name = "Miso-Glazed Black Cod or Grilled Tofu with Shiitake & Steamed Greens",
                    Calories = (int)(targetCals * 0.25),
                    ProteinGrams = (int)(bio.ProteinGrams * 0.20),
                    CarbsGrams = (int)(bio.CarbsGrams * 0.28),
                    FatGrams = (int)(bio.FatGrams * 0.32),
                    Description = "Delicate fish or tofu caramelized with a thin layer of sweet mirin-miso, served with sautéed shiitake mushrooms and ginger spinach.",
                    Ingredients = new() { "Black Cod / Tofu", "Shiitake Mushrooms", "Mirin & Miso", "Baby Spinach", "Grated Ginger" },
                    ChefTip = "Broil 6 inches from the heat source so the miso caramelizes into sweet umami without burning."
                });

                groceryList.Add(new GroceryCategoryDto
                {
                    Category = "Japanese Pantry & Staples",
                    Items = new() { "Shiro Miso Paste", "Buckwheat Soba Noodles", "Tamari Soy Sauce", "Toasted Sesame Oil", "Wakame Seaweed" }
                });
                groceryList.Add(new GroceryCategoryDto
                {
                    Category = "Fresh Produce & Proteins",
                    Items = new() { "Wild Salmon Fillets", "Firm Organic Tofu", "Edamame Pods", "Bok Choy & Shiitake", "Fresh Ginger" }
                });
                break;

            default:
                // General world fusion / Mexican / American
                rationale = $"{cuisine.Name} emphasizes whole, unrefined staples: high-fiber legumes, lean proteins, colorful vegetables, and essential fats to maintain steady glucose levels throughout the day.";
                digestiveTip = "Drink 500ml of lemon-infused water upon waking to kickstart cellular hydration and bile production.";

                meals.Add(new AiMealItemDto
                {
                    Category = "Breakfast",
                    Name = "Herb Avocado Toast with Poached Pasture Eggs",
                    Calories = (int)(targetCals * 0.28),
                    ProteinGrams = (int)(bio.ProteinGrams * 0.28),
                    CarbsGrams = (int)(bio.CarbsGrams * 0.30),
                    FatGrams = (int)(bio.FatGrams * 0.28),
                    Description = "Thick slice of toasted sourdough topped with smashed avocado, lemon juice, micro-greens, chili flakes, and two soft poached eggs.",
                    Ingredients = new() { "Whole Wheat Sourdough", "Ripe Avocado", "Pasture Eggs", "Lemon & Chili Flakes" },
                    ChefTip = "A splash of white vinegar in simmering water helps egg whites coagulate into a round poached sphere."
                });

                meals.Add(new AiMealItemDto
                {
                    Category = "Lunch",
                    Name = "Spiced Quinoa & Black Bean Power Bowl",
                    Calories = (int)(targetCals * 0.36),
                    ProteinGrams = (int)(bio.ProteinGrams * 0.36),
                    CarbsGrams = (int)(bio.CarbsGrams * 0.35),
                    FatGrams = (int)(bio.FatGrams * 0.30),
                    Description = "Fluffy tricolor quinoa topped with slow-simmered black beans, grilled chicken or baked tofu, cherry tomatoes, and lime-cilantro vinaigrette.",
                    Ingredients = new() { "Tricolor Quinoa", "Black Beans", "Lean Chicken / Tofu", "Cilantro & Lime", "Cherry Tomatoes" },
                    ChefTip = "Toast dry quinoa in the dry saucepan for 2 minutes before adding water for a distinct nutty flavor."
                });

                if (mealCount >= 4)
                {
                    meals.Add(new AiMealItemDto
                    {
                        Category = "Mid-Day Fuel",
                        Name = "Raw Almonds & Green Apple with Ceylon Cinnamon",
                        Calories = (int)(targetCals * 0.12),
                        ProteinGrams = (int)(bio.ProteinGrams * 0.14),
                        CarbsGrams = (int)(bio.CarbsGrams * 0.12),
                        FatGrams = (int)(bio.FatGrams * 0.16),
                        Description = "Crisp green apple wedges sprinkled with fragrant Ceylon cinnamon, served with a handful of raw almonds.",
                        Ingredients = new() { "Green Apple", "Raw Almonds", "Ceylon Cinnamon" },
                        ChefTip = "Ceylon cinnamon aids insulin sensitivity, preventing afternoon blood sugar dips."
                    });
                }

                meals.Add(new AiMealItemDto
                {
                    Category = "Dinner",
                    Name = "Herb-Roasted Salmon with Sweet Potato & Asparagus",
                    Calories = (int)(targetCals * 0.24),
                    ProteinGrams = (int)(bio.ProteinGrams * 0.22),
                    CarbsGrams = (int)(bio.CarbsGrams * 0.23),
                    FatGrams = (int)(bio.FatGrams * 0.26),
                    Description = "Oven-roasted wild salmon fillet with crushed thyme, garlic, steamed sweet potato cubes, and tender asparagus spears.",
                    Ingredients = new() { "Wild Salmon", "Sweet Potato", "Fresh Asparagus", "Garlic & Thyme", "Olive Oil" },
                    ChefTip = "Roast asparagus at high heat (200°C) for 10 minutes to caramelize the tips while preserving crunch."
                });

                groceryList.Add(new GroceryCategoryDto
                {
                    Category = "Pantry & Staples",
                    Items = new() { "Tricolor Quinoa", "Black Beans", "Whole Wheat Sourdough", "Raw Almonds", "Ceylon Cinnamon" }
                });
                groceryList.Add(new GroceryCategoryDto
                {
                    Category = "Produce & Proteins",
                    Items = new() { "Wild Salmon Fillets", "Pasture Eggs", "Ripe Avocados", "Sweet Potatoes & Asparagus", "Green Apples" }
                });
                break;
        }

        return new AiDietPlanResponse
        {
            Success = true,
            Source = "Curated Cultural Knowledge Engine",
            Model = "Foodies-Culinary-Anthropology-v2",
            CuisineTitle = $"{cuisine.Name} — Personalized Nutrition Blueprint",
            CuisineFlag = cuisine.Flag,
            CulturalRationale = rationale,
            Biometrics = bio,
            Meals = meals,
            GroceryList = groceryList,
            CulturalDigestiveTip = digestiveTip
        };
    }
}
