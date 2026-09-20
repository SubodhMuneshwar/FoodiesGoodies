/**
 * FoodiesGoodies - Live Edamam Recipe Search Integration & Resilient Culinary Vault
 * Connects to the EDAMAM Recipe Search API v2 via ASP.NET Core server-side proxy.
 * Provides resilient, automatic fallback to the FoodiesGoodies Curated Culinary Vault
 * ensuring users never encounter 404 or connection failures on static servers or previews.
 */

document.addEventListener('DOMContentLoaded', () => {
    const searchForm = document.querySelector('#recipeSearchForm');
    const searchInput = document.querySelector('#search');
    const resultsList = document.querySelector('#results');
    const quickTags = document.querySelectorAll('.quick-tag');

    let nextPaginationCursor = null;
    let currentSearchQuery = '';
    let currentHitsList = [];
    let isVaultMode = false;
    let vaultRemainingHits = [];

    if (!searchForm || !searchInput || !resultsList) {
        return;
    }

    // =========================================================================
    // 1. Curated Gourmet Culinary Vault (Offline & Standalone Resilience)
    // =========================================================================
    const CURATED_RECIPE_VAULT = [
        // PIZZA
        {
            label: 'Wood-Fired Truffle Margherita Pizza',
            image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=800&q=80',
            url: 'https://foodiesgoodies.com/pages/recipe.html?id=1',
            source: 'Chef Gabriella Russo',
            calories: 2040,
            yield: 3,
            totalTime: 25,
            cuisineType: ['Italian'],
            mealType: ['lunch/dinner'],
            dietLabels: ['Balanced'],
            healthLabels: ['Vegetarian', 'Egg-Free', 'Peanut-Free'],
            ingredientLines: [
                '500g 00 Italian Flour & Semolina dusting',
                '320ml Warm Filtered Water',
                '7g Active Dry Yeast & Extra Virgin Olive Oil',
                '200g Fresh Buffalo Mozzarella DOP, sliced',
                '1 cup San Marzano Tomato Sauce',
                '1 tbsp White Truffle Oil',
                'Fresh Sweet Basil Leaves'
            ]
        },
        {
            label: 'Artisan Pepperoni & Hot Honey Crust Pizza',
            image: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?auto=format&fit=crop&w=800&q=80',
            url: 'https://foodiesgoodies.com/pages/recipe.html?id=2',
            source: 'Chef Marco Rossi',
            calories: 2960,
            yield: 4,
            totalTime: 20,
            cuisineType: ['Italian-American'],
            mealType: ['lunch/dinner'],
            dietLabels: ['High-Protein'],
            healthLabels: ['Egg-Free', 'Nut-Free'],
            ingredientLines: [
                '1 ball Artisan Slow-Fermented Pizza Dough',
                '1 cup Spiced San Marzano Marinara Sauce',
                '2 cups Whole Milk Low-Moisture Mozzarella',
                '4 oz Crispy Cup-and-Char Pepperoni',
                '2 tbsp Hot Calabrian Chili Honey',
                'Fresh Oregano Leaves & Crushed Red Pepper'
            ]
        },
        {
            label: 'Quattro Formaggi White Flatbread Pizza',
            image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80',
            url: 'https://foodiesgoodies.com/pages/recipe.html?id=3',
            source: 'Chef Luca Ferrari',
            calories: 1860,
            yield: 3,
            totalTime: 18,
            cuisineType: ['Italian'],
            mealType: ['lunch/dinner'],
            dietLabels: ['Balanced'],
            healthLabels: ['Vegetarian', 'Peanut-Free'],
            ingredientLines: [
                '1 ball Hand-Stretched Neapolitan Pizza Dough',
                '3 tbsp Extra Virgin Olive Oil & Roasted Garlic Puree',
                '100g Gorgonzola Dolce DOP',
                '120g Fontina Val d\'Aosta',
                '150g Fresh Buffalo Mozzarella',
                '50g Aged Parmigiano Reggiano, shaved',
                'Fresh Rosemary Needles'
            ]
        },
        {
            label: 'Fig, Prosciutto & Goat Cheese Pizza',
            image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=800&q=80',
            url: 'https://foodiesgoodies.com/pages/recipe.html?id=4',
            source: 'Chef Sophia Vance',
            calories: 1180,
            yield: 2,
            totalTime: 22,
            cuisineType: ['Mediterranean'],
            mealType: ['lunch/dinner'],
            dietLabels: ['Balanced'],
            healthLabels: ['Egg-Free', 'Nut-Free'],
            ingredientLines: [
                '8 oz Hand-Stretched Sourdough Pizza Crust',
                '3 tbsp Black Mission Fig Preserve',
                '4 slices Prosciutto di Parma',
                '80g Creamy Goat Cheese (Chèvre)',
                '1 cup Baby Wild Arugula',
                '1 tbsp Aged Modena Balsamic Glaze'
            ]
        },

        // PASTA
        {
            label: 'Creamy Tuscan Garlic Butter Chicken Fettuccine',
            image: 'https://images.unsplash.com/photo-1621996346565-e3d5d6281691?auto=format&fit=crop&w=800&q=80',
            url: 'https://foodiesgoodies.com/pages/recipe.html?id=5',
            source: 'Chef Alex Morgan',
            calories: 2600,
            yield: 4,
            totalTime: 30,
            cuisineType: ['Italian'],
            mealType: ['lunch/dinner'],
            dietLabels: ['High-Protein'],
            healthLabels: ['Egg-Free', 'Nut-Free'],
            ingredientLines: [
                '400g Bronze-Die Fettuccine',
                '2 Organic Chicken Breasts, pan-seared',
                '4 cloves Garlic, minced',
                '1/2 cup Sun-Dried Tomatoes in Olive Oil',
                '2 cups Fresh Baby Spinach',
                '1 cup Heavy Whipping Cream',
                '1 cup Freshly Grated Parmigiano Reggiano'
            ]
        },
        {
            label: 'Slow-Simmered Tagliatelle alla Bolognese',
            image: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=800&q=80',
            url: 'https://foodiesgoodies.com/pages/recipe.html?id=6',
            source: 'Chef Matteo Bruni',
            calories: 2320,
            yield: 4,
            totalTime: 45,
            cuisineType: ['Italian'],
            mealType: ['lunch/dinner'],
            dietLabels: ['High-Protein'],
            healthLabels: ['Nut-Free'],
            ingredientLines: [
                '400g Fresh Egg Tagliatelle',
                '300g Minced Prime Beef Chuck',
                '100g Pancetta, diced',
                '1 cup Mirepoix (Celery, Carrot, Onion)',
                '1 cup Dry Italian Red Wine',
                '2 cups Crushed San Marzano Tomatoes',
                '1/2 cup Whole Milk',
                'Aged Parmigiano Reggiano'
            ]
        },
        {
            label: 'Wild Forest Mushroom Truffle Pappardelle',
            image: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=800&q=80',
            url: 'https://foodiesgoodies.com/pages/recipe.html?id=7',
            source: 'Chef Gabriella Russo',
            calories: 1530,
            yield: 3,
            totalTime: 25,
            cuisineType: ['Italian'],
            mealType: ['lunch/dinner'],
            dietLabels: ['Balanced'],
            healthLabels: ['Vegetarian', 'Peanut-Free'],
            ingredientLines: [
                '350g Hand-Cut Fresh Pappardelle',
                '300g Mixed Wild Chanterelles & Cremini Mushrooms',
                '3 tbsp French Normandy Butter',
                '2 Shallots & 3 cloves Garlic, finely diced',
                '1/3 cup Dry White Wine',
                '1 tbsp Pure Black Truffle Carpaccio Oil',
                'Fresh Thyme & Shaved Pecorino Romano'
            ]
        },

        // BURGERS
        {
            label: 'Prime Angus Truffle Smash Burger',
            image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80',
            url: 'https://foodiesgoodies.com/pages/recipe.html?id=8',
            source: 'Chef David Sterling',
            calories: 1440,
            yield: 2,
            totalTime: 20,
            cuisineType: ['American'],
            mealType: ['lunch/dinner'],
            dietLabels: ['High-Protein'],
            healthLabels: ['Nut-Free'],
            ingredientLines: [
                '2 Toasted Brioche Buns with Butter',
                '4 x 80g Prime Angus Beef Balls (80/20 Chuck Blend)',
                '4 slices Aged Sharp Yellow Cheddar',
                '3 tbsp Caramelized Onion & Bacon Jam',
                '2 tbsp Black Truffle Garlic Aioli',
                'Kosher Salt & Freshly Cracked Pepper'
            ]
        },
        {
            label: 'Smoked Gouda & Portobello Crunch Burger',
            image: 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=800&q=80',
            url: 'https://foodiesgoodies.com/pages/recipe.html?id=9',
            source: 'Chef Elena Rostova',
            calories: 1080,
            yield: 2,
            totalTime: 25,
            cuisineType: ['American'],
            mealType: ['lunch/dinner'],
            dietLabels: ['Balanced'],
            healthLabels: ['Vegetarian'],
            ingredientLines: [
                '2 Golden Brioche Buns, toasted',
                '2 Large Portobello Mushroom Caps, balsamic-garlic marinated',
                '2 slices Dutch Smoked Gouda Cheese',
                '1/2 cup Crispy French Fried Shallots',
                '1 cup Wild Peppery Baby Arugula',
                '2 tbsp Roasted Garlic Herb Remoulade'
            ]
        },

        // DONUTS
        {
            label: 'Tahitian Vanilla Bean Glazed Brioche Donuts',
            image: 'https://images.unsplash.com/photo-1527515862127-a4fc05baf7a5?auto=format&fit=crop&w=800&q=80',
            url: 'https://foodiesgoodies.com/pages/recipe.html?id=10',
            source: 'Chef Camille Laurent',
            calories: 1920,
            yield: 6,
            totalTime: 35,
            cuisineType: ['French'],
            mealType: ['dessert/breakfast'],
            dietLabels: ['Vegetarian'],
            healthLabels: ['Vegetarian', 'Nut-Free'],
            ingredientLines: [
                '500g Enriched Brioche Dough (24-hour slow proof)',
                '2 cups Confectioners Sugar',
                '1/4 cup Whole Farmhouse Milk',
                '1 Whole Tahitian Vanilla Bean, split & scraped',
                'Pinch of Maldon Flaky Sea Salt',
                'Canola Oil for Golden Frying'
            ]
        },
        {
            label: 'Dark Belgian Chocolate Espresso Cronuts',
            image: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=800&q=80',
            url: 'https://foodiesgoodies.com/pages/recipe.html?id=11',
            source: 'Chef Camille Laurent',
            calories: 2340,
            yield: 6,
            totalTime: 40,
            cuisineType: ['French'],
            mealType: ['dessert/breakfast'],
            dietLabels: ['Vegetarian'],
            healthLabels: ['Vegetarian'],
            ingredientLines: [
                '1 batch Laminated Croissant Pastry Dough',
                '150g Belgian 72% Dark Chocolate Ganache',
                '2 shots Fresh Espresso (crema-rich)',
                '1/2 cup Heavy Cream',
                'Dark Cocoa Nibs for Garnish'
            ]
        },

        // SALADS
        {
            label: 'Mediterranean Quinoa & Burrata Harvest Bowl',
            image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80',
            url: 'https://foodiesgoodies.com/pages/recipe.html?id=12',
            source: 'Chef Sarah Jenkins',
            calories: 840,
            yield: 2,
            totalTime: 15,
            cuisineType: ['Mediterranean'],
            mealType: ['lunch/dinner'],
            dietLabels: ['High-Fiber', 'Balanced'],
            healthLabels: ['Vegetarian', 'Gluten-Free'],
            ingredientLines: [
                '2 cups Fluffy Cooked Tri-Color Quinoa',
                '1 Fresh Italian Burrata Ball (200g), torn',
                '1 cup Heirloom Sweet Cherry Tomatoes, halved',
                '1/2 cup Kalamata Olives, pitted',
                '1 Crisp English Cucumber, diced',
                '3 tbsp Extra Virgin Olive Oil & Lemon Oregano Vinaigrette',
                'Fresh Mint Leaves'
            ]
        },
        {
            label: 'Grilled Peach, Prosciutto & Wild Arugula Salad',
            image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80',
            url: 'https://foodiesgoodies.com/pages/recipe.html?id=13',
            source: 'Chef Sarah Jenkins',
            calories: 760,
            yield: 2,
            totalTime: 15,
            cuisineType: ['Mediterranean'],
            mealType: ['lunch/dinner'],
            dietLabels: ['Balanced'],
            healthLabels: ['Gluten-Free'],
            ingredientLines: [
                '2 Ripe Yellow Peaches, quartered & grilled',
                '4 slices Crispy Prosciutto di Parma',
                '3 cups Fresh Wild Baby Arugula',
                '1/3 cup Candied Pecans',
                '60g Crumbled Creamy Goat Cheese',
                '2 tbsp White Balsamic Vinegar & Olive Oil'
            ]
        },

        // TACOS
        {
            label: 'Baja Crispy Wild Pacific Cod Tacos',
            image: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=800&q=80',
            url: 'https://foodiesgoodies.com/pages/recipe.html?id=14',
            source: 'Chef Javier Morales',
            calories: 1440,
            yield: 3,
            totalTime: 25,
            cuisineType: ['Mexican'],
            mealType: ['lunch/dinner'],
            dietLabels: ['High-Protein'],
            healthLabels: ['Pescatarian', 'Nut-Free'],
            ingredientLines: [
                '1 lb Fresh Wild Pacific Cod Fillets, cut into strips',
                '1 cup Mexican Light Cerveza & Masa Harina Batter',
                '6 Warm White Corn Tortillas',
                '2 cups Shredded Purple Cabbage with Lime & Cilantro',
                '1/2 cup Smoky Chipotle Crema',
                'Fresh Pico de Gallo & Lime Wedges'
            ]
        },
        {
            label: 'Slow-Braised Birria de Res Short Rib Tacos',
            image: 'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?auto=format&fit=crop&w=800&q=80',
            url: 'https://foodiesgoodies.com/pages/recipe.html?id=15',
            source: 'Chef Javier Morales',
            calories: 2480,
            yield: 4,
            totalTime: 40,
            cuisineType: ['Mexican'],
            mealType: ['lunch/dinner'],
            dietLabels: ['High-Protein'],
            healthLabels: ['Nut-Free'],
            ingredientLines: [
                '1.5 lbs Bone-in Beef Short Ribs, slow-braised in Guajillo Broth',
                '8 Corn Tortillas, dipped in spiced chili fat',
                '2 cups Shredded Melty Oaxaca Cheese',
                '1/2 cup Minced White Onion & Fresh Cilantro',
                '1 cup Piping-Hot Birria Consommé with Lime for dipping'
            ]
        },

        // VEGAN
        {
            label: 'Royal Thai Coconut Green Curry with Crispy Tofu',
            image: 'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?auto=format&fit=crop&w=800&q=80',
            url: 'https://foodiesgoodies.com/pages/recipe.html?id=16',
            source: 'Chef Somchai Prasert',
            calories: 1840,
            yield: 4,
            totalTime: 30,
            cuisineType: ['Thai'],
            mealType: ['lunch/dinner'],
            dietLabels: ['High-Fiber'],
            healthLabels: ['Vegan', 'Vegetarian', 'Dairy-Free', 'Gluten-Free'],
            ingredientLines: [
                '1 block (400g) Organic Extra-Firm Tofu, cubed & pan-crisped',
                '2 cans (800ml) Rich Coconut Milk',
                '3 tbsp Authentic Thai Green Curry Paste',
                '1 cup Tender Bamboo Shoots & Baby Thai Eggplants',
                'Fresh Kaffir Lime Leaves & Lemongrass Stalk',
                'Thai Sweet Basil Leaves & Steamed Jasmine Rice'
            ]
        },
        {
            label: 'Roasted Cauliflower & Chickpea Tikka Masala',
            image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=800&q=80',
            url: 'https://foodiesgoodies.com/pages/recipe.html?id=17',
            source: 'Chef Priya Sharma',
            calories: 1640,
            yield: 4,
            totalTime: 35,
            cuisineType: ['Indian'],
            mealType: ['lunch/dinner'],
            dietLabels: ['High-Fiber'],
            healthLabels: ['Vegan', 'Vegetarian', 'Dairy-Free', 'Gluten-Free'],
            ingredientLines: [
                '1 Large Head Cauliflower, cut into florets & roasted',
                '1 can (400g) Organic Chickpeas, drained & rinsed',
                '1.5 cups Velvety Spiced Coconut Tomato Gravy',
                '1 tbsp Garam Masala & Smoked Paprika',
                'Fresh Cilantro Leaves',
                'Warm Garlic Naan or Basmati Rice'
            ]
        },

        // SALMON
        {
            label: 'Pan-Seared Crispy Skin Salmon with Lemon Dill Butter',
            image: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=800&q=80',
            url: 'https://foodiesgoodies.com/pages/recipe.html?id=18',
            source: 'Chef Henrik Lindqvist',
            calories: 1040,
            yield: 2,
            totalTime: 20,
            cuisineType: ['Nordic'],
            mealType: ['lunch/dinner'],
            dietLabels: ['High-Protein', 'Keto-Friendly'],
            healthLabels: ['Pescatarian', 'Gluten-Free'],
            ingredientLines: [
                '2 (6 oz) Wild-Caught Atlantic Salmon Fillets, skin-on',
                '1 bunch Tender Green Asparagus Spears, trimmed',
                '300g Fingerling Potatoes, parboiled & lightly crushed',
                '3 tbsp Salted French Butter',
                '1 Lemon, zested & juiced',
                '2 tbsp Fresh Baby Dill, chopped'
            ]
        },
        {
            label: 'Sweet Miso-Glazed Atlantic Salmon',
            image: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=800&q=80',
            url: 'https://foodiesgoodies.com/pages/recipe.html?id=19',
            source: 'Chef Kenji Sato',
            calories: 980,
            yield: 2,
            totalTime: 25,
            cuisineType: ['Japanese'],
            mealType: ['lunch/dinner'],
            dietLabels: ['High-Protein'],
            healthLabels: ['Pescatarian', 'Dairy-Free'],
            ingredientLines: [
                '2 Fresh Salmon Fillets (6 oz each)',
                '3 tbsp White Shiro Miso Paste',
                '2 tbsp Mirin & Pure Maple Syrup',
                '1 tbsp Low-Sodium Tamari Soy Sauce',
                'Steamed Baby Bok Choy & Shiitake Mushrooms',
                'Toasted White & Black Sesame Seeds'
            ]
        },

        // BROWNIES
        {
            label: 'Fudgy Double Dark Chocolate Salted Caramel Brownies',
            image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=800&q=80',
            url: 'https://foodiesgoodies.com/pages/recipe.html?id=20',
            source: 'Chef Chloe Dupont',
            calories: 2880,
            yield: 8,
            totalTime: 35,
            cuisineType: ['French'],
            mealType: ['dessert'],
            dietLabels: ['Vegetarian'],
            healthLabels: ['Vegetarian', 'Nut-Free'],
            ingredientLines: [
                '200g 70% Dark Valrhona Chocolate, chopped & melted',
                '150g Unsalted European Butter',
                '3 Large Free-Range Eggs',
                '1 cup Organic Cane Sugar',
                '1/2 cup Dutch Process Dark Cocoa Powder',
                '1/2 cup Unbleached All-Purpose Flour',
                '1/3 cup Gooey Salted Caramel Swirl',
                'Maldon Flaky Sea Salt'
            ]
        }
    ];

    // =========================================================================
    // 2. Candidate API Base URLs (Adaptive Endpoint Resolver)
    // =========================================================================
    function getCandidateApiUrls(pathWithQuery) {
        const port = window.location.port;
        const proto = window.location.protocol;
        const list = [];

        // If on standard ASP.NET Core port (5258 or 7258)
        if (port === '5258' || port === '7258') {
            list.push(pathWithQuery);
        } else if (proto === 'http:' || proto === 'https:') {
            // Priority 1: Relative path on current server
            list.push(pathWithQuery);
            // Priority 2: Direct ASP.NET Core backend port
            list.push(`http://localhost:5258${pathWithQuery}`);
            list.push(`https://localhost:7060${pathWithQuery}`);
        } else {
            // file: protocol or local webview
            list.push(`http://localhost:5258${pathWithQuery}`);
        }
        return list;
    }

    /**
     * Attempts to fetch from multiple candidate API endpoints with timeout
     */
    async function fetchFromApiCandidates(pathWithQuery) {
        const candidates = getCandidateApiUrls(pathWithQuery);

        for (const url of candidates) {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 3500);

                const response = await fetch(url, {
                    headers: { 'Accept': 'application/json' },
                    signal: controller.signal
                });
                clearTimeout(timeoutId);

                if (response.ok) {
                    const data = await response.json();
                    if (data && (Array.isArray(data.hits) || data.success !== false)) {
                        return { ok: true, data, endpoint: url };
                    }
                }
            } catch (err) {
                // Endpoint unreachable or timed out; try next candidate
            }
        }
        return { ok: false };
    }

    /**
     * Search Curated Culinary Vault by query terms
     */
    function searchCuratedVault(query) {
        const q = (query || '').toLowerCase().trim();
        if (!q) return CURATED_RECIPE_VAULT;

        const words = q.split(/\s+/).filter(w => w.length > 1);

        const scored = CURATED_RECIPE_VAULT.map(recipe => {
            let score = 0;
            const title = (recipe.label || '').toLowerCase();
            const cuisine = Array.isArray(recipe.cuisineType) ? recipe.cuisineType.join(' ').toLowerCase() : '';
            const meals = Array.isArray(recipe.mealType) ? recipe.mealType.join(' ').toLowerCase() : '';
            const diets = Array.isArray(recipe.dietLabels) ? recipe.dietLabels.join(' ').toLowerCase() : '';
            const health = Array.isArray(recipe.healthLabels) ? recipe.healthLabels.join(' ').toLowerCase() : '';
            const ingredients = Array.isArray(recipe.ingredientLines) ? recipe.ingredientLines.join(' ').toLowerCase() : '';

            // Exact phrase match
            if (title.includes(q)) score += 100;
            if (cuisine.includes(q)) score += 60;
            if (ingredients.includes(q)) score += 40;
            if (diets.includes(q) || health.includes(q)) score += 30;

            // Word-by-word matching
            words.forEach(word => {
                if (title.includes(word)) score += 20;
                if (cuisine.includes(word)) score += 15;
                if (ingredients.includes(word)) score += 10;
                if (diets.includes(word) || health.includes(word)) score += 8;
            });

            return { recipe, score };
        });

        // Filter items with score > 0, sorted by relevance score descending
        const matched = scored
            .filter(item => item.score > 0)
            .sort((a, b) => b.score - a.score)
            .map(item => item.recipe);

        if (matched.length > 0) {
            return matched;
        }

        // If no direct hit found, check for broad category fallback
        if (q.includes('pizza')) return CURATED_RECIPE_VAULT.filter(r => (r.label || '').toLowerCase().includes('pizza'));
        if (q.includes('pasta')) return CURATED_RECIPE_VAULT.filter(r => (r.label || '').toLowerCase().includes('pasta') || (r.cuisineType || []).includes('Italian'));
        if (q.includes('burger')) return CURATED_RECIPE_VAULT.filter(r => (r.label || '').toLowerCase().includes('burger'));
        if (q.includes('donut')) return CURATED_RECIPE_VAULT.filter(r => (r.label || '').toLowerCase().includes('donut') || (r.label || '').toLowerCase().includes('cronut'));
        if (q.includes('salad')) return CURATED_RECIPE_VAULT.filter(r => (r.label || '').toLowerCase().includes('salad') || (r.label || '').toLowerCase().includes('bowl'));
        if (q.includes('taco')) return CURATED_RECIPE_VAULT.filter(r => (r.label || '').toLowerCase().includes('taco'));
        if (q.includes('vegan') || q.includes('vegetarian')) return CURATED_RECIPE_VAULT.filter(r => (r.healthLabels || []).some(h => h.includes('Veg')));
        if (q.includes('salmon') || q.includes('fish')) return CURATED_RECIPE_VAULT.filter(r => (r.label || '').toLowerCase().includes('salmon'));
        if (q.includes('brownie') || q.includes('chocolate')) return CURATED_RECIPE_VAULT.filter(r => (r.label || '').toLowerCase().includes('brownie') || (r.label || '').toLowerCase().includes('chocolate'));

        return [];
    }

    // Handle form submit
    searchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const query = searchInput.value.trim();
        if (query) {
            executeSearch(query);
        }
    });

    // Handle quick tag chips
    if (quickTags) {
        quickTags.forEach(tag => {
            tag.addEventListener('click', (e) => {
                e.preventDefault();
                quickTags.forEach(t => t.classList.remove('active'));
                tag.classList.add('active');
                const term = tag.getAttribute('data-query') || tag.textContent.replace(/^[^\w]+/, '').trim();
                searchInput.value = term;
                executeSearch(term);
            });
        });
    }

    // Auto-execute if query string is present in URL (e.g., from homepage search)
    const urlParams = new URLSearchParams(window.location.search);
    const initialQuery = urlParams.get('q');
    if (initialQuery && initialQuery.trim()) {
        searchInput.value = initialQuery.trim();
        executeSearch(initialQuery.trim());
    }

    /**
     * Executes recipe search with dual strategy:
     * 1. Try Live ASP.NET Core Edamam proxy endpoints.
     * 2. If endpoint returns 404/502/network failure, seamlessly activate Curated Culinary Vault.
     */
    async function executeSearch(query) {
        currentSearchQuery = query;
        nextPaginationCursor = null;
        isVaultMode = false;
        vaultRemainingHits = [];

        // Show 6 skeleton placeholder cards
        const skeletonCardHtml = `
            <article class="recipe-card skeleton-card" aria-hidden="true">
                <div class="card-media-wrapper skeleton-block skeleton-image"></div>
                <div class="card-body">
                    <div class="skeleton-block skeleton-text" style="width: 35%; height: 12px; margin-bottom: 10px;"></div>
                    <div class="skeleton-block skeleton-text" style="width: 85%; height: 22px; margin-bottom: 12px;"></div>
                    <div class="skeleton-block skeleton-text" style="width: 60%; height: 14px; margin-bottom: 14px;"></div>
                    <div class="skeleton-block skeleton-text" style="width: 45%; height: 16px; margin-bottom: 18px;"></div>
                    <div style="display:flex;gap:8px;margin-top:14px;">
                        <div class="skeleton-block skeleton-btn" style="flex:1;height:36px;"></div>
                        <div class="skeleton-block skeleton-btn" style="flex:1;height:36px;"></div>
                    </div>
                </div>
            </article>
        `;
        resultsList.innerHTML = Array(6).fill(skeletonCardHtml).join('');

        // Attempt API candidate endpoints
        const apiPath = `/api/recipes?q=${encodeURIComponent(query)}`;
        const apiResult = await fetchFromApiCandidates(apiPath);

        if (apiResult.ok && apiResult.data) {
            const data = apiResult.data;
            nextPaginationCursor = data.nextCursor || null;

            if (data.hits && data.hits.length > 0) {
                renderRecipes(data.hits, false, data.count || data.hits.length, true);
                return;
            }
        }

        // Seamless Fallback to Curated Culinary Vault
        const vaultMatches = searchCuratedVault(query);

        if (vaultMatches && vaultMatches.length > 0) {
            isVaultMode = true;
            const pageSize = 6;
            const initialSlice = vaultMatches.slice(0, pageSize);
            vaultRemainingHits = vaultMatches.slice(pageSize);

            renderRecipes(initialSlice, false, vaultMatches.length, false);
            return;
        }

        // True Empty State (query had zero matches anywhere)
        resultsList.innerHTML = `
            <div class="search-status-message">
                <div class="edamam-logo-badge" style="margin-bottom: 16px;">
                    <span style="font-size: 38px;"><ion-icon name="search-outline"></ion-icon></span>
                </div>
                <h3>No recipes found for "${escapeHTML(query)}"</h3>
                <p>Try searching for popular culinary terms such as <em>Pizza, Pasta, Burgers, Donuts, Salads, Tacos, Vegan, Salmon, or Brownies</em>.</p>
                <div style="display: flex; gap: 8px; justify-content: center; flex-wrap: wrap; margin-top: 18px;">
                    <button type="button" class="quick-tag fallback-suggest-btn" data-query="Pizza">Try Pizza</button>
                    <button type="button" class="quick-tag fallback-suggest-btn" data-query="Pasta">Try Pasta</button>
                    <button type="button" class="quick-tag fallback-suggest-btn" data-query="Tacos">Try Tacos</button>
                    <button type="button" class="quick-tag fallback-suggest-btn" data-query="Brownies">Try Brownies</button>
                </div>
            </div>
        `;

        resultsList.querySelectorAll('.fallback-suggest-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const term = btn.getAttribute('data-query');
                searchInput.value = term;
                executeSearch(term);
            });
        });
    }

    /**
     * Load next page of recipes from opaque cursor endpoint or remaining vault hits
     */
    async function loadMoreRecipes() {
        const loadMoreBtn = document.querySelector('#loadMoreBtn');
        if (loadMoreBtn) {
            loadMoreBtn.disabled = true;
            loadMoreBtn.textContent = 'Loading More Delicious Recipes...';
        }

        if (isVaultMode) {
            // Load more from local vault
            if (vaultRemainingHits && vaultRemainingHits.length > 0) {
                const nextBatch = vaultRemainingHits.splice(0, 6);
                renderRecipes(nextBatch, true, null, false);
            } else if (loadMoreBtn) {
                loadMoreBtn.remove();
            }
            return;
        }

        if (!nextPaginationCursor) return;

        try {
            const nextPath = `/api/recipes/next?cursor=${encodeURIComponent(nextPaginationCursor)}`;
            const apiResult = await fetchFromApiCandidates(nextPath);

            if (apiResult.ok && apiResult.data) {
                const data = apiResult.data;
                nextPaginationCursor = data.nextCursor || null;

                if (data.hits && data.hits.length > 0) {
                    renderRecipes(data.hits, true, null, true);
                    return;
                }
            }

            if (loadMoreBtn) {
                loadMoreBtn.textContent = 'All available recipes loaded';
                setTimeout(() => loadMoreBtn.remove(), 2000);
            }
        } catch (err) {
            console.error('Failed to load more recipes:', err);
            if (loadMoreBtn) {
                loadMoreBtn.textContent = 'Unable to load more';
            }
        }
    }

    /**
     * Quick View Modal Handlers
     */
    function openQuickView(recipe) {
        const modalBackdrop = document.getElementById('quickViewModalBackdrop');
        if (!modalBackdrop) return;

        const imgEl = document.getElementById('quickViewImage');
        if (imgEl) {
            imgEl.src = recipe.image || (recipe.images && recipe.images.REGULAR ? recipe.images.REGULAR.url : '../assets/images/pizza1.png');
            imgEl.alt = recipe.label || 'Recipe preview';
        }

        const titleEl = document.getElementById('quickViewTitle');
        if (titleEl) titleEl.textContent = recipe.label || 'Delicious Dish';

        const badgeEl = document.getElementById('quickViewBadge');
        if (badgeEl) {
            const cuisine = Array.isArray(recipe.cuisineType) && recipe.cuisineType.length > 0
                ? capitalize(recipe.cuisineType[0])
                : (Array.isArray(recipe.mealType) ? capitalize(recipe.mealType[0]) : 'Specialty Recipe');
            badgeEl.textContent = cuisine;
        }

        const calories = Math.round(recipe.calories || 0);
        const servings = Math.max(1, Math.round(recipe.yield || 1));
        const calsPerServing = Math.round(calories / servings);
        const time = recipe.totalTime ? `${recipe.totalTime} mins` : '20-25 mins';

        const metricsEl = document.getElementById('quickViewMetrics');
        if (metricsEl) {
            metricsEl.innerHTML = `
                <div class="quickview-metric-pill"><span>Calories</span><strong>${calsPerServing} kcal</strong></div>
                <div class="quickview-metric-pill"><span>Servings</span><strong>${servings} portions</strong></div>
                <div class="quickview-metric-pill"><span>Prep/Cook</span><strong>${time}</strong></div>
            `;
        }

        const ingredientsEl = document.getElementById('quickViewIngredients');
        if (ingredientsEl) {
            const lines = Array.isArray(recipe.ingredientLines) ? recipe.ingredientLines : [];
            if (lines.length > 0) {
                ingredientsEl.innerHTML = lines.map(line => `<li>${escapeHTML(line)}</li>`).join('');
            } else {
                ingredientsEl.innerHTML = '<li>Ingredients details available in full recipe instructions.</li>';
            }
        }

        const externalBtn = document.getElementById('quickViewExternalBtn');
        if (externalBtn) {
            externalBtn.href = recipe.url || '#';
        }

        modalBackdrop.classList.add('is-active');
        modalBackdrop.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
    }

    function closeQuickView() {
        const modalBackdrop = document.getElementById('quickViewModalBackdrop');
        if (!modalBackdrop) return;
        modalBackdrop.classList.remove('is-active');
        modalBackdrop.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
    }

    // Modal Close Event Listeners
    const modalCloseBtn = document.getElementById('quickViewCloseBtn');
    if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeQuickView);

    const modalBackdrop = document.getElementById('quickViewModalBackdrop');
    if (modalBackdrop) {
        modalBackdrop.addEventListener('click', (e) => {
            if (e.target === modalBackdrop) closeQuickView();
        });
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeQuickView();
    });

    /**
     * Renders hits into the results grid
     */
    function renderRecipes(hits, append = false, totalCount = null, isLive = true) {
        let cardsHtml = '';
        const startIndex = append ? currentHitsList.length : 0;

        if (!append) {
            currentHitsList = [];
        }

        hits.forEach((item, index) => {
            const recipe = item.recipe || item;
            currentHitsList.push(recipe);
            const globalIndex = startIndex + index;

            const label = escapeHTML(recipe.label || 'Delicious Dish');
            const imageUrl = escapeHTML(recipe.image || (recipe.images && recipe.images.REGULAR ? recipe.images.REGULAR.url : '../assets/images/pizza1.png'));
            const recipeUrl = escapeHTML(recipe.url || '#');
            const source = escapeHTML(recipe.source || 'Foodies Goodies Kitchen');
            const calories = Math.round(recipe.calories || 0);
            const servings = Math.max(1, Math.round(recipe.yield || 1));
            const calsPerServing = Math.round(calories / servings);
            const cookingTime = recipe.totalTime ? `${recipe.totalTime} mins` : '20 mins';

            // Cuisine & Meal type
            const cuisine = Array.isArray(recipe.cuisineType) && recipe.cuisineType.length > 0 
                ? capitalize(recipe.cuisineType[0]) 
                : (Array.isArray(recipe.mealType) ? capitalize(recipe.mealType[0]) : 'Specialty');

            // Diet & Health badges (up to 3)
            const badges = [];
            if (Array.isArray(recipe.dietLabels)) {
                recipe.dietLabels.slice(0, 2).forEach(d => badges.push(d));
            }
            if (Array.isArray(recipe.healthLabels)) {
                recipe.healthLabels.filter(h => ['Vegetarian', 'Vegan', 'Gluten-Free', 'Keto-Friendly', 'Dairy-Free', 'Nut-Free', 'High-Protein'].includes(h)).slice(0, 2).forEach(h => {
                    if (!badges.includes(h)) badges.push(h);
                });
            }

            cardsHtml += `
            <article class="recipe-card card-hover-lift" data-dish="${label}">
                <div class="card-media-wrapper">
                    <img src="${imageUrl}" alt="${label}" class="aspect-16-9" loading="lazy" decoding="async" onerror="this.src='../assets/images/pizza1.png'">
                    <span class="cuisine-badge">${cuisine}</span>
                </div>

                <div class="card-body">
                    <div class="recipe-publisher">By ${source}</div>
                    <h3 class="recipe-title" title="${label}">${label}</h3>

                    <!-- Quick Metrics -->
                    <div class="recipe-metrics">
                        <span class="metric-item" title="Calories per serving">
                            🔥 <strong>${calsPerServing}</strong> kcal/srv
                        </span>
                        <span class="metric-item" title="Servings">
                            🍽️ <strong>${servings}</strong> ${servings === 1 ? 'portion' : 'portions'}
                        </span>
                        <span class="metric-item" title="Prep & Cook Time">⏱️ <strong>${cookingTime}</strong></span>
                    </div>

                    <!-- Dietary Tags -->
                    ${badges.length > 0 ? `
                        <div class="dietary-tags">
                            ${badges.map(b => `<span class="badge-tag">${escapeHTML(b)}</span>`).join('')}
                        </div>
                    ` : ''}

                    <!-- Action Buttons -->
                    <div class="recipe-card-actions" style="display:flex;gap:8px;margin-top:14px;">
                        <button type="button" class="btn-secondary-glass btn-trigger-quickview" data-index="${globalIndex}" style="flex:1;padding:8px 12px;font-size:0.85rem;justify-content:center;cursor:pointer;">
                            👁️ Quick View
                        </button>
                        <a href="${recipeUrl}" class="btn-primary-glass" target="_blank" rel="noopener noreferrer" style="flex:1;padding:8px 12px;font-size:0.85rem;text-decoration:none;text-align:center;display:flex;align-items:center;justify-content:center;">
                            Instructions ↗
                        </a>
                    </div>
                </div>
            </article>
            `;
        });

        if (append) {
            const oldPagination = document.querySelector('.pagination-container');
            if (oldPagination) oldPagination.remove();
            resultsList.insertAdjacentHTML('beforeend', cardsHtml);
        } else {
            const sourceBadgeText = isLive ? 'Edamam Recipe Cloud' : 'Curated Culinary Vault';
            const countNote = totalCount ? ` (${totalCount} recipes)` : '';
            const headerBanner = `
                <div class="search-results-meta">
                    <div class="results-count-text">
                        Showing recipes from <strong>${sourceBadgeText}</strong> for "<strong>${escapeHTML(currentSearchQuery)}</strong>"${countNote}
                    </div>
                </div>
            `;
            resultsList.innerHTML = headerBanner + `<div class="recipes-grid">${cardsHtml}</div>`;
        }

        // Attach Quick View Click Listeners
        resultsList.querySelectorAll('.btn-trigger-quickview').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const idx = parseInt(btn.getAttribute('data-index'), 10);
                if (!isNaN(idx) && currentHitsList[idx]) {
                    openQuickView(currentHitsList[idx]);
                }
            });
        });

        // Add "Load More" button if pagination cursor exists OR if vault has more hits
        const hasMore = nextPaginationCursor || (isVaultMode && vaultRemainingHits && vaultRemainingHits.length > 0);
        if (hasMore) {
            const oldPagination = document.querySelector('.pagination-container');
            if (oldPagination) oldPagination.remove();

            const paginationContainer = document.createElement('div');
            paginationContainer.className = 'pagination-container';
            paginationContainer.innerHTML = `
                <button type="button" id="loadMoreBtn" class="search-btn load-more-btn">
                    Load More Recipes ↷
                </button>
            `;
            resultsList.appendChild(paginationContainer);

            const btn = document.querySelector('#loadMoreBtn');
            if (btn) {
                btn.addEventListener('click', loadMoreRecipes);
            }
        }

        // Inject schema.org JSON-LD Structured Data for SEO
        try {
            const oldScript = document.querySelector('#recipe-json-ld');
            if (oldScript) oldScript.remove();

            const schemaItems = hits.map(item => {
                const r = item.recipe || item;
                return {
                    "@context": "https://schema.org",
                    "@type": "Recipe",
                    "name": r.label || "Delicious Dish",
                    "image": [r.image || (r.images && r.images.REGULAR ? r.images.REGULAR.url : "")],
                    "author": {
                        "@type": "Person",
                        "name": r.source || "Foodies Goodies"
                    },
                    "recipeYield": `${Math.max(1, Math.round(r.yield || 1))} servings`,
                    "nutrition": {
                        "@type": "NutritionInformation",
                        "calories": `${Math.round(r.calories || 0)} calories`
                    },
                    "recipeIngredient": Array.isArray(r.ingredientLines) ? r.ingredientLines : []
                };
            });

            const scriptTag = document.createElement('script');
            scriptTag.id = 'recipe-json-ld';
            scriptTag.type = 'application/ld+json';
            scriptTag.textContent = JSON.stringify(schemaItems);
            document.head.appendChild(scriptTag);
        } catch (schemaErr) {
            console.warn('Could not inject recipe JSON-LD:', schemaErr);
        }
    }

    function capitalize(str) {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    function escapeHTML(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
});