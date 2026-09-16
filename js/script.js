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

    // Edamam API v2 Credentials & Configuration
    const EDAMAM_APP_ID = '7aa516a5';
    const EDAMAM_APP_KEY = 'dc836a223fb788b11ae390504d9e97ce';
    const EDAMAM_BASE_URL = 'https://api.edamam.com/api/recipes/v2';

    let nextPaginationUrl = null;
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
     * Executes recipe search through Edamam API v2
     */
    async function executeSearch(query) {
        currentSearchQuery = query;
        nextPaginationUrl = null;

        // Show loading state
        resultsList.innerHTML = `
            <div class="search-status-message" role="status" aria-live="polite">
                <div class="search-spinner" aria-hidden="true"></div>
                <h3>Connecting to EDAMAM Recipe Cloud...</h3>
                <p>Retrieving authentic recipes, ingredients, and nutrition data for "<strong>${escapeHTML(query)}</strong>"</p>
            </div>
        `;

        const apiUrl = `${EDAMAM_BASE_URL}?type=public&q=${encodeURIComponent(query)}&app_id=${EDAMAM_APP_ID}&app_key=${EDAMAM_APP_KEY}`;

        try {
            const response = await fetch(apiUrl, {
                headers: {
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`Edamam API HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();

            // Save next page pagination link if present
            if (data._links && data._links.next && data._links.next.href) {
                nextPaginationUrl = data._links.next.href;
            } else {
                nextPaginationUrl = null;
            }

            if (data.hits && data.hits.length > 0) {
                renderRecipes(data.hits, false, data.count || data.hits.length);
            } else {
                resultsList.innerHTML = `
                    <div class="search-status-message">
                        <h3>No recipes found on Edamam for "${escapeHTML(query)}"</h3>
                        <p>Try searching for broader terms such as <em>chicken, pasta, avocado salad, chocolate brownies, or curry</em>.</p>
                    </div>
                `;
            }

        } catch (error) {
            console.error('Edamam API live fetch error:', error);
            // Attempt proxy fallback if direct client request encountered network restrictions
            await tryProxyFallback(query);
        }
    }

    /**
     * Fallback to server-side proxy in case of client network restrictions
     */
    async function tryProxyFallback(query) {
        try {
            const proxyResponse = await fetch(`../api/recipes.php?q=${encodeURIComponent(query)}`);
            if (proxyResponse.ok) {
                const proxyData = await proxyResponse.json();
                if (proxyData.hits && proxyData.hits.length > 0) {
                    renderRecipes(proxyData.hits, false, proxyData.count);
                    return;
                }
            }
        } catch (proxyError) {
            console.warn('Proxy fallback failed:', proxyError);
        }

        resultsList.innerHTML = `
            <div class="search-status-message error-state">
                <h3>Connection Notice</h3>
                <p>Could not connect to the recipe database right now. Please check your internet connection and try again.</p>
                <button type="button" class="search-btn retry-btn" style="margin: 15px auto 0;">Retry Search</button>
            </div>
        `;

        const retryBtn = resultsList.querySelector('.retry-btn');
        if (retryBtn) {
            retryBtn.addEventListener('click', () => executeSearch(query));
        }
    }

    /**
     * Load next page of recipes from Edamam v2 pagination link
     */
    async function loadMoreRecipes() {
        if (!nextPaginationUrl) return;

        const loadMoreBtn = document.querySelector('#loadMoreBtn');
        if (loadMoreBtn) {
            loadMoreBtn.disabled = true;
            loadMoreBtn.textContent = 'Loading More Delicious Recipes...';
        }

        try {
            const response = await fetch(nextPaginationUrl, {
                headers: { 'Accept': 'application/json' }
            });

            if (!response.ok) {
                throw new Error(`Pagination error: ${response.status}`);
            }

            const data = await response.json();

            if (data._links && data._links.next && data._links.next.href) {
                nextPaginationUrl = data._links.next.href;
            } else {
                nextPaginationUrl = null;
            }

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

    /**
     * Renders hits into the results grid
     */
    function renderRecipes(hits, append = false, totalCount = null) {
        let cardsHtml = '';

        hits.forEach((item) => {
            const recipe = item.recipe || item;
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
            <article class="recipe-card" data-dish="${label}">
                <div class="card-media-wrapper">
                    <img src="${imageUrl}" alt="${label}" loading="lazy" decoding="async" onerror="this.src='../assets/images/blueberry.png'">
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

                    <!-- Ingredients List (collapsible) -->
                    <details class="ingredients-accordion">
                        <summary>Ingredients (${ingredientLines.length})</summary>
                        <ul class="ingredients-list">
                            ${ingredientLines.map(ing => `<li>${escapeHTML(ing)}</li>`).join('')}
                        </ul>
                    </details>

                    <a href="${recipeUrl}" class="view-recipe-btn" target="_blank" rel="noopener noreferrer">
                        View Full Recipe ↗
                    </a>
                </div>
            </article>
            `;
        });

        if (append) {
            // Remove old load more container before appending
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

        // Add "Load More" button if pagination link exists
        if (nextPaginationUrl) {
            const paginationContainer = document.createElement('div');
            paginationContainer.className = 'pagination-container';
            paginationContainer.innerHTML = `
                <button type="button" id="loadMoreBtn" class="search-btn load-more-btn">
                    Load More Recipes from Edamam ↷
                </button>
            `;
            resultsList.appendChild(paginationContainer);

            const btn = document.querySelector('#loadMoreBtn');
            if (btn) {
                btn.addEventListener('click', loadMoreRecipes);
            }
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