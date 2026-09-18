/**
 * FoodiesGoodies - Live Edamam Recipe Search Integration
 * Connects directly to the EDAMAM Recipe Search API v2
 * Provides real-time recipe discovery, rich nutritional metrics, ingredients, and pagination.
 */

document.addEventListener('DOMContentLoaded', () => {
    const searchForm = document.querySelector('#recipeSearchForm');
    const searchInput = document.querySelector('#search');
    const resultsList = document.querySelector('#results');
    const quickTags = document.querySelectorAll('.quick-tag');

    // Secure server-side ASP.NET Core proxy endpoint
    const apiBasePath = '/api/recipes';

    let nextPaginationCursor = null;
    let currentSearchQuery = '';

    if (!searchForm || !searchInput || !resultsList) {
        return;
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
     * Executes recipe search through server-side proxy
     */
    async function executeSearch(query) {
        currentSearchQuery = query;
        nextPaginationCursor = null;

        // Show loading state
        resultsList.innerHTML = `
            <div class="search-status-message" role="status" aria-live="polite">
                <div class="search-spinner" aria-hidden="true"></div>
                <h3>Connecting to Culinary Recipe Cloud...</h3>
                <p>Retrieving authentic recipes, ingredients, and nutrition data for "<strong>${escapeHTML(query)}</strong>"</p>
            </div>
        `;

        const apiUrl = `${apiBasePath}?q=${encodeURIComponent(query)}`;

        try {
            const response = await fetch(apiUrl, {
                headers: {
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.message || `Recipe API HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();

            // Save next page pagination cursor if present
            nextPaginationCursor = data.nextCursor || null;

            if (data.hits && data.hits.length > 0) {
                renderRecipes(data.hits, false, data.count || data.hits.length);
            } else {
                resultsList.innerHTML = `
                    <div class="search-status-message">
                        <h3>No recipes found for "${escapeHTML(query)}"</h3>
                        <p>Try searching for broader terms such as <em>chicken, pasta, avocado salad, chocolate brownies, or curry</em>.</p>
                    </div>
                `;
            }

        } catch (error) {
            console.error('Recipe fetch error:', error);
            resultsList.innerHTML = `
                <div class="search-status-message error-state">
                    <h3>Connection Notice</h3>
                    <p>${escapeHTML(error.message || 'Could not connect to the recipe database right now. Please check your connection and try again.')}</p>
                    <button type="button" class="search-btn retry-btn" style="margin: 15px auto 0;">Retry Search</button>
                </div>
            `;

            const retryBtn = resultsList.querySelector('.retry-btn');
            if (retryBtn) {
                retryBtn.addEventListener('click', () => executeSearch(query));
            }
        }
    }

    /**
     * Load next page of recipes from opaque cursor endpoint
     */
    async function loadMoreRecipes() {
        if (!nextPaginationCursor) return;

        const loadMoreBtn = document.querySelector('#loadMoreBtn');
        if (loadMoreBtn) {
            loadMoreBtn.disabled = true;
            loadMoreBtn.textContent = 'Loading More Delicious Recipes...';
        }

        try {
            const nextUrl = `${apiBasePath}/next?cursor=${encodeURIComponent(nextPaginationCursor)}`;
            const response = await fetch(nextUrl, {
                headers: { 'Accept': 'application/json' }
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.message || `Pagination error: ${response.status}`);
            }

            const data = await response.json();

            nextPaginationCursor = data.nextCursor || null;

            if (data.hits && data.hits.length > 0) {
                renderRecipes(data.hits, true);
            }

        } catch (err) {
            console.error('Failed to load more recipes:', err);
            if (loadMoreBtn) {
                loadMoreBtn.textContent = 'Unable to load more';
            }
        }
    }

    let currentHitsList = [];

    /**
     * Quick View Modal Handlers
     */
    function openQuickView(recipe) {
        const modalBackdrop = document.getElementById('quickViewModalBackdrop');
        if (!modalBackdrop) return;

        const imgEl = document.getElementById('quickViewImage');
        if (imgEl) {
            imgEl.src = recipe.image || (recipe.images && recipe.images.REGULAR ? recipe.images.REGULAR.url : '../assets/images/blueberry.png');
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
        const time = recipe.totalTime ? `${recipe.totalTime} mins` : '15-20 mins';

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
                ingredientsEl.innerHTML = '<li>Ingredients details available in full recipe.</li>';
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
    function renderRecipes(hits, append = false, totalCount = null) {
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
            const imageUrl = escapeHTML(recipe.image || (recipe.images && recipe.images.REGULAR ? recipe.images.REGULAR.url : '../assets/images/blueberry.png'));
            const recipeUrl = escapeHTML(recipe.url || '#');
            const source = escapeHTML(recipe.source || 'Chef Partner');
            const calories = Math.round(recipe.calories || 0);
            const servings = Math.max(1, Math.round(recipe.yield || 1));
            const calsPerServing = Math.round(calories / servings);
            const cookingTime = recipe.totalTime ? `${recipe.totalTime} mins` : null;

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
                recipe.healthLabels.filter(h => ['Vegetarian', 'Vegan', 'Gluten-Free', 'Keto-Friendly', 'Dairy-Free'].includes(h)).slice(0, 2).forEach(h => {
                    if (!badges.includes(h)) badges.push(h);
                });
            }

            const ingredientLines = Array.isArray(recipe.ingredientLines) ? recipe.ingredientLines : [];

            cardsHtml += `
            <article class="recipe-card card-hover-lift" data-dish="${label}">
                <div class="card-media-wrapper">
                    <img src="${imageUrl}" alt="${label}" class="aspect-16-9" loading="lazy" decoding="async" onerror="this.src='../assets/images/blueberry.png'">
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
                            🍽️ <strong>${servings}</strong> ${servings === 1 ? 'serving' : 'servings'}
                        </span>
                        ${cookingTime ? `<span class="metric-item" title="Prep/Cook Time">⏱️ <strong>${cookingTime}</strong></span>` : ''}
                    </div>

                    <!-- Dietary Tags -->
                    ${badges.length > 0 ? `
                        <div class="dietary-tags">
                            ${badges.map(b => `<span class="badge-tag">${escapeHTML(b)}</span>`).join('')}
                        </div>
                    ` : ''}

                    <!-- Action Buttons -->
                    <div class="recipe-card-actions" style="display:flex;gap:8px;margin-top:14px;">
                        <button type="button" class="btn-secondary-glass btn-trigger-quickview" data-index="${globalIndex}" style="flex:1;padding:8px 12px;font-size:0.85rem;justify-content:center;">
                            👁️ Quick View
                        </button>
                        <a href="${recipeUrl}" class="btn-primary-glass" target="_blank" rel="noopener noreferrer" style="flex:1;padding:8px 12px;font-size:0.85rem;text-decoration:none;">
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
            const headerBanner = `
                <div class="search-results-meta">
                    <div class="results-count-text">
                        Showing recipes from <strong>EDAMAM API</strong> for "<strong>${escapeHTML(currentSearchQuery)}</strong>"
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

        // Add "Load More" button if pagination cursor exists
        if (nextPaginationCursor) {
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