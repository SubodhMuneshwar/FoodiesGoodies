using FoodiesGoodies.Api.DTOs.Diet;

namespace FoodiesGoodies.Api.Services.Cuisine;

public class CuisineProfileService : ICuisineProfileService
{
    private static readonly List<CuisineContextDto> Profiles = new()
    {
        // 1. India - Maharashtra (Maharashtrian)
        new CuisineContextDto
        {
            Country = "India",
            Region = "Maharashtra",
            Name = "Maharashtrian",
            Flag = "🇮🇳",
            Description = "Nutritious and balanced Marathi culinary tradition featuring ancient millets (jowar, bajra), sprouted legumes (usal), tangy kokum, and roasted peanut or coconut gravies with goda masala.",
            StapleGrainsAndProteins = "Jowar Bhakri, Sprouted Matki/Moong Usal, Poha, Pitla (Gram Flour), Toor Dal, Fresh Curd, Fish Curry",
            KeySpices = "Goda Masala, Kokum, Mustard Seeds, Curry Leaves, Hing (Asafoetida), Fresh Coriander, Turmeric",
            DigestiveTradition = "Sip warm water tempered with cumin and ajwain, or digestive Solkadhi (kokum and coconut milk)."
        },
        // 2. India - Punjab / North Indian
        new CuisineContextDto
        {
            Country = "India",
            Region = "Punjab",
            Name = "North Indian",
            Flag = "🇮🇳",
            Description = "Wholesome and hearty North Indian heritage centered around slow-simmered dals, tandoori grills, rich paneer curries, and whole wheat phulkas.",
            StapleGrainsAndProteins = "Whole Wheat Phulkas, Besan Chilla, Yellow Dal Tadka, Rajma, Chana Masala, Paneer, Lean Chicken",
            KeySpices = "Garam Masala, Kasuri Methi, Fresh Ginger, Garlic, Cumin, Coriander Powder, Green Chillies",
            DigestiveTradition = "Sip warm cumin-fennel infusion (CCF water) or chaas (spiced buttermilk with roasted jeera) post meal."
        },
        // 3. India - South India (Tamil Nadu, Karnataka, Kerala, Andhra)
        new CuisineContextDto
        {
            Country = "India",
            Region = "South India",
            Name = "South Indian",
            Flag = "🇮🇳",
            Description = "Aromatic, gut-healthy culinary tradition emphasizing fermented rice-lentil batters, protein-rich sambar, medicinal rasam, ragi, and fresh coconut tempering.",
            StapleGrainsAndProteins = "Steamed Idli, Ragi Mudde/Dosa, Toor Dal Sambar, Urad Dal, Curd Rice, Coastal Fish, Boiled Eggs",
            KeySpices = "Curry Leaves, Black Mustard Seeds, Black Pepper, Tamarind, Asafetida, Dry Red Chillies",
            DigestiveTradition = "Enjoy freshly brewed warm pepper-cumin rasam to stimulate digestive Agni."
        },
        // 4. India - Gujarat
        new CuisineContextDto
        {
            Country = "India",
            Region = "Gujarat",
            Name = "Gujarati",
            Flag = "🇮🇳",
            Description = "Gentle, wholesome vegetarian diet featuring sprouted legumes, multi-grain theplas, vegetable-rich khichdi, and delicate yogurt kadhis.",
            StapleGrainsAndProteins = "Whole Wheat & Methi Thepla, Moong Dal Khichdi, Gujarati Kadhi, Sprouted Moong, Steamed Dhokla",
            KeySpices = "Cumin, Mustard Seeds, Sesame Seeds, Fresh Ginger, Ajwain, Cinnamon, Jaggery touch",
            DigestiveTradition = "Warm ajwain water or roasted mukhwas (fennel, flax seeds, and sesame) after meals."
        },
        // 5. India - Ayurvedic Sattvic
        new CuisineContextDto
        {
            Country = "India",
            Region = "Pan-India",
            Name = "Ayurvedic Sattvic",
            Flag = "🌿",
            Description = "Mindful, pure vegetarian diet prepared without onion or garlic. Prioritizes easily digestible yellow mung dal, cow ghee, ash gourd, and freshly ground spices.",
            StapleGrainsAndProteins = "Yellow Mung Dal, Cow Ghee, Ash Gourd (Petha), Lauki (Bottle Gourd), Soaked Almonds, Quinoa, Seasonal Greens",
            KeySpices = "Cumin, Coriander, Fennel, Green Cardamom, Fresh Turmeric, Rock Salt (Saindhava Lavana)",
            DigestiveTradition = "Warm cumin, coriander, and fennel tea (CCF tea) sipped throughout the day for Agni balance."
        },
        // 6. India - General Pan-Indian
        new CuisineContextDto
        {
            Country = "India",
            Region = "National",
            Name = "Pan-Indian Balanced Thali",
            Flag = "🇮🇳",
            Description = "Classic Indian Thali harmony providing complete plant protein, dietary fiber, and vibrant antioxidants through lentils, flatbreads, and seasonal sabzis.",
            StapleGrainsAndProteins = "Whole Wheat Rotis, Dal Palak, Mixed Sprouts, Homemade Dahi, Roasted Makhana, Seasonal Vegetables",
            KeySpices = "Turmeric, Cumin, Mustard, Fresh Ginger, Coriander, Black Pepper",
            DigestiveTradition = "Mindful eating with warm water and fresh ginger-lemon slices before meals."
        },
        // 7. Greece & Italy - Mediterranean
        new CuisineContextDto
        {
            Country = "Greece & Italy",
            Region = "Mediterranean",
            Name = "Mediterranean",
            Flag = "🇬🇷 🇮🇹",
            Description = "Renowned longevity blueprint rich in cold-pressed extra virgin olive oil, wild fish, legumes, fresh garden herbs, and antioxidant-rich ancient grains.",
            StapleGrainsAndProteins = "Wild Salmon/Sea Bass, Chickpeas, French Lentils, Farro, Greek Yogurt, Artisanal Feta, Walnuts",
            KeySpices = "Extra Virgin Olive Oil, Dried Oregano, Rosemary, Fresh Basil, Garlic, Lemon Zest, Sea Salt",
            DigestiveTradition = "Herbal mountain tea (Greek ironwort) or chamomile and fresh lemon infusion."
        },
        // 8. Japan - Washoku
        new CuisineContextDto
        {
            Country = "Japan",
            Region = "Honshu",
            Name = "Japanese",
            Flag = "🇯🇵",
            Description = "Principles of Washoku (harmony of food): clean steaming, probiotic fermented miso, umami dashi broths, omega-3 seafood, and seasonal vegetables.",
            StapleGrainsAndProteins = "Fermented Red/White Miso, Firm Tofu, Edamame, Wild Salmon, Buckwheat Soba, Brown Rice, Wakame",
            KeySpices = "Kombu/Shiitake Dashi, Fresh Ginger, White Sesame, Nori Seaweed, Shiso, Green Tea (Sencha/Matcha)",
            DigestiveTradition = "Hot Genmaicha (toasted brown rice green tea) or miso soup to aid gut flora."
        },
        // 9. South Korea - Hansik
        new CuisineContextDto
        {
            Country = "South Korea",
            Region = "National",
            Name = "Korean",
            Flag = "🇰🇷",
            Description = "Nutrient-dense Hansik cuisine powered by naturally fermented kimchi, mineral-rich sea greens, brown/purple rice, and banchan vegetable dishes.",
            StapleGrainsAndProteins = "Kimchi, Fermented Doenjang, Silken/Firm Tofu, Purple Rice, Steamed White Fish, Soft Boiled Eggs",
            KeySpices = "Gochugaru (Korean Chili Flakes), Garlic, Scallions, Toasted Sesame Oil, Roasted Sesame Seeds",
            DigestiveTradition = "Warm barley tea (Bori-cha) served throughout meals for smooth digestion."
        },
        // 10. Mexico
        new CuisineContextDto
        {
            Country = "Mexico",
            Region = "Central & Oaxaca",
            Name = "Mexican",
            Flag = "🇲🇽",
            Description = "Traditional pre-Hispanic and colonial culinary heritage emphasizing slow-cooked black beans, fresh avocado, heirloom corn, grilled lean meats, and vibrant salsas.",
            StapleGrainsAndProteins = "Heirloom Corn Tortillas, Black Beans, Pinto Beans, Hass Avocado, Grilled Chicken Breast, Cotija Cheese",
            KeySpices = "Fresh Cilantro, Cumin, Mexican Oregano, Fresh Lime, Jalapeño, Garlic, Roasted Poblano",
            DigestiveTradition = "Warm chamomile or cinnamon-infused herbal infusion."
        },
        // 11. Middle East & Levant
        new CuisineContextDto
        {
            Country = "Lebanon & Levant",
            Region = "Middle East",
            Name = "Middle Eastern",
            Flag = "🇱🇧",
            Description = "Plant-forward Levantine dining celebrating creamy tahini, whole chickpeas, brown lentils, fragrant za'atar, and olive oil dressed crisp parsley salads.",
            StapleGrainsAndProteins = "Chickpeas, Tahini, Brown Lentils, Bulgur, Grilled Chicken Kebab, Halloumi, Walnuts",
            KeySpices = "Za'atar, Ground Sumac, Fresh Mint, Lemon Juice, Extra Virgin Olive Oil, Garlic, Cumin",
            DigestiveTradition = "Fresh mint tea (Shai bil Na'na) served warm without refined sugar."
        },
        // 12. United States & Canada
        new CuisineContextDto
        {
            Country = "United States",
            Region = "North America",
            Name = "American Farm-to-Table",
            Flag = "🇺🇸",
            Description = "Modern whole-food nutrition focusing on organic local vegetables, steel-cut oats, wild rice, pasture-raised eggs, and sustainable lean proteins.",
            StapleGrainsAndProteins = "Steel-Cut Oats, Wild Rice, Sweet Potatoes, Pasture Eggs, Free-Range Turkey, Wild Salmon, Quinoa",
            KeySpices = "Fresh Rosemary, Thyme, Smoked Paprika, Sage, Cracked Black Pepper, Apple Cider Vinegar",
            DigestiveTradition = "Apple cider vinegar diluted in warm water before meals, or ginger-lemon tea."
        },
        // 13. Global Clean Fusion
        new CuisineContextDto
        {
            Country = "International",
            Region = "Global",
            Name = "Global Clean Fusion",
            Flag = "🌍",
            Description = "Modern functional nutrition blending nutrient-dense superfoods, vibrant macro bowls, organic ancient grains, and probiotic dressings from around the world.",
            StapleGrainsAndProteins = "Tri-Color Quinoa, Edamame, Tempeh, Wild Blueberries, Hemp Hearts, Hass Avocado, Chia Seeds",
            KeySpices = "Fresh Ginger, Turmeric, Lemon Tahini, Apple Cider Vinaigrette, Tamari, Nutritional Yeast",
            DigestiveTradition = "Fresh lemon and ginger warm infusion to promote optimal hydration and gut motility."
        }
    };

    public CuisineContextDto ResolveProfile(string? country, string? region, string? cuisine)
    {
        var cleanCuisine = (cuisine ?? string.Empty).Trim().ToLowerInvariant();
        var cleanRegion = (region ?? string.Empty).Trim().ToLowerInvariant();
        var cleanCountry = (country ?? string.Empty).Trim().ToLowerInvariant();

        // 1. Exact or partial match on Cuisine Name
        var match = Profiles.FirstOrDefault(p =>
            cleanCuisine.Length > 0 &&
            (p.Name.ToLowerInvariant().Contains(cleanCuisine) || cleanCuisine.Contains(p.Name.ToLowerInvariant())));

        // 2. Match on Region
        if (match == null && cleanRegion.Length > 0)
        {
            match = Profiles.FirstOrDefault(p =>
                p.Region.ToLowerInvariant().Contains(cleanRegion) || cleanRegion.Contains(p.Region.ToLowerInvariant()));
        }

        // 3. Match on Country
        if (match == null && cleanCountry.Length > 0)
        {
            match = Profiles.FirstOrDefault(p =>
                p.Country.ToLowerInvariant().Contains(cleanCountry) || cleanCountry.Contains(p.Country.ToLowerInvariant()));
        }

        // 4. Default to Pan-Indian or Global if no match found
        match ??= Profiles[0];

        // Return a copy honoring the user's explicit country and region if provided
        return new CuisineContextDto
        {
            Country = !string.IsNullOrWhiteSpace(country) ? country.Trim() : match.Country,
            Region = !string.IsNullOrWhiteSpace(region) ? region.Trim() : match.Region,
            Name = !string.IsNullOrWhiteSpace(cuisine) ? cuisine.Trim() : match.Name,
            Flag = match.Flag,
            Description = match.Description,
            StapleGrainsAndProteins = match.StapleGrainsAndProteins,
            KeySpices = match.KeySpices,
            DigestiveTradition = match.DigestiveTradition
        };
    }

    public IReadOnlyList<CuisineContextDto> GetAllProfiles() => Profiles.AsReadOnly();

    public IReadOnlyList<string> GetSupportedCountries() =>
        Profiles.Select(p => p.Country).Distinct().ToList().AsReadOnly();
}
