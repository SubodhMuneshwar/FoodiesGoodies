using System.Text.Json;
using FoodiesGoodies.Api.Configuration;
using FoodiesGoodies.Api.DTOs.Diet;
using FoodiesGoodies.Api.Services.Cuisine;
using FoodiesGoodies.Api.Services.Gemini;
using Microsoft.Extensions.Options;

namespace FoodiesGoodies.Api.Services.Diet;

public class GeminiDietPlannerAgent : IDietPlannerAgent
{
    private readonly IGeminiClient _geminiClient;
    private readonly INutritionCalculatorService _nutritionCalculator;
    private readonly ICuisineProfileService _cuisineProfileService;
    private readonly IDietPlanValidator _validator;
    private readonly IFallbackDietPlanner _fallbackPlanner;
    private readonly IRecipeService _recipeService;
    private readonly GeminiOptions _options;
    private readonly ILogger<GeminiDietPlannerAgent> _logger;

    public GeminiDietPlannerAgent(
        IGeminiClient geminiClient,
        INutritionCalculatorService nutritionCalculator,
        ICuisineProfileService cuisineProfileService,
        IDietPlanValidator validator,
        IFallbackDietPlanner fallbackPlanner,
        IRecipeService recipeService,
        IOptions<GeminiOptions> options,
        ILogger<GeminiDietPlannerAgent> logger)
    {
        _geminiClient = geminiClient;
        _nutritionCalculator = nutritionCalculator;
        _cuisineProfileService = cuisineProfileService;
        _validator = validator;
        _fallbackPlanner = fallbackPlanner;
        _recipeService = recipeService;
        _options = options.Value;
        _logger = logger;
    }

    public async Task<DietPlanResponse> GenerateDietPlanAsync(DietPlanRequest request, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);

        // 1. High-Risk Nutrition & Clinical Safety Screening
        if (IsHighRiskRequest(request, out string riskNotice))
        {
            _logger.LogWarning("High-risk nutrition query detected. Returning clinical referral advisory.");
            return new DietPlanResponse
            {
                PlanTitle = "Clinical Care Referral & Advisory",
                PlanSource = "FoodiesGoodies Safety Engine",
                Disclaimer = "This system provides general lifestyle guidance only. It is not equipped to provide therapeutic clinical nutrition, eating disorder recovery, pediatric diets, or treatment for medical conditions.",
                Recommendations = new List<string>
                {
                    riskNotice,
                    "Please consult a licensed physician, clinical endocrinologist, or registered dietitian (RD/RDN) for supervised, evidence-based care."
                },
                GeneratedAtUtc = DateTime.UtcNow
            };
        }

        // 2. Deterministic baseline calculations & cuisine resolution
        var targets = _nutritionCalculator.CalculateTargets(request);
        var cuisine = _cuisineProfileService.ResolveProfile(request.Country, request.Region, request.Cuisine);

        // 3. If Gemini is not configured, seamlessly use deterministic fallback
        if (!_geminiClient.IsConfigured)
        {
            _logger.LogInformation("Gemini API key is unconfigured. Utilizing FoodiesGoodies Planning Engine fallback.");
            return _fallbackPlanner.Generate7DayFallbackPlan(request, targets, cuisine);
        }

        // 4. Build Agent System Instruction & User Context
        string systemInstruction = BuildSystemInstruction(request, targets, cuisine);
        string userPrompt = BuildUserPrompt(request, targets, cuisine);

        var contents = new List<GeminiContent>
        {
            new GeminiContent
            {
                Role = "user",
                Parts = new List<GeminiPart> { new GeminiPart { Text = userPrompt } }
            }
        };

        var geminiRequest = new GeminiGenerateContentRequest
        {
            SystemInstruction = systemInstruction,
            Contents = contents,
            ResponseMimeType = "application/json",
            Temperature = 0.3
        };

        // 5. Agent Planning & Self-Correction Loop
        int maxAttempts = Math.Clamp(_options.MaxAgentIterations, 1, 5);

        for (int attempt = 1; attempt <= maxAttempts; attempt++)
        {
            cancellationToken.ThrowIfCancellationRequested();

            _logger.LogInformation("Agent planning iteration {Attempt} of {MaxAttempts} for cuisine '{Cuisine}'", attempt, maxAttempts, cuisine.Name);

            var result = await _geminiClient.GenerateContentAsync(geminiRequest, cancellationToken);

            if (!result.Success || string.IsNullOrWhiteSpace(result.RawText))
            {
                _logger.LogWarning("Gemini generation failed on iteration {Attempt}: {Error}", attempt, result.ErrorMessage);
                break; // Fall back safely
            }

            DietPlanResponse? parsedPlan = null;
            try
            {
                parsedPlan = JsonSerializer.Deserialize<DietPlanResponse>(result.RawText, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });
            }
            catch (JsonException ex)
            {
                _logger.LogWarning(ex, "Failed to parse structured JSON from Gemini on attempt {Attempt}", attempt);
            }

            if (parsedPlan != null && parsedPlan.Days != null && parsedPlan.Days.Count > 0)
            {
                // Normalize metadata
                parsedPlan.PlanSource = "Gemini AI";
                parsedPlan.Cuisine = cuisine;
                parsedPlan.Nutrition = targets;
                parsedPlan.GeneratedAtUtc = DateTime.UtcNow;

                // 6. Run Server-Side Validator
                var validation = _validator.ValidatePlan(parsedPlan, request, targets);

                if (validation.IsValid)
                {
                    _logger.LogInformation("Diet plan successfully validated on iteration {Attempt}.", attempt);

                    // Enrich with real Edamam recipe links where helpful
                    await TryEnrichRecipeLinksAsync(parsedPlan, cancellationToken);
                    return parsedPlan;
                }

                _logger.LogWarning("Plan failed validation on iteration {Attempt}. Errors: {Errors}",
                    attempt, string.Join("; ", validation.Errors));

                if (attempt < maxAttempts)
                {
                    // Feed errors back to Gemini for self-correction
                    geminiRequest.Contents.Add(new GeminiContent
                    {
                        Role = "model",
                        Parts = new List<GeminiPart> { new GeminiPart { Text = result.RawText } }
                    });

                    geminiRequest.Contents.Add(new GeminiContent
                    {
                        Role = "user",
                        Parts = new List<GeminiPart>
                        {
                            new GeminiPart
                            {
                                Text = $"The previous plan had the following validation errors that violate our requirements: {string.Join("; ", validation.Errors)}. " +
                                       $"Please revise and correct the plan strictly adhering to the schema, all allergies ({string.Join(", ", request.Allergies)}), and calorie targets."
                            }
                        }
                    });
                }
            }
        }

        // 7. If model attempts fail or are invalid, fallback gracefully
        _logger.LogWarning("Gemini agent could not produce a validated plan after {MaxAttempts} attempts. Providing deterministic fallback.", maxAttempts);
        return _fallbackPlanner.Generate7DayFallbackPlan(request, targets, cuisine);
    }

    public async Task<MealSwapResponse> SwapSingleMealAsync(MealSwapRequest request, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);

        if (!_geminiClient.IsConfigured)
        {
            var fallbackMeal = _fallbackPlanner.GenerateFallbackSwapMeal(request);
            return new MealSwapResponse
            {
                Success = true,
                Day = request.Day,
                MealCategory = request.MealCategory,
                SwappedMeal = fallbackMeal,
                Message = "Swapped using FoodiesGoodies Planning Engine."
            };
        }

        string prompt = $@"Generate ONE alternative meal for Day {request.Day} {request.MealCategory} matching:
Cuisine: {request.Cuisine} ({request.Region}, {request.Country})
Target Calories: ~{request.TargetCalories} kcal (Protein: {request.TargetProteinGrams}g, Carbs: {request.TargetCarbsGrams}g, Fat: {request.TargetFatGrams}g)
Diet: {request.DietPreference}
Allergies (ABSOLUTE EXCLUSION): {string.Join(", ", request.Allergies)}
Foods to Avoid: {string.Join(", ", request.FoodsToAvoid)}
Max Cooking Time: {request.MaxCookingTimeMinutes} minutes
Avoid repeating: {request.CurrentMealName}

Return strictly a single JSON object matching this schema:
{{
  ""mealId"": ""day-{request.Day}-{request.MealCategory.ToLowerInvariant()}-swapped"",
  ""category"": ""{request.MealCategory}"",
  ""name"": ""Meal Name"",
  ""description"": ""Description of dish"",
  ""ingredients"": [""Item 1"", ""Item 2""],
  ""calories"": {request.TargetCalories},
  ""proteinGrams"": {request.TargetProteinGrams},
  ""carbsGrams"": {request.TargetCarbsGrams},
  ""fatGrams"": {request.TargetFatGrams},
  ""chefTip"": ""Authentic chef tip"",
  ""cookingTimeMinutes"": 25
}}";

        var geminiReq = new GeminiGenerateContentRequest
        {
            SystemInstruction = "You are the FoodiesGoodies AI Diet Planner. Return only valid JSON for a single meal swap.",
            Contents = new List<GeminiContent>
            {
                new GeminiContent
                {
                    Role = "user",
                    Parts = new List<GeminiPart> { new GeminiPart { Text = prompt } }
                }
            },
            ResponseMimeType = "application/json",
            Temperature = 0.5
        };

        try
        {
            var result = await _geminiClient.GenerateContentAsync(geminiReq, cancellationToken);
            if (result.Success && !string.IsNullOrWhiteSpace(result.RawText))
            {
                var meal = JsonSerializer.Deserialize<DietMealDto>(result.RawText, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });

                if (meal != null && !string.IsNullOrWhiteSpace(meal.Name))
                {
                    return new MealSwapResponse
                    {
                        Success = true,
                        Day = request.Day,
                        MealCategory = request.MealCategory,
                        SwappedMeal = meal,
                        Message = "Meal successfully regenerated by Gemini AI."
                    };
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Gemini single meal swap failed, falling back to local generator.");
        }

        var fallbackSwap = _fallbackPlanner.GenerateFallbackSwapMeal(request);
        return new MealSwapResponse
        {
            Success = true,
            Day = request.Day,
            MealCategory = request.MealCategory,
            SwappedMeal = fallbackSwap,
            Message = "Swapped using FoodiesGoodies Planning Engine."
        };
    }

    private static bool IsHighRiskRequest(DietPlanRequest req, out string riskNotice)
    {
        riskNotice = string.Empty;

        // Minor safety: Minors (<18) requesting aggressive calorie reduction
        if (req.Age < 18 && req.Goal.Contains("loss", StringComparison.OrdinalIgnoreCase))
        {
            riskNotice = "Pediatric and adolescent nutritional requirements differ significantly from adult caloric deficits. Unsupervised calorie restriction in youth may impact linear growth and bone mineral density.";
            return true;
        }

        // Extreme calorie restriction
        if (req.WeightKg < 35.0 || req.HeightCm < 100.0)
        {
            riskNotice = "The entered biometric values are outside of safe adult non-clinical ranges.";
            return true;
        }

        string allText = $"{req.Goal} {string.Join(" ", req.FoodsToAvoid)} {string.Join(" ", req.FavoriteFoods)}".ToLowerInvariant();

        string[] highRiskKeywords = new[]
        {
            "anorexi", "bulimi", "purge", "eating disorder", "starve", "crash diet",
            "pregnancy", "pregnant", "lactating", "breastfeeding", "chemotherapy",
            "cancer cure", "diabetic ketoacidosis", "dialysis", "renal failure"
        };

        foreach (var keyword in highRiskKeywords)
        {
            if (allText.Contains(keyword))
            {
                riskNotice = "Your request mentions conditions requiring specialized medical or clinical supervision.";
                return true;
            }
        }

        return false;
    }

    private static string BuildSystemInstruction(DietPlanRequest request, NutritionTargetsDto targets, CuisineContextDto cuisine)
    {
        return $@"You are the FoodiesGoodies AI Diet Planner. Your task is to generate a comprehensive, culturally authentic 7-day personalized nutrition plan.
Follow these rules strictly:
1. ALLERGIES ARE ABSOLUTE EXCLUSIONS: The user declared allergies: [{(request.Allergies.Count > 0 ? string.Join(", ", request.Allergies) : "None")}]. NEVER include these or derived ingredients in any meal, snack, or grocery item.
2. DIETARY PREFERENCE: The user follows a strictly '{request.DietPreference}' diet. Do not violate this preference.
3. CALORIE & MACRO TARGETS: The baseline calculated daily targets are:
   - Daily Calories: ~{targets.TargetCalories} kcal
   - Protein: ~{targets.ProteinGrams}g
   - Carbohydrates: ~{targets.CarbsGrams}g
   - Fats: ~{targets.FatGrams}g
   Daily meal calories across each day should total approximately {targets.TargetCalories} kcal (±15%).
4. CULTURAL SPECIFICITY: Ground the meals in authentic {cuisine.Name} cuisine ({cuisine.Region}, {cuisine.Country}).
   - Use staple grains: {cuisine.StapleGrainsAndProteins}
   - Use traditional aromatics: {cuisine.KeySpices}
   - Incorporate cultural digestive wisdom: {cuisine.DigestiveTradition}
5. LIFESTYLE CONSTRAINTS:
   - Meals per day: Exactly {request.MealCount} meals per day (e.g. Breakfast, Lunch, Snack, Dinner).
   - Max cooking time: {request.MaxCookingTimeMinutes} minutes.
   - Budget level: {request.Budget}.
6. COMPLETE 7-DAY SCHEDULE: You MUST generate all 7 days (Day 1 through Day 7). Do not skip days.
7. GROCERY LIST: Provide a consolidated weekly grocery list categorized into:
   'Fresh Produce & Herbs', 'Whole Grains & Staples', 'Proteins & Dairy', 'Traditional Spices & Oils', and 'Pantry Essentials'.
8. FORMAT: Output ONLY valid, parseable JSON conforming to the requested schema. No markdown formatting outside of JSON.";
    }

    private static string BuildUserPrompt(DietPlanRequest request, NutritionTargetsDto targets, CuisineContextDto cuisine)
    {
        return $@"Create a 7-day personalized {cuisine.Name} nutrition plan for:
Age: {request.Age}, Gender: {request.Gender}, Height: {request.HeightCm} cm, Weight: {request.WeightKg} kg
Daily Activity: {request.ActivityLevel}
Primary Goal: {targets.GoalLabel} ({targets.TargetCalories} kcal/day)
Country of Residence: {request.Country}
Preferred Cuisine Heritage: {cuisine.Name} ({cuisine.Region})
Dietary Preference: {request.DietPreference}
Allergies (Absolute Exclusions): [{(request.Allergies.Count > 0 ? string.Join(", ", request.Allergies) : "None")}]
Foods to Avoid: [{(request.FoodsToAvoid.Count > 0 ? string.Join(", ", request.FoodsToAvoid) : "None")}]
Favorite Foods: [{(request.FavoriteFoods.Count > 0 ? string.Join(", ", request.FavoriteFoods) : "None")}]
Meals Per Day: {request.MealCount}
Max Cooking Time: {request.MaxCookingTimeMinutes} minutes
Budget: {request.Budget}

Return the complete response strictly adhering to this JSON format:
{{
  ""planTitle"": ""7-Day Personalized {cuisine.Name} Nutrition Plan"",
  ""planSource"": ""Gemini AI"",
  ""cuisine"": {{
    ""country"": ""{cuisine.Country}"",
    ""region"": ""{cuisine.Region}"",
    ""name"": ""{cuisine.Name}"",
    ""flag"": ""{cuisine.Flag}"",
    ""description"": ""{cuisine.Description}"",
    ""stapleGrainsAndProteins"": ""{cuisine.StapleGrainsAndProteins}"",
    ""keySpices"": ""{cuisine.KeySpices}"",
    ""digestiveTradition"": ""{cuisine.DigestiveTradition}""
  }},
  ""nutrition"": {{
    ""bmr"": {targets.Bmr},
    ""tdee"": {targets.Tdee},
    ""targetCalories"": {targets.TargetCalories},
    ""proteinGrams"": {targets.ProteinGrams},
    ""carbsGrams"": {targets.CarbsGrams},
    ""fatGrams"": {targets.FatGrams},
    ""hydrationLiters"": {targets.HydrationLiters},
    ""hydrationOz"": {targets.HydrationOz},
    ""goalLabel"": ""{targets.GoalLabel}""
  }},
  ""days"": [
    {{
      ""day"": 1,
      ""dayName"": ""Day 1"",
      ""meals"": [
        {{
          ""mealId"": ""day-1-breakfast"",
          ""category"": ""Breakfast"",
          ""name"": ""Authentic Dish Name"",
          ""description"": ""Preparation details"",
          ""ingredients"": [""Ing 1"", ""Ing 2""],
          ""calories"": 450,
          ""proteinGrams"": 25,
          ""carbsGrams"": 55,
          ""fatGrams"": 12,
          ""chefTip"": ""Cultural tip"",
          ""recipeUrl"": null,
          ""cookingTimeMinutes"": 20
        }}
      ],
      ""totalCalories"": {targets.TargetCalories},
      ""totalProteinGrams"": {targets.ProteinGrams},
      ""totalCarbsGrams"": {targets.CarbsGrams},
      ""totalFatGrams"": {targets.FatGrams}
    }}
  ],
  ""groceryList"": [
    {{
      ""category"": ""Fresh Produce & Herbs"",
      ""items"": [""Item 1"", ""Item 2""]
    }}
  ],
  ""recommendations"": [""Recommendation 1"", ""Recommendation 2""],
  ""digestiveTip"": ""{cuisine.DigestiveTradition}"",
  ""disclaimer"": ""This plan provides general lifestyle and nutritional guidance. It is not medical advice or clinical treatment.""
}}";
    }

    private async Task TryEnrichRecipeLinksAsync(DietPlanResponse plan, CancellationToken cancellationToken)
    {
        try
        {
            // Pick a couple of signature meals from Day 1 to match against Edamam
            if (plan.Days != null && plan.Days.Count > 0 && plan.Days[0].Meals.Count > 0)
            {
                var lunchMeal = plan.Days[0].Meals.FirstOrDefault(m => m.Category.Contains("Lunch", StringComparison.OrdinalIgnoreCase))
                                ?? plan.Days[0].Meals[0];

                if (lunchMeal != null && string.IsNullOrWhiteSpace(lunchMeal.RecipeUrl))
                {
                    var edamamResp = await _recipeService.SearchRecipesAsync(lunchMeal.Name, cancellationToken);
                    if (edamamResp != null && edamamResp.Hits.Count > 0 && !string.IsNullOrWhiteSpace(edamamResp.Hits[0].Recipe?.Url))
                    {
                        lunchMeal.RecipeUrl = edamamResp.Hits[0].Recipe.Url;
                        _logger.LogInformation("Matched real Edamam recipe URL for meal '{Meal}'", lunchMeal.Name);
                    }
                }
            }
        }
        catch (Exception ex)
        {
            // Non-fatal enrichment failure - logging only
            _logger.LogDebug(ex, "Recipe search enrichment skipped.");
        }
    }
}
