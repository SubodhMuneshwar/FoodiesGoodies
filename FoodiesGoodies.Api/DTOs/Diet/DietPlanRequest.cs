using System.ComponentModel.DataAnnotations;

namespace FoodiesGoodies.Api.DTOs.Diet;

public class DietPlanRequest
{
    [Range(10, 110, ErrorMessage = "Age must be between 10 and 110.")]
    public int Age { get; set; } = 24;

    [Required]
    public string Gender { get; set; } = "female"; // "male", "female", "other"

    [Range(60.0, 260.0, ErrorMessage = "Height must be between 60cm and 260cm.")]
    public double HeightCm { get; set; } = 165.0;

    [Range(20.0, 350.0, ErrorMessage = "Weight must be between 20kg and 350kg.")]
    public double WeightKg { get; set; } = 65.0;

    [Required]
    public string ActivityLevel { get; set; } = "moderate"; // "sedentary", "light", "moderate", "very_active", "extra_active"

    [Required]
    public string Goal { get; set; } = "maintenance"; // "fat_loss", "maintenance", "muscle_gain", "energy"

    [Required]
    public string Country { get; set; } = "India";

    public string Region { get; set; } = "Maharashtra";

    [Required]
    public string Cuisine { get; set; } = "Maharashtrian";

    [Required]
    public string DietPreference { get; set; } = "omnivore"; // "omnivore", "vegetarian", "vegan", "pescatarian", "keto"

    public List<string> Allergies { get; set; } = new();

    public List<string> FoodsToAvoid { get; set; } = new();

    public List<string> FavoriteFoods { get; set; } = new();

    [Range(3, 5, ErrorMessage = "Meal count must be between 3 and 5 meals per day.")]
    public int MealCount { get; set; } = 4; // 3, 4, 5

    public string Budget { get; set; } = "moderate"; // "low", "moderate", "flexible"

    [Range(10, 120, ErrorMessage = "Max cooking time must be between 10 and 120 minutes.")]
    public int MaxCookingTimeMinutes { get; set; } = 30;

    public string CookingSkill { get; set; } = "intermediate"; // "beginner", "intermediate", "advanced"
}
