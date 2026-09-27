using FoodiesGoodies.Api.DTOs.Diet;

namespace FoodiesGoodies.Api.Services.Diet;

/// <summary>
/// Authoritative economic calculation engine for estimating localized dietary costs
/// across day, week, month, and year based on country, regional staples, and budget tiers.
/// </summary>
public static class DietCostCalculator
{
    public static DietCostEstimateDto CalculateCostEstimate(DietPlanRequest request, CuisineContextDto? cuisine = null)
    {
        ArgumentNullException.ThrowIfNull(request);

        string country = (request.Country ?? "India").Trim();
        string budget = (request.Budget ?? "moderate").Trim().ToLowerInvariant();
        string diet = (request.DietPreference ?? "omnivore").Trim().ToLowerInvariant();
        int mealCount = Math.Clamp(request.MealCount, 3, 5);

        string currencySymbol;
        string currencyCode;
        decimal baseDailyCost;
        string regionalMarketNote;
        string smartSavingTip;

        switch (country.ToLowerInvariant())
        {
            case "india":
                currencySymbol = "₹";
                currencyCode = "INR";
                baseDailyCost = budget switch
                {
                    "low" => 190m,
                    "flexible" => 480m,
                    _ => 290m
                };
                regionalMarketNote = $"Estimated based on local mandi and retail market rates for seasonal produce, whole lentils, grains, and dairy in {request.Region ?? "India"}.";
                smartSavingTip = "Purchasing whole pulses (dals), brown rice, and regional cold-pressed oils in monthly bulk allotments can reduce grocery costs by up to 20%.";
                break;

            case "united states":
            case "usa":
            case "us":
                currencySymbol = "$";
                currencyCode = "USD";
                baseDailyCost = budget switch
                {
                    "low" => 12.50m,
                    "flexible" => 34.00m,
                    _ => 19.50m
                };
                regionalMarketNote = $"Calibrated to average North American supermarket prices for fresh produce, lean proteins, and pantry staples in {request.Region ?? "the US"}.";
                smartSavingTip = "Batch-cooking grains and purchasing frozen unseasoned vegetables and family-pack proteins saves approximately 22% weekly.";
                break;

            case "united kingdom":
            case "uk":
                currencySymbol = "£";
                currencyCode = "GBP";
                baseDailyCost = budget switch
                {
                    "low" => 8.50m,
                    "flexible" => 25.00m,
                    _ => 14.50m
                };
                regionalMarketNote = $"Reflecting British high-street supermarket and local grocer price indices across {request.Region ?? "the UK"}.";
                smartSavingTip = "Utilizing seasonal British greens, tinned legumes, and supermarket loyalty rewards can lower monthly food bills by £35-£50.";
                break;

            case "canada":
                currencySymbol = "$";
                currencyCode = "CAD";
                baseDailyCost = budget switch
                {
                    "low" => 14.00m,
                    "flexible" => 38.00m,
                    _ => 22.00m
                };
                regionalMarketNote = $"Based on Canadian grocery retail indices across {request.Region ?? "provinces"} including fresh dairy, grains, and produce.";
                smartSavingTip = "Buying store-brand whole grains and shopping weekly flyers for seasonal produce yields significant savings.";
                break;

            case "australia":
                currencySymbol = "$";
                currencyCode = "AUD";
                baseDailyCost = budget switch
                {
                    "low" => 15.00m,
                    "flexible" => 40.00m,
                    _ => 24.00m
                };
                regionalMarketNote = $"Estimated from Australian metropolitan and regional produce and protein retail baselines in {request.Region ?? "Australia"}.";
                smartSavingTip = "Shopping at community farmers markets at weekend closing hours often cuts fresh fruit and vegetable costs by 30%.";
                break;

            case "japan":
                currencySymbol = "¥";
                currencyCode = "JPY";
                baseDailyCost = budget switch
                {
                    "low" => 1400m,
                    "flexible" => 4200m,
                    _ => 2400m
                };
                regionalMarketNote = $"Calibrated to Japanese local shotengai and supermarket baselines for rice, miso, fresh fish, and tofu in {request.Region ?? "Japan"}.";
                smartSavingTip = "Purchasing staple grains in 5kg sacks and opting for seasonal local root vegetables optimizes nutritional value and budget.";
                break;

            case "south korea":
                currencySymbol = "₩";
                currencyCode = "KRW";
                baseDailyCost = budget switch
                {
                    "low" => 12000m,
                    "flexible" => 38000m,
                    _ => 22000m
                };
                regionalMarketNote = $"Reflecting traditional and hypermarket retail benchmarks in {request.Region ?? "South Korea"}.";
                smartSavingTip = "Preparing homemade banchan in weekly batches dramatically decreases individual meal costs.";
                break;

            case "france":
            case "italy":
            case "greece":
                currencySymbol = "€";
                currencyCode = "EUR";
                baseDailyCost = budget switch
                {
                    "low" => 9.50m,
                    "flexible" => 28.00m,
                    _ => 16.50m
                };
                regionalMarketNote = $"Based on Mediterranean and EU market baselines for olive oil, legumes, seasonal vegetables, and whole foods in {request.Region ?? country}.";
                smartSavingTip = "Sourcing pulses, olive oil, and bread from local outdoor markets provides fresher ingredients at lower unit costs.";
                break;

            case "mexico":
                currencySymbol = "$";
                currencyCode = "MXN";
                baseDailyCost = budget switch
                {
                    "low" => 150m,
                    "flexible" => 420m,
                    _ => 240m
                };
                regionalMarketNote = $"Based on Mexican traditional tianguis and grocery market staples in {request.Region ?? "Mexico"}.";
                smartSavingTip = "Buying dried beans, heirloom maize, and seasonal chiles in bulk from local mercados saves up to 25%.";
                break;

            default:
                currencySymbol = "$";
                currencyCode = "USD";
                baseDailyCost = budget switch
                {
                    "low" => 12.00m,
                    "flexible" => 32.00m,
                    _ => 18.00m
                };
                regionalMarketNote = $"Estimated international baseline for balanced home-cooked whole food nutrition.";
                smartSavingTip = "Prioritizing locally grown seasonal produce and whole dried grains significantly optimizes meal investment.";
                break;
        }

        // Adjust for dietary constraints
        if (diet == "keto")
        {
            baseDailyCost *= 1.18m; // Healthy fats, nuts, high-quality proteins
        }
        else if (diet == "pescatarian")
        {
            baseDailyCost *= 1.12m;
        }
        else if (diet is "vegan" or "vegetarian")
        {
            baseDailyCost *= 0.88m; // Legumes, grains, and tofu are highly cost-efficient
        }

        // Adjust for meal count (3 meals is baseline 0.92, 4 is 1.0, 5 is 1.08)
        decimal mealFactor = mealCount switch
        {
            3 => 0.92m,
            5 => 1.08m,
            _ => 1.00m
        };

        decimal daily = Math.Round(baseDailyCost * mealFactor, currencyCode is "JPY" or "KRW" ? 0 : 2);
        decimal weekly = Math.Round(daily * 7, currencyCode is "JPY" or "KRW" ? 0 : 2);
        decimal monthly = Math.Round(daily * 30, currencyCode is "JPY" or "KRW" ? 0 : 2);
        decimal yearly = Math.Round(daily * 365, currencyCode is "JPY" or "KRW" ? 0 : 2);

        string costTier = budget switch
        {
            "low" => "Budget-Friendly / Economical",
            "flexible" => "Premium / Artisan & Organic",
            _ => "Balanced Everyday Value"
        };

        return new DietCostEstimateDto
        {
            CurrencySymbol = currencySymbol,
            CurrencyCode = currencyCode,
            DailyCost = daily,
            WeeklyCost = weekly,
            MonthlyCost = monthly,
            YearlyCost = yearly,
            CostTier = costTier,
            PricingNotes = regionalMarketNote,
            MoneySavingTip = smartSavingTip
        };
    }

    public static string GetCurrencySymbol(string? country)
    {
        return (country ?? string.Empty).Trim().ToLowerInvariant() switch
        {
            "india" => "₹",
            "united kingdom" or "uk" => "£",
            "japan" => "¥",
            "south korea" => "₩",
            "france" or "italy" or "greece" or "germany" or "spain" => "€",
            _ => "$"
        };
    }

    public static string GetCurrencyCode(string? country)
    {
        return (country ?? string.Empty).Trim().ToLowerInvariant() switch
        {
            "india" => "INR",
            "united kingdom" or "uk" => "GBP",
            "japan" => "JPY",
            "south korea" => "KRW",
            "canada" => "CAD",
            "australia" => "AUD",
            "mexico" => "MXN",
            "france" or "italy" or "greece" or "germany" or "spain" => "EUR",
            _ => "USD"
        };
    }
}
