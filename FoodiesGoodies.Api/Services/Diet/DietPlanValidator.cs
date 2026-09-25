using FoodiesGoodies.Api.DTOs.Diet;

namespace FoodiesGoodies.Api.Services.Diet;

public class DietPlanValidator : IDietPlanValidator
{
    private static readonly Dictionary<string, string[]> AllergyKeywords = new(StringComparer.OrdinalIgnoreCase)
    {
        ["peanuts"] = new[] { "peanut", "groundnut", "arachis" },
        ["peanut"] = new[] { "peanut", "groundnut", "arachis" },
        ["tree nuts"] = new[] { "almond", "cashew", "walnut", "pistachio", "pecan", "hazelnut", "macadamia" },
        ["tree nuts"] = new[] { "almond", "cashew", "walnut", "pistachio", "pecan", "hazelnut", "macadamia" },
        ["nut-free"] = new[] { "peanut", "almond", "cashew", "walnut", "pistachio", "pecan", "hazelnut" },
        ["dairy"] = new[] { "milk", "butter", "cheese", "paneer", "curd", "dahi", "ghee", "cream", "yogurt" },
        ["dairy-free"] = new[] { "milk", "butter", "cheese", "paneer", "curd", "dahi", "ghee", "cream", "yogurt" },
        ["wheat/gluten"] = new[] { "wheat", "maida", "gluten", "barley", "rye", "seitan", "semolina", "sooji", "suji" },
        ["gluten-free"] = new[] { "wheat", "maida", "gluten", "barley", "rye", "seitan", "semolina", "sooji", "suji" },
        ["eggs"] = new[] { "egg", "omelette", "mayonnaise" },
        ["egg"] = new[] { "egg", "omelette", "mayonnaise" },
        ["fish"] = new[] { "fish", "salmon", "tuna", "cod", "tilapia", "trout", "halibut", "sardine", "anchovy" },
        ["shellfish"] = new[] { "shrimp", "prawn", "crab", "lobster", "clam", "mussel", "oyster", "scallop" },
        ["soy"] = new[] { "soy", "tofu", "tempeh", "edamame", "soya" },
        ["sesame"] = new[] { "sesame", "tahini", "til" }
    };

    private static readonly string[] NonVegetarianKeywords = new[]
    {
        "chicken", "poultry", "beef", "pork", "bacon", "turkey", "lamb", "mutton", "meat",
        "fish", "salmon", "tuna", "prawn", "shrimp", "seafood"
    };

    private static readonly string[] NonVeganKeywords = new[]
    {
        "chicken", "beef", "pork", "bacon", "turkey", "lamb", "mutton", "meat",
        "fish", "salmon", "prawn", "shrimp", "egg", "eggs", "honey", "dairy",
        "milk", "cheese", "paneer", "butter", "ghee", "curd", "dahi", "yogurt"
    };

    public DietPlanValidationResult ValidatePlan(DietPlanResponse plan, DietPlanRequest request, NutritionTargetsDto targets)
    {
        var result = new DietPlanValidationResult();

        if (plan == null)
        {
            result.Errors.Add("Diet plan response is null.");
            return result;
        }

        // 1. Structural Checks
        if (plan.Days == null || plan.Days.Count == 0)
        {
            result.Errors.Add("Diet plan must contain at least 1 day of meal recommendations.");
            return result;
        }

        if (plan.GroceryList == null || plan.GroceryList.Count == 0)
        {
            result.Warnings.Add("Plan grocery list is empty or missing.");
        }

        // 2. Iterate Days & Meals
        int dayIndex = 1;
        foreach (var day in plan.Days)
        {
            if (day.Meals == null || day.Meals.Count == 0)
            {
                result.Errors.Add($"Day {dayIndex} does not contain any meals.");
                dayIndex++;
                continue;
            }

            int dailyCalorieSum = 0;

            foreach (var meal in day.Meals)
            {
                if (string.IsNullOrWhiteSpace(meal.Name))
                {
                    result.Errors.Add($"A meal on Day {dayIndex} is missing a title/name.");
                }

                dailyCalorieSum += meal.Calories;

                string mealText = $"{meal.Name} {meal.Description} {string.Join(" ", meal.Ingredients ?? new())}".ToLowerInvariant();

                // 3. Absolute Allergy Enforcement
                if (request.Allergies != null && request.Allergies.Count > 0)
                {
                    foreach (var allergy in request.Allergies)
                    {
                        var cleanAllergy = allergy.Trim().ToLowerInvariant();
                        if (AllergyKeywords.TryGetValue(cleanAllergy, out var terms))
                        {
                            foreach (var term in terms)
                            {
                                if (mealText.Contains(term))
                                {
                                    // Check if it says "dairy-free milk" or "gluten-free oats"
                                    if (mealText.Contains($"dairy-free {term}") ||
                                        mealText.Contains($"gluten-free {term}") ||
                                        mealText.Contains($"vegan {term}"))
                                    {
                                        continue;
                                    }

                                    result.Errors.Add($"Allergy violation: Meal '{meal.Name}' on Day {dayIndex} appears to contain '{term}', violating the '{allergy}' restriction.");
                                }
                            }
                        }
                    }
                }

                // 4. Dietary Preference Enforcement
                string dietPref = (request.DietPreference ?? "omnivore").ToLowerInvariant();
                if (dietPref.Contains("vegan"))
                {
                    foreach (var term in NonVeganKeywords)
                    {
                        if (mealText.Contains(term) && !mealText.Contains($"vegan {term}") && !mealText.Contains($"dairy-free {term}"))
                        {
                            result.Errors.Add($"Dietary restriction violation: Meal '{meal.Name}' contains non-vegan ingredient '{term}'.");
                            break;
                        }
                    }
                }
                else if (dietPref.Contains("vegetarian"))
                {
                    foreach (var term in NonVegetarianKeywords)
                    {
                        if (mealText.Contains(term))
                        {
                            result.Errors.Add($"Dietary restriction violation: Meal '{meal.Name}' contains non-vegetarian ingredient '{term}'.");
                            break;
                        }
                    }
                }

                // 5. Foods to Avoid Enforcement
                if (request.FoodsToAvoid != null)
                {
                    foreach (var avoid in request.FoodsToAvoid)
                    {
                        var cleanAvoid = avoid.Trim().ToLowerInvariant();
                        if (cleanAvoid.Length > 2 && mealText.Contains(cleanAvoid))
                        {
                            result.Errors.Add($"Preference violation: Meal '{meal.Name}' contains avoided item '{cleanAvoid}'.");
                        }
                    }
                }
            }

            // 6. Calorie Tolerance Check (±20% allowed from TargetCalories)
            if (targets.TargetCalories > 0)
            {
                double ratio = (double)dailyCalorieSum / targets.TargetCalories;
                if (ratio < 0.75 || ratio > 1.25)
                {
                    result.Warnings.Add($"Day {dayIndex} total calories ({dailyCalorieSum} kcal) deviates by more than 25% from daily target ({targets.TargetCalories} kcal).");
                }
            }

            dayIndex++;
        }

        return result;
    }
}
