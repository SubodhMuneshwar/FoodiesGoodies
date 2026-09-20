/**
 * FoodiesGoodies - Live Edamam Recipe Search Integration & Resilient Culinary Vault
 * Professional numbered pagination (responsive) — supports vault + live cursor API.
 */

document.addEventListener('DOMContentLoaded', () => {
    const searchForm = document.querySelector('#recipeSearchForm');
    const searchInput = document.querySelector('#search');
    const resultsList = document.querySelector('#results');
    const quickTags = document.querySelectorAll('.quick-tag');

    let nextPaginationCursor = null;
    let currentSearchQuery = '';
    let currentHitsList = []; // hits for CURRENT page only (for quick view indexing)
    let isVaultMode = false;
    let vaultAllHits = []; // all vault matches for current query
    let liveAllHits = [];  // accumulated live hits (buffered from API cursors)
    let isFetchingPage = false;
    let currentDataIsLive = true; // for banner badge

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
    // 2. Candidate API Base URLs & Edamam Direct Access Configuration
    // =========================================================================
    const EDAMAM_DIRECT_CONFIG = {
        appId: '7fa30af7',
        appKey: '9c87101cffeb950238f6c49653050fd1',
        userId: 'SubodhUM',
        baseUrl: 'https://api.edamam.com/api/recipes/v2'
    };

    let totalHits = 0;
    let currentPage = 1;
    const PAGE_SIZE = 6;

    function getCandidateApiUrls(pathWithQuery) {
        const port = window.location.port;
        const list = [];

        // Priority 1: Relative path on current server (standard when served by Kestrel)
        list.push(pathWithQuery);

        // Priority 2: Direct ASP.NET Core backend port if running on alternate host/port (e.g., Live Server)
        if (port !== '5258') {
            list.push(`http://localhost:5258${pathWithQuery}`);
        }
        if (port !== '7258') {
            list.push(`https://localhost:7258${pathWithQuery}`);
        }
        return list;
    }

    /**
     * Attempts to fetch recipes with adaptive fallback:
     * 1. Tries ASP.NET Core proxy candidates with generous 12s timeout (averts premature client abort).
     * 2. If proxy endpoints fail/offline, falls back to direct client-side Edamam v2 cloud API.
     */
    async function fetchFromApiCandidates(pathWithQuery, query = null) {
        const candidates = getCandidateApiUrls(pathWithQuery);

        // 1. Attempt ASP.NET Core Backend Proxy Endpoints
        for (const url of candidates) {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 12000);

                const response = await fetch(url, {
                    headers: { 'Accept': 'application/json' },
                    signal: controller.signal
                });
                clearTimeout(timeoutId);

                if (response.ok) {
                    const data = await response.json();
                    if (data && (Array.isArray(data.hits) || data.success !== false)) {
                        console.info(`[RecipeSearch] Successfully loaded recipes from backend proxy: ${url}`);
                        return { ok: true, data, endpoint: url, isDirectEdamam: false };
                    }
                } else {
                    console.warn(`[RecipeSearch] Candidate ${url} returned HTTP ${response.status}`);
                }
            } catch (err) {
                console.warn(`[RecipeSearch] Candidate ${url} failed or timed out:`, err.message || err);
            }
        }

        // 2. Direct Edamam API Fallback (in case backend is offline or static hosting)
        if (query) {
            try {
                console.info('[RecipeSearch] Local backend proxy unreachable, attempting direct Edamam cloud fallback...');
                const directUrl = `${EDAMAM_DIRECT_CONFIG.baseUrl}?type=public&q=${encodeURIComponent(query)}&app_id=${EDAMAM_DIRECT_CONFIG.appId}&app_key=${EDAMAM_DIRECT_CONFIG.appKey}`;
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 12000);

                const response = await fetch(directUrl, {
                    headers: {
                        'Accept': 'application/json',
                        'Edamam-Account-User': EDAMAM_DIRECT_CONFIG.userId
                    },
                    signal: controller.signal
                });
                clearTimeout(timeoutId);

                if (response.ok) {
                    const data = await response.json();
                    if (data && Array.isArray(data.hits)) {
                        console.info('[RecipeSearch] Successfully loaded recipes from direct Edamam Cloud API');
                        const nextLink = data._links && data._links.next ? data._links.next.href : null;
                        return {
                            ok: true,
                            data: {
                                hits: data.hits,
                                count: data.count || data.hits.length,
                                from: data.from,
                                to: data.to,
                                nextCursor: nextLink
                            },
                            endpoint: 'Edamam Cloud Direct',
                            isDirectEdamam: true
                        };
                    }
                }
            } catch (err) {
                console.warn('[RecipeSearch] Direct Edamam cloud fallback failed:', err.message || err);
            }
        }

        return { ok: false, error: 'network_failure' };
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

    function attachFallbackButtons() {
        resultsList.querySelectorAll('.fallback-suggest-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const term = btn.getAttribute('data-query');
                searchInput.value = term;
                executeSearch(term);
            });
        });
    }

    function renderEmptyState(query) {
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
        attachFallbackButtons();
    }

    function renderConnectionErrorState(query) {
        resultsList.innerHTML = `
            <div class="search-status-message">
                <div class="edamam-logo-badge" style="margin-bottom: 16px; color: var(--color-accent, #e67e22);">
                    <span style="font-size: 38px;"><ion-icon name="cloud-offline-outline"></ion-icon></span>
                </div>
                <h3>Connection to Recipe Cloud Interrupted</h3>
                <p>We were unable to reach the Edamam culinary service or local backend server for "<strong>${escapeHTML(query)}</strong>". Please check your network connection and retry.</p>
                <div style="display: flex; gap: 10px; justify-content: center; flex-wrap: wrap; margin-top: 18px;">
                    <button type="button" class="btn-primary" id="retrySearchBtn" style="padding: 10px 20px; font-weight: 600; cursor: pointer;">
                        <ion-icon name="refresh-outline" style="vertical-align: middle; margin-right: 6px;"></ion-icon> Retry Search
                    </button>
                    <button type="button" class="quick-tag fallback-suggest-btn" data-query="Pizza">Browse Pizza</button>
                    <button type="button" class="quick-tag fallback-suggest-btn" data-query="Pasta">Browse Pasta</button>
                    <button type="button" class="quick-tag fallback-suggest-btn" data-query="Brownies">Browse Brownies</button>
                </div>
            </div>
        `;
        const retryBtn = document.getElementById('retrySearchBtn');
        if (retryBtn) {
            retryBtn.addEventListener('click', () => executeSearch(query));
        }
        attachFallbackButtons();
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

    // =========================================================================
    // 3. Professional Pagination — Core Helpers
    // =========================================================================
    function getTotalPages() {
        if (totalHits <= 0) return 1;
        return Math.ceil(totalHits / PAGE_SIZE);
    }

    function getPaginationWindow(current, total) {
        // Professional window: for small totals show all pages, else show 1, ellipsis, neighbors, ellipsis, last
        if (total <= 7) {
            return Array.from({ length: total }, (_, i) => i + 1);
        }
        const delta = 1; // pages around current (keeps pill count minimal & editorial)
        const range = [];
        const rangeWithDots = [];
        let last = null;

        for (let i = 1; i <= total; i++) {
            if (i === 1 || i === total || (i >= current - delta && i <= current + delta)) {
                range.push(i);
            }
        }

        for (const num of range) {
            if (last !== null) {
                if (num - last === 2) {
                    rangeWithDots.push(last + 1);
                } else if (num - last !== 1) {
                    rangeWithDots.push('ellipsis');
                }
            }
            rangeWithDots.push(num);
            last = num;
        }
        return rangeWithDots;
    }

    function scrollToResultsTop() {
        const headerOffset = 84;
        const top = resultsList.getBoundingClientRect().top + window.scrollY - headerOffset;
        window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
    }

    function buildPaginationHTML() {
        const totalPages = getTotalPages();
        if (totalPages <= 1) return '';

        const isFirst = currentPage === 1;
        const isLast = currentPage === totalPages;
        const windowPages = getPaginationWindow(currentPage, totalPages);

        // Disable logic: also disable if fetching
        const disabledAttr = isFetchingPage ? ' disabled' : '';

        let html = '';

        // Previous button
        html += `<button type="button" class="pagination-btn pagination-prev" data-page="${currentPage - 1}" ${isFirst || isFetchingPage ? 'disabled' : ''} aria-label="Go to previous page">
            <span aria-hidden="true">‹</span>
            <span class="pagination-label-long">Previous</span>
            <span class="pagination-label-short">Prev</span>
        </button>`;

        // Page numbers
        windowPages.forEach(item => {
            if (item === 'ellipsis') {
                html += `<span class="pagination-ellipsis" aria-hidden="true">…</span>`;
            } else {
                const isActive = item === currentPage;
                html += `<button type="button" class="pagination-page-btn${isActive ? ' is-active' : ''}" data-page="${item}" ${isActive ? 'aria-current="page"' : ''}${isFetchingPage ? ' disabled' : ''} aria-label="Go to page ${item}">${item}</button>`;
            }
        });

        // Next button
        html += `<button type="button" class="pagination-btn pagination-next" data-page="${currentPage + 1}" ${isLast || isFetchingPage ? 'disabled' : ''} aria-label="Go to next page">
            <span class="pagination-label-long">Next</span>
            <span class="pagination-label-short">Next</span>
            <span aria-hidden="true">›</span>
        </button>`;

        return `<nav class="pagination" aria-label="Recipe results pagination">${html}</nav>`;
    }

    function renderPaginationWrapper() {
        const totalPages = getTotalPages();
        const startItem = totalHits === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
        const endItem = Math.min(currentPage * PAGE_SIZE, totalHits);
        const sourceLabel = isVaultMode ? 'Curated Culinary Vault' : 'Edamam Recipe Cloud';
        const moreNote = (!isVaultMode && nextPaginationCursor) ? ' · more available' : '';

        const wrapper = document.createElement('div');
        wrapper.className = 'pagination-wrapper';
        wrapper.setAttribute('role', 'navigation');
        wrapper.setAttribute('aria-label', 'Pagination');

        const infoHtml = totalPages <= 1
            ? `<div class="pagination-info"><span class="pagination-range">${totalHits}</span> recipe${totalHits !== 1 ? 's' : ''} found in <strong>${sourceLabel}</strong> for "<strong>${escapeHTML(currentSearchQuery)}</strong>"</div>`
            : `<div class="pagination-info">Showing <span class="pagination-range">${startItem}–${endItem}</span> of <strong>${totalHits}</strong> recipes · Page <strong>${currentPage}</strong> of <strong>${totalPages}</strong> · <span style="color:var(--text-muted)">${sourceLabel}${moreNote}</span></div>`;

        wrapper.innerHTML = `${infoHtml}${buildPaginationHTML()}`;

        // Attach listeners
        wrapper.querySelectorAll('[data-page]').forEach(btn => {
            btn.addEventListener('click', () => {
                const target = parseInt(btn.getAttribute('data-page'), 10);
                if (!isNaN(target)) goToPage(target);
            });
        });

        return wrapper;
    }

    // =========================================================================
    // 4. Search Execution — Now with buffered pagination
    // =========================================================================
    async function executeSearch(query) {
        currentSearchQuery = query;
        currentPage = 1;
        totalHits = 0;
        nextPaginationCursor = null;
        isVaultMode = false;
        vaultAllHits = [];
        liveAllHits = [];
        currentDataIsLive = true;
        isFetchingPage = false;

        // Show skeletons matching PAGE_SIZE (6)
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
        resultsList.innerHTML = `<div class="recipes-grid">${Array(PAGE_SIZE).fill(skeletonCardHtml).join('')}</div>`;

        // Attempt API candidate endpoints
        const apiPath = `/api/recipes?q=${encodeURIComponent(query)}`;
        const apiResult = await fetchFromApiCandidates(apiPath, query);

        if (apiResult.ok && apiResult.data) {
            const data = apiResult.data;
            nextPaginationCursor = data.nextCursor || null;
            totalHits = data.count || (data.hits ? data.hits.length : 0);

            if (data.hits && data.hits.length > 0) {
                // Buffer all hits
                liveAllHits = [...data.hits];
                // If API returned fewer hits than count, pagination will fetch more on demand
                currentDataIsLive = true;
                renderCurrentPage(1, false);
                return;
            } else {
                renderEmptyState(query);
                return;
            }
        }

        // Seamless Fallback to Curated Culinary Vault if network/backend failed
        const vaultMatches = searchCuratedVault(query);

        if (vaultMatches && vaultMatches.length > 0) {
            isVaultMode = true;
            currentDataIsLive = false;
            // Wrap vault recipes as {recipe: ...} to keep uniform shape? Vault items are direct recipe objects.
            // We'll store as vault objects and handle mapping in render.
            vaultAllHits = vaultMatches;
            totalHits = vaultAllHits.length;
            nextPaginationCursor = null;
            renderCurrentPage(1, false);
            return;
        }

        // True connection / offline failure state
        renderConnectionErrorState(query);
    }

    /**
     * Ensure live buffer has enough items to display target page.
     * Fetches sequential API pages until buffer sufficient or no more cursor.
     */
    async function ensureLiveBufferForPage(targetPage) {
        if (isVaultMode) return true;
        const required = targetPage * PAGE_SIZE;
        while (liveAllHits.length < required && nextPaginationCursor && !isFetchingPage) {
            // Fetch next API chunk
            const fetched = await fetchNextApiChunk();
            if (!fetched) break;
        }
        return liveAllHits.length >= (targetPage - 1) * PAGE_SIZE + 1;
    }

    async function fetchNextApiChunk() {
        if (!nextPaginationCursor || isFetchingPage) return false;
        isFetchingPage = true;
        // Show loading state on pagination if exists (both top and bottom)
        const wrappers = document.querySelectorAll('.pagination-wrapper');
        wrappers.forEach(w => w.querySelectorAll('button').forEach(b => b.disabled = true));

        try {
            let data = null;

            if (nextPaginationCursor.startsWith('http://') || nextPaginationCursor.startsWith('https://')) {
                // Direct Edamam next page link
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 12000);
                const response = await fetch(nextPaginationCursor, {
                    headers: {
                        'Accept': 'application/json',
                        'Edamam-Account-User': EDAMAM_DIRECT_CONFIG.userId
                    },
                    signal: controller.signal
                });
                clearTimeout(timeoutId);

                if (response.ok) {
                    const raw = await response.json();
                    const nextLink = raw._links && raw._links.next ? raw._links.next.href : null;
                    data = {
                        hits: raw.hits || [],
                        count: raw.count || totalHits,
                        nextCursor: nextLink
                    };
                }
            } else {
                // Backend proxy cursor endpoint
                const nextPath = `/api/recipes/next?cursor=${encodeURIComponent(nextPaginationCursor)}`;
                const apiResult = await fetchFromApiCandidates(nextPath, null);
                if (apiResult.ok && apiResult.data) {
                    data = apiResult.data;
                }
            }

            if (data && Array.isArray(data.hits) && data.hits.length > 0) {
                liveAllHits.push(...data.hits);
                nextPaginationCursor = data.nextCursor || null;
                // Update totalHits if count provided and larger
                if (data.count && data.count > totalHits) totalHits = data.count;
                return true;
            } else {
                nextPaginationCursor = null;
                return false;
            }
        } catch (err) {
            console.error('Failed to fetch next API chunk:', err);
            return false;
        } finally {
            isFetchingPage = false;
        }
    }

    async function goToPage(targetPage) {
        const totalPages = getTotalPages();
        if (targetPage < 1 || targetPage > totalPages || targetPage === currentPage || isFetchingPage) return;

        // If vault, simple slice
        if (isVaultMode) {
            renderCurrentPage(targetPage, true);
            return;
        }

        // Live mode: ensure buffer
        const requiredStart = (targetPage - 1) * PAGE_SIZE;
        if (liveAllHits.length <= requiredStart && nextPaginationCursor) {
            // Need to fetch — show loading skeletons in pagination area (both top and bottom)
            const wrappers = document.querySelectorAll('.pagination-wrapper');
            wrappers.forEach(wrapper => {
                wrapper.innerHTML = `<div class="pagination-info" style="opacity:0.7">Loading page ${targetPage}…</div>`;
            });
            // Fetch until enough
            await ensureLiveBufferForPage(targetPage);
        }

        // Re-check after fetching
        if (liveAllHits.length > requiredStart || targetPage <= Math.ceil(liveAllHits.length / PAGE_SIZE)) {
            renderCurrentPage(targetPage, true);
        } else {
            // If still not enough and no more cursor, cap totalHits to actually available
            totalHits = liveAllHits.length;
            renderCurrentPage(Math.min(targetPage, getTotalPages()), true);
        }
    }

    // =========================================================================
    // 5. Rendering — Paginated grid + pagination controls
    // =========================================================================
    function renderCurrentPage(pageNum, shouldScroll = true) {
        currentPage = pageNum;
        const start = (pageNum - 1) * PAGE_SIZE;
        const end = start + PAGE_SIZE;
        let pageHits = [];

        if (isVaultMode) {
            pageHits = vaultAllHits.slice(start, end);
        } else {
            pageHits = liveAllHits.slice(start, end);
        }

        // If live and page slice empty but we have cursor, fetch then retry
        if (!isVaultMode && pageHits.length === 0 && nextPaginationCursor) {
            ensureLiveBufferForPage(pageNum).then(() => {
                const retrySlice = liveAllHits.slice(start, end);
                if (retrySlice.length > 0) renderCurrentPage(pageNum, shouldScroll);
            });
            return;
        }

        // Build cards HTML
        let cardsHtml = '';
        currentHitsList = []; // reset for this page

        pageHits.forEach((item, idx) => {
            const recipe = item.recipe || item; // live hits have .recipe, vault are direct
            currentHitsList.push(recipe);

            const label = escapeHTML(recipe.label || 'Delicious Dish');
            const imageUrl = escapeHTML(recipe.image || (recipe.images && recipe.images.REGULAR ? recipe.images.REGULAR.url : '../assets/images/pizza1.png'));
            const recipeUrl = escapeHTML(recipe.url || '#');
            const source = escapeHTML(recipe.source || 'Foodies Goodies Kitchen');
            const calories = Math.round(recipe.calories || 0);
            const servings = Math.max(1, Math.round(recipe.yield || 1));
            const calsPerServing = Math.round(calories / servings);
            const cookingTime = recipe.totalTime ? `${recipe.totalTime} mins` : '20 mins';

            const cuisine = Array.isArray(recipe.cuisineType) && recipe.cuisineType.length > 0
                ? capitalize(recipe.cuisineType[0])
                : (Array.isArray(recipe.mealType) ? capitalize(recipe.mealType[0]) : 'Specialty');

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
                    <div class="recipe-metrics">
                        <span class="metric-item" title="Calories per serving">
                            🔥 <strong>${calsPerServing}</strong> kcal/srv
                        </span>
                        <span class="metric-item" title="Servings">
                            🍽️ <strong>${servings}</strong> ${servings === 1 ? 'portion' : 'portions'}
                        </span>
                        <span class="metric-item" title="Prep & Cook Time">⏱️ <strong>${cookingTime}</strong></span>
                    </div>
                    ${badges.length > 0 ? `
                        <div class="dietary-tags">
                            ${badges.map(b => `<span class="badge-tag">${escapeHTML(b)}</span>`).join('')}
                        </div>
                    ` : ''}
                    <div class="recipe-card-actions" style="display:flex;gap:8px;margin-top:14px;">
                        <button type="button" class="btn-secondary-glass btn-trigger-quickview" data-index="${idx}" style="flex:1;padding:8px 12px;font-size:0.85rem;justify-content:center;cursor:pointer;">
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

        // Meta banner (above grid)
        const sourceBadgeText = isVaultMode ? 'Curated Culinary Vault' : 'Edamam Recipe Cloud';
        const startItem = totalHits === 0 ? 0 : start + 1;
        const endItem = Math.min(end, totalHits);
        const headerBanner = `
            <div class="search-results-meta">
                <div class="results-count-text">
                    Showing <strong>${startItem}–${endItem}</strong> of <strong>${totalHits}</strong> recipes from <strong>${sourceBadgeText}</strong> for "<strong>${escapeHTML(currentSearchQuery)}</strong>"
                </div>
            </div>
        `;

        resultsList.innerHTML = headerBanner + `<div class="recipes-grid">${cardsHtml}</div>`;

        // Attach Quick View
        resultsList.querySelectorAll('.btn-trigger-quickview').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const idx = parseInt(btn.getAttribute('data-index'), 10);
                if (!isNaN(idx) && currentHitsList[idx]) {
                    openQuickView(currentHitsList[idx]);
                }
            });
        });

        // Append pagination controls — professional dual placement (top + bottom) for easy navigation
        if (totalHits > PAGE_SIZE) {
            const topWrapper = renderPaginationWrapper();
            topWrapper.classList.add('pagination-wrapper--top');
            const bottomWrapper = renderPaginationWrapper();
            bottomWrapper.classList.add('pagination-wrapper--bottom');

            // Insert top pagination immediately after the results meta header (above grid)
            const headerEl = resultsList.querySelector('.search-results-meta');
            if (headerEl) {
                headerEl.insertAdjacentElement('afterend', topWrapper);
            } else {
                resultsList.prepend(topWrapper);
            }
            // Bottom pagination after the grid
            resultsList.appendChild(bottomWrapper);
        } else if (totalHits > 0) {
            // Single page info only (no controls needed) — keep single bottom info to avoid duplication
            const singleInfo = document.createElement('div');
            singleInfo.className = 'pagination-wrapper pagination-wrapper--bottom';
            singleInfo.innerHTML = `<div class="pagination-info">${totalHits} recipe${totalHits !== 1 ? 's' : ''} found in <strong>${sourceBadgeText}</strong></div>`;
            resultsList.appendChild(singleInfo);
        }

        // SEO JSON-LD
        try {
            const oldScript = document.querySelector('#recipe-json-ld');
            if (oldScript) oldScript.remove();
            const schemaItems = pageHits.map(item => {
                const r = item.recipe || item;
                return {
                    "@context": "https://schema.org",
                    "@type": "Recipe",
                    "name": r.label || "Delicious Dish",
                    "image": [r.image || (r.images && r.images.REGULAR ? r.images.REGULAR.url : "")],
                    "author": { "@type": "Person", "name": r.source || "Foodies Goodies" },
                    "recipeYield": `${Math.max(1, Math.round(r.yield || 1))} servings`,
                    "nutrition": { "@type": "NutritionInformation", "calories": `${Math.round(r.calories || 0)} calories` },
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

        if (shouldScroll) {
            // Defer scroll to next frame so grid has rendered
            requestAnimationFrame(() => scrollToResultsTop());
        }
    }

    /**
     * Legacy renderRecipes shim — kept for backward compatibility if any external call uses it.
     * Now delegates to paginated renderer.
     */
    function renderRecipes(hits, append = false, totalCount = null, isLive = true) {
        // If append is true, we're in legacy load-more path — just ignore and rerender current page
        if (!append) {
            if (isLive) {
                liveAllHits = [...hits];
                totalHits = totalCount || hits.length;
                isVaultMode = false;
                currentDataIsLive = true;
            } else {
                // Vault initial
                // hits here is already sliced; but we have full vault in vaultAllHits
                // No-op because executeSearch already set vaultAllHits; this path only for compatibility
            }
            renderCurrentPage(1, false);
        } else {
            // Legacy append: treat as buffering more hits then stay on current page
            if (!isVaultMode && Array.isArray(hits)) {
                liveAllHits.push(...hits);
                totalHits = totalCount || totalHits;
                renderCurrentPage(currentPage, false);
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

    const modalBackdropEl = document.getElementById('quickViewModalBackdrop');
    if (modalBackdropEl) {
        modalBackdropEl.addEventListener('click', (e) => {
            if (e.target === modalBackdropEl) closeQuickView();
        });
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeQuickView();
    });

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
