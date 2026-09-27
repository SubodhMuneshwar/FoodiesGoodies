using System.Text.Json.Serialization;

namespace FoodiesGoodies.Api.DTOs.Diet;

/// <summary>
/// Tentative lump-sum economic cost breakdown for the personalized diet schedule across day, week, month, and year.
/// </summary>
public class DietCostEstimateDto
{
    [JsonPropertyName("currencySymbol")]
    public string CurrencySymbol { get; set; } = "₹";

    [JsonPropertyName("currencyCode")]
    public string CurrencyCode { get; set; } = "INR";

    [JsonPropertyName("dailyCost")]
    public decimal DailyCost { get; set; }

    [JsonPropertyName("weeklyCost")]
    public decimal WeeklyCost { get; set; }

    [JsonPropertyName("monthlyCost")]
    public decimal MonthlyCost { get; set; }

    [JsonPropertyName("yearlyCost")]
    public decimal YearlyCost { get; set; }

    [JsonPropertyName("costTier")]
    public string CostTier { get; set; } = "Moderate"; // "Budget-Friendly", "Moderate", "Premium / Organic"

    [JsonPropertyName("pricingNotes")]
    public string PricingNotes { get; set; } = string.Empty;

    [JsonPropertyName("moneySavingTip")]
    public string MoneySavingTip { get; set; } = string.Empty;
}
