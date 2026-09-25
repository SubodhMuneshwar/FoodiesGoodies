/**
 * FoodiesGoodies AI Diet Planner & Cultural Meal Schedule Generator (js/ai.js)
 * Production Architecture: Server-Side Gemini AI Agent + Deterministic Nutrition Engine
 *
 * Flow:
 * 1. User enters biometric, cultural, allergy, and lifestyle constraints.
 * 2. FoodiesGoodies ASP.NET Core validates and computes authoritative Mifflin-St Jeor targets.
 * 3. Server-side DietPlannerAgent invokes Gemini with structured JSON output + Edamam recipe matching.
 * 4. Server-side DietPlanValidator validates allergens, caloric realism, and macro distributions.
 * 5. Full 7-Day schedule rendered with day navigation, interactive grocery checklist, and single-meal swapping.
 *
 * SECURITY: The browser NEVER handles, stores, or transmits Gemini API credentials.
 */

document.addEventListener('DOMContentLoaded', () => {
    const aiForm = document.querySelector('#aiDieticianForm');
    const resultsContainer = document.querySelector('#aiResults');
    const btnMetric = document.getElementById('btn-unit-metric');
    const btnImperial = document.getElementById('btn-unit-imperial');
    const labelHeight = document.getElementById('label-height');
    const labelWeight = document.getElementById('label-weight');
    const heightInput = document.getElementById('height');
    const weightInput = document.getElementById('weight');
    const countrySelect = document.getElementById('country');
    const regionInput = document.getElementById('region');
    const cuisineSelect = document.getElementById('cuisine');
    const mealCountSelect = document.getElementById('mealCount');
    const allergyChips = document.querySelectorAll('.allergy-chip');

    let currentUnitSystem = 'metric'; // 'metric' or 'imperial'
    let currentPlanData = null;       // Cached active 7-day plan
    let activeDayIndex = 0;           // Current visible day (0 = Day 1)
    let currentRequestPayload = null; // Stored user constraints for meal swaps

    // 1. Country & Region Dynamic Recommendations (Preserves independent cuisine selection)
    const countryPresets = {
        'India': { region: 'Maharashtra', cuisine: 'Maharashtrian' },
        'United States': { region: 'California', cuisine: 'American Farm-to-Table' },
        'Canada': { region: 'Ontario', cuisine: 'American Farm-to-Table' },
        'United Kingdom': { region: 'London', cuisine: 'American Farm-to-Table' },
        'Japan': { region: 'Kanto', cuisine: 'Japanese' },
        'South Korea': { region: 'Seoul', cuisine: 'Korean' },
        'Mexico': { region: 'Oaxaca', cuisine: 'Mexican' },
        'Greece': { region: 'Crete', cuisine: 'Mediterranean' },
        'Italy': { region: 'Tuscany', cuisine: 'Mediterranean' },
        'France': { region: 'Provence', cuisine: 'Mediterranean' },
        'Australia': { region: 'New South Wales', cuisine: 'Global Clean Fusion' }
    };

    if (countrySelect && regionInput) {
        countrySelect.addEventListener('change', () => {
            const selectedCountry = countrySelect.value;
            const preset = countryPresets[selectedCountry];
            if (preset) {
                regionInput.value = preset.region;
                // Only suggest cuisine if cuisine hasn't been deliberately customized
                if (cuisineSelect && !cuisineSelect.dataset.userChanged) {
                    for (let opt of cuisineSelect.options) {
                        if (opt.value === preset.cuisine) {
                            cuisineSelect.value = opt.value;
                            break;
                        }
                    }
                }
            }
        });
    }

    if (cuisineSelect) {
        cuisineSelect.addEventListener('change', () => {
            cuisineSelect.dataset.userChanged = 'true';
        });
    }

    // 2. Allergy Multi-Select Chips
    allergyChips.forEach(chip => {
        chip.addEventListener('click', () => {
            chip.classList.toggle('selected');
        });
    });

    // 3. Metric / Imperial Unit Switcher
    if (btnMetric && btnImperial && heightInput && weightInput) {
        btnMetric.addEventListener('click', () => {
            if (currentUnitSystem === 'metric') return;
            currentUnitSystem = 'metric';
            btnMetric.classList.add('active');
            btnImperial.classList.remove('active');

            if (labelHeight) labelHeight.textContent = 'Height (cm)';
            if (labelWeight) labelWeight.textContent = 'Weight (kg)';

            const inches = parseFloat(heightInput.value);
            if (!isNaN(inches) && inches > 0) {
                heightInput.value = Math.round(inches * 2.54);
            } else {
                heightInput.value = 175;
            }
            heightInput.min = "60";
            heightInput.max = "260";

            const lbs = parseFloat(weightInput.value);
            if (!isNaN(lbs) && lbs > 0) {
                weightInput.value = Math.round(lbs / 2.20462);
            } else {
                weightInput.value = 75;
            }
            weightInput.min = "25";
            weightInput.max = "350";
        });

        btnImperial.addEventListener('click', () => {
            if (currentUnitSystem === 'imperial') return;
            currentUnitSystem = 'imperial';
            btnImperial.classList.add('active');
            btnMetric.classList.remove('active');

            if (labelHeight) labelHeight.textContent = 'Height (inches)';
            if (labelWeight) labelWeight.textContent = 'Weight (lbs)';

            const cm = parseFloat(heightInput.value);
            if (!isNaN(cm) && cm > 0) {
                heightInput.value = Math.round(cm / 2.54);
            } else {
                heightInput.value = 69;
            }
            heightInput.min = "24";
            heightInput.max = "102";

            const kg = parseFloat(weightInput.value);
            if (!isNaN(kg) && kg > 0) {
                weightInput.value = Math.round(kg * 2.20462);
            } else {
                weightInput.value = 165;
            }
            weightInput.min = "55";
            weightInput.max = "770";
        });
    }

    if (!aiForm || !resultsContainer) return;

    // 4. Form Submission & Agent Pipeline
    aiForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const age = parseInt(document.querySelector('#age').value, 10);
        const gender = document.querySelector('#gender').value;
        const rawWeight = parseFloat(weightInput.value);
        const rawHeight = parseFloat(heightInput.value);
        const country = countrySelect ? countrySelect.value : 'India';
        const region = regionInput ? regionInput.value.trim() : 'Maharashtra';
        const goal = document.querySelector('#goal').value;
        const activity = document.querySelector('#activity').value;
        const diet = document.querySelector('#diet').value;
        const cuisine = cuisineSelect ? cuisineSelect.value : 'Maharashtrian';
        const mealCount = mealCountSelect ? parseInt(mealCountSelect.value, 10) : 4;
        const maxCookingTime = parseInt(document.querySelector('#maxCookingTime')?.value || '30', 10);
        const budget = document.querySelector('#budget')?.value || 'moderate';
        const cookingSkill = document.querySelector('#cookingSkill')?.value || 'intermediate';

        const favoriteFoodsRaw = document.querySelector('#favoriteFoods')?.value || '';
        const foodsToAvoidRaw = document.querySelector('#foodsToAvoid')?.value || '';

        const favoriteFoods = favoriteFoodsRaw
            .split(',')
            .map(s => s.trim())
            .filter(s => s.length > 0);

        const foodsToAvoid = foodsToAvoidRaw
            .split(',')
            .map(s => s.trim())
            .filter(s => s.length > 0);

        const selectedAllergies = Array.from(document.querySelectorAll('.allergy-chip.selected'))
            .map(chip => chip.getAttribute('data-value'));

        if (isNaN(age) || isNaN(rawWeight) || isNaN(rawHeight)) {
            showNotification('Please enter valid numerical values for age, weight, and height.', 'warning');
            return;
        }

        // Standardize to metric kg and cm for backend Mifflin-St Jeor
        let weightKg = rawWeight;
        let heightCm = rawHeight;
        if (currentUnitSystem === 'imperial') {
            weightKg = rawWeight * 0.453592;
            heightCm = rawHeight * 2.54;
        }

        const requestPayload = {
            age: age,
            gender: gender,
            heightCm: Math.round(heightCm),
            weightKg: Math.round(weightKg * 10) / 10,
            activityLevel: activity,
            goal: goal,
            country: country,
            region: region,
            cuisine: cuisine,
            dietPreference: diet,
            allergies: selectedAllergies,
            foodsToAvoid: foodsToAvoid,
            favoriteFoods: favoriteFoods,
            mealCount: mealCount,
            budget: budget,
            maxCookingTimeMinutes: maxCookingTime,
            cookingSkill: cookingSkill
        };

        currentRequestPayload = requestPayload;

        // Realistic Loading Stages
        const stages = [
            "Analyzing your biometric nutrition profile...",
            "Calculating authoritative Mifflin-St Jeor targets...",
            "Resolving cultural cuisine & regional staples...",
            "DietPlannerAgent consulting Gemini AI...",
            "Designing personalized 7-day meal schedule...",
            "Verifying allergens & dietary constraints...",
            "Validating caloric accuracy & macro distribution...",
            "Finalizing your 7-day nutrition blueprint..."
        ];

        let stageIdx = 0;
        if (window.FoodiesLoader) {
            window.FoodiesLoader.show(stages[0]);
        }

        const loaderInterval = setInterval(() => {
            stageIdx++;
            if (stageIdx < stages.length && window.FoodiesLoader) {
                window.FoodiesLoader.show(stages[stageIdx]);
            }
        }, 1100);

        try {
            const response = await fetch('/api/ai/diet-plan', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestPayload)
            });

            clearInterval(loaderInterval);

            if (!response.ok) {
                const errData = await response.json().catch(() => null);
                const errorMsg = errData?.message || `Server returned status ${response.status}`;
                throw new Error(errorMsg);
            }

            const apiResponse = await response.json();
            const plan = apiResponse.data || apiResponse;

            currentPlanData = plan;
            activeDayIndex = 0;
            renderCompleteDietPlan(plan);
            showNotification('Your 7-day personalized plan is ready! 🥗', 'success');
        } catch (err) {
            clearInterval(loaderInterval);
            console.error('Diet Planner error:', err);
            showNotification(err.message || 'Unable to generate diet plan. Please try again.', 'error');
        } finally {
            if (window.FoodiesLoader) {
                window.FoodiesLoader.hide();
            }
            resultsContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });

    // 5. Render Full 7-Day Plan
    function renderCompleteDietPlan(plan) {
        const bio = plan.nutrition || {};
        const cuisine = plan.cuisine || {};
        const days = plan.days || [];
        const groceryCategories = plan.groceryList || [];
        const digestiveTip = plan.digestiveTip || 'Stay hydrated with warm infusions between meals.';
        const planSource = plan.planSource || 'Gemini AI';

        const isGeminiLive = planSource.toLowerCase().includes('gemini');
        const sourceBadgeHtml = isGeminiLive
            ? `<span class="source-badge gemini-badge"><ion-icon name="sparkles"></ion-icon> Gemini AI Powered</span>`
            : `<span class="source-badge fallback-badge"><ion-icon name="hardware-chip-outline"></ion-icon> FoodiesGoodies Planning Engine</span>`;

        // Macro energy distribution percentages
        const proteinCalPct = bio.targetCalories > 0 ? Math.round(((bio.proteinGrams * 4) / bio.targetCalories) * 100) : 25;
        const carbsCalPct = bio.targetCalories > 0 ? Math.round(((bio.carbsGrams * 4) / bio.targetCalories) * 100) : 48;
        const fatCalPct = bio.targetCalories > 0 ? Math.round(((bio.fatGrams * 9) / bio.targetCalories) * 100) : 27;

        // Render Day Navigation Tabs
        const dayTabsHtml = days.map((day, idx) => `
            <button type="button" class="day-tab-btn ${idx === activeDayIndex ? 'active' : ''}" data-day-index="${idx}">
                <ion-icon name="calendar-outline"></ion-icon>
                <span>${escapeHtml(day.dayName || ('Day ' + day.day))}</span>
            </button>
        `).join('');

        // Build Active Day Meals
        const activeDay = days[activeDayIndex] || days[0] || { meals: [] };
        const mealsHtml = renderMealsForDay(activeDay);

        // Render Grocery Basket Checklist
        const groceryHtml = groceryCategories.length > 0 ? `
            <div class="grocery-basket-section">
                <h3>
                    <ion-icon name="basket-outline" aria-hidden="true"></ion-icon>
                    Weekly Consolidated Grocery Checklist
                </h3>
                <div class="grocery-grid">
                    ${groceryCategories.map((cat, catIdx) => `
                        <div class="grocery-card">
                            <div class="grocery-card-title">
                                <ion-icon name="checkmark-circle-outline"></ion-icon>
                                <span>${escapeHtml(cat.category)}</span>
                            </div>
                            <div class="grocery-checklist-container">
                                ${(cat.items || []).map((item, itemIdx) => {
                                    const itemId = `gcheck_${catIdx}_${itemIdx}`;
                                    return `
                                        <label class="grocery-checklist-item" for="${itemId}">
                                            <input type="checkbox" id="${itemId}" class="grocery-cb">
                                            <span>${escapeHtml(item)}</span>
                                        </label>
                                    `;
                                }).join('')}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        ` : '';

        resultsContainer.innerHTML = `
            <div class="results-header">
                <div>
                    <h2 style="margin:0; font-size:1.55rem; color:var(--text-primary); font-family:var(--font-heading);">
                        ${escapeHtml(plan.planTitle || '7-Day Personalized Nutrition Blueprint')}
                    </h2>
                    <div style="display:flex; align-items:center; gap:8px; margin-top:8px; flex-wrap:wrap;">
                        ${sourceBadgeHtml}
                        <span class="goal-tag">${escapeHtml(bio.goalLabel || 'Personalized')}</span>
                    </div>
                </div>
            </div>

            <!-- Cultural Heritage Card -->
            <div class="cultural-header-card">
                <div class="cultural-flag-row">
                    <span class="cultural-flag" aria-hidden="true">${escapeHtml(cuisine.flag || '🌍')}</span>
                    <div>
                        <span class="cultural-country-label">${escapeHtml(cuisine.country || 'Culinary Tradition')} ${cuisine.region ? '• ' + escapeHtml(cuisine.region) : ''}</span>
                        <h3>${escapeHtml(cuisine.name || 'Authentic Cuisine')}</h3>
                    </div>
                </div>
                <p class="cultural-desc-text">${escapeHtml(cuisine.description || '')}</p>
                <div class="cultural-staples-chips">
                    ${cuisine.stapleGrainsAndProteins ? `<span class="staple-chip"><strong>Staples:</strong> ${escapeHtml(cuisine.stapleGrainsAndProteins)}</span>` : ''}
                    ${cuisine.keySpices ? `<span class="staple-chip"><strong>Aromatics:</strong> ${escapeHtml(cuisine.keySpices)}</span>` : ''}
                </div>
            </div>

            <!-- Authoritative Deterministic Macro Dashboard -->
            <div class="macro-dashboard">
                <div class="macro-box">
                    <span class="macro-label">Daily Target</span>
                    <div class="macro-value">${bio.targetCalories}</div>
                    <div class="macro-unit" style="font-size:0.75rem; color:var(--text-muted); margin-top:2px;">kcal / day (TDEE: ${bio.tdee})</div>
                </div>
                <div class="macro-box">
                    <span class="macro-label">Protein</span>
                    <div class="macro-value">${bio.proteinGrams}g</div>
                    <div class="macro-unit" style="font-size:0.75rem; color:var(--text-muted); margin-top:2px;">${proteinCalPct}% energy</div>
                </div>
                <div class="macro-box">
                    <span class="macro-label">Carbohydrates</span>
                    <div class="macro-value">${bio.carbsGrams}g</div>
                    <div class="macro-unit" style="font-size:0.75rem; color:var(--text-muted); margin-top:2px;">${carbsCalPct}% energy</div>
                </div>
                <div class="macro-box">
                    <span class="macro-label">Healthy Fats</span>
                    <div class="macro-value">${bio.fatGrams}g</div>
                    <div class="macro-unit" style="font-size:0.75rem; color:var(--text-muted); margin-top:2px;">${fatCalPct}% energy</div>
                </div>
            </div>

            <!-- 7-Day Navigation Tabs -->
            <div class="days-tabs-container">
                <div class="days-tabs-nav" id="daysTabsNav" role="tablist">
                    ${dayTabsHtml}
                </div>
            </div>

            <!-- Meals Timeline Container -->
            <div class="meals-container" id="mealsContainer">
                ${mealsHtml}
            </div>

            <!-- Digestive & Vitality Wisdom -->
            <div class="digestive-wisdom-box">
                <ion-icon name="leaf-outline" aria-hidden="true"></ion-icon>
                <p>
                    <strong>Cultural Digestion Wisdom:</strong> ${escapeHtml(digestiveTip)}
                    <br><span style="font-size:0.82rem; color:var(--text-muted); margin-top:4px; display:inline-block;">Hydration Target: <strong>${bio.waterLiters || 2.5} Liters (${bio.waterOz || 84} fl oz)</strong> clean filtered water daily.</span>
                </p>
            </div>

            <!-- Grocery Basket -->
            ${groceryHtml}

            <!-- Plan Actions Bar (Kitchen Print & PDF) -->
            <div class="plan-actions-bar">
                <div class="plan-actions-text">
                    <strong>Kitchen &amp; Fridge Ready</strong> &bull; Print this 7-day schedule or save it as a PDF for meal preparation.
                </div>
                <button type="button" class="btn-print-plan" id="btnPrintPlan">
                    <ion-icon name="print-outline"></ion-icon>
                    <span>Print / Save PDF</span>
                </button>
            </div>

            <!-- Medical Compliance Statement -->
            <div style="margin-top:20px; text-align:center; font-size:0.78rem; color:var(--text-muted); line-height:1.4;">
                ⚕️ <em>${escapeHtml(plan.disclaimer || 'Nutritional projections are computed via the Mifflin-St Jeor basal metabolic equation and macronutrient standard distribution guidelines. For therapeutic nutrition, pregnancy, or medical treatment, always seek individualized care from a licensed healthcare provider.')}</em>
            </div>
        `;

        attachInteractiveListeners();
    }

    // Helper: Render Meals for a given day
    function renderMealsForDay(day) {
        const meals = day.meals || [];
        const mealsListHtml = meals.map((meal, mealIdx) => {
            const ingList = (meal.ingredients || []).map(ing => `<span class="ingredient-pill">${escapeHtml(ing)}</span>`).join('');
            const chefTipHtml = meal.chefTip
                ? `<div class="meal-chef-tip">
                     <ion-icon name="restaurant-outline" aria-hidden="true"></ion-icon>
                     <span><strong>Chef's Cultural Tip:</strong> ${escapeHtml(meal.chefTip)}</span>
                   </div>`
                : '';

            const recipeLinkHtml = meal.recipeUrl
                ? `<a href="${escapeHtml(meal.recipeUrl)}" target="_blank" rel="noopener noreferrer" class="recipe-link-btn" title="View authentic tested recipe">
                     <ion-icon name="book-outline"></ion-icon>
                     <span>Verified Recipe</span>
                   </a>`
                : '';

            return `
                <div class="meal-item" id="meal-card-${meal.mealId || mealIdx}">
                    <div class="meal-header-row">
                        <div class="meal-title-group">
                            <span class="meal-category-tag">${escapeHtml(meal.category || 'Meal')}</span>
                            <h4>${escapeHtml(meal.name)}</h4>
                        </div>
                        <span class="meal-cals-badge">${meal.calories} kcal</span>
                    </div>
                    <div class="meal-macro-mini-row">
                        <span><strong>Protein:</strong> ${meal.proteinGrams || 0}g</span>
                        <span><strong>Carbs:</strong> ${meal.carbsGrams || 0}g</span>
                        <span><strong>Fats:</strong> ${meal.fatGrams || 0}g</span>
                        ${meal.cookingTimeMinutes ? `<span><ion-icon name="timer-outline"></ion-icon> ${meal.cookingTimeMinutes}m</span>` : ''}
                    </div>
                    <p class="meal-desc">${escapeHtml(meal.description)}</p>
                    ${ingList ? `<div class="meal-ingredients-list">${ingList}</div>` : ''}
                    ${chefTipHtml}
                    <div class="meal-actions-row">
                        <button type="button" class="btn-swap-meal"
                                data-day="${day.day}"
                                data-category="${escapeHtml(meal.category)}"
                                data-meal-name="${escapeHtml(meal.name)}"
                                data-meal-idx="${mealIdx}">
                            <ion-icon name="swap-horizontal-outline"></ion-icon>
                            <span>Swap Meal</span>
                        </button>
                        ${recipeLinkHtml}
                    </div>
                </div>
            `;
        }).join('');

        return `
            <div class="day-header-summary">
                <span><strong>${escapeHtml(day.dayName || ('Day ' + day.day))} Schedule</strong></span>
                <span>Day Target: <strong>${day.totalCalories || 0} kcal</strong> &bull; P: <strong>${day.totalProteinGrams || 0}g</strong> &bull; C: <strong>${day.totalCarbsGrams || 0}g</strong> &bull; F: <strong>${day.totalFatGrams || 0}g</strong></span>
            </div>
            ${mealsListHtml}
        `;
    }

    // 6. Attach Handlers for Day Tabs, Meal Swapping, Grocery Checklist, and Print
    function attachInteractiveListeners() {
        // Tab Switching
        const tabBtns = document.querySelectorAll('.day-tab-btn');
        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const targetIdx = parseInt(btn.getAttribute('data-day-index'), 10);
                if (targetIdx !== activeDayIndex && currentPlanData && currentPlanData.days[targetIdx]) {
                    activeDayIndex = targetIdx;
                    tabBtns.forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');

                    const mealsContainer = document.getElementById('mealsContainer');
                    if (mealsContainer) {
                        mealsContainer.innerHTML = renderMealsForDay(currentPlanData.days[activeDayIndex]);
                        attachSwapMealHandlers();
                    }
                }
            });
        });

        // Swap Meal Handlers
        attachSwapMealHandlers();

        // Grocery Checklist Interaction
        const groceryCheckboxes = document.querySelectorAll('.grocery-cb');
        groceryCheckboxes.forEach(cb => {
            cb.addEventListener('change', () => {
                const label = cb.closest('.grocery-checklist-item');
                if (label) {
                    label.classList.toggle('checked', cb.checked);
                }
            });
        });

        // Print Handler
        const btnPrint = document.getElementById('btnPrintPlan');
        if (btnPrint) {
            btnPrint.addEventListener('click', () => {
                window.print();
            });
        }
    }

    // Attach click listeners to all .btn-swap-meal elements
    function attachSwapMealHandlers() {
        const swapBtns = document.querySelectorAll('.btn-swap-meal');
        swapBtns.forEach(btn => {
            btn.addEventListener('click', async () => {
                const dayNumber = parseInt(btn.getAttribute('data-day'), 10);
                const mealCategory = btn.getAttribute('data-category');
                const currentMealName = btn.getAttribute('data-meal-name');
                const mealIdx = parseInt(btn.getAttribute('data-meal-idx'), 10);

                if (!currentPlanData || !currentRequestPayload) return;

                btn.classList.add('loading');
                btn.innerHTML = `<ion-icon name="sync-outline" class="spin"></ion-icon> <span>Swapping...</span>`;

                const swapPayload = {
                    day: dayNumber,
                    mealCategory: mealCategory,
                    currentMealName: currentMealName,
                    targetCalories: currentPlanData.days[activeDayIndex]?.meals[mealIdx]?.calories || 500,
                    targetProteinGrams: currentPlanData.days[activeDayIndex]?.meals[mealIdx]?.proteinGrams || 30,
                    targetCarbsGrams: currentPlanData.days[activeDayIndex]?.meals[mealIdx]?.carbsGrams || 60,
                    targetFatGrams: currentPlanData.days[activeDayIndex]?.meals[mealIdx]?.fatGrams || 15,
                    country: currentRequestPayload.country,
                    region: currentRequestPayload.region,
                    cuisine: currentRequestPayload.cuisine,
                    dietPreference: currentRequestPayload.dietPreference,
                    allergies: currentRequestPayload.allergies,
                    foodsToAvoid: currentRequestPayload.foodsToAvoid,
                    maxCookingTimeMinutes: currentRequestPayload.maxCookingTimeMinutes,
                    budget: currentRequestPayload.budget
                };

                try {
                    const response = await fetch('/api/ai/diet-plan/swap-meal', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(swapPayload)
                    });

                    if (!response.ok) {
                        const err = await response.json().catch(() => null);
                        throw new Error(err?.message || `Failed to swap meal (${response.status})`);
                    }

                    const res = await response.json();
                    const swapData = res.data || res;
                    const newMeal = swapData.swappedMeal || swapData;

                    // Update memory state
                    if (currentPlanData.days[activeDayIndex] && currentPlanData.days[activeDayIndex].meals[mealIdx]) {
                        currentPlanData.days[activeDayIndex].meals[mealIdx] = newMeal;

                        // Re-render day meals
                        const mealsContainer = document.getElementById('mealsContainer');
                        if (mealsContainer) {
                            mealsContainer.innerHTML = renderMealsForDay(currentPlanData.days[activeDayIndex]);
                            attachSwapMealHandlers();
                        }
                    }

                    showNotification(`Swapped to ${newMeal.name}! 🍲`, 'success');
                } catch (err) {
                    console.error('Swap error:', err);
                    showNotification(err.message || 'Could not swap meal at this time.', 'error');
                    btn.classList.remove('loading');
                    btn.innerHTML = `<ion-icon name="swap-horizontal-outline"></ion-icon> <span>Swap Meal</span>`;
                }
            });
        });
    }

    function showNotification(msg, type) {
        if (typeof Swal === 'function') {
            Swal.fire({
                toast: true,
                position: 'top-end',
                icon: type || 'info',
                title: msg,
                showConfirmButton: false,
                timer: 3200,
                timerProgressBar: true
            });
        } else {
            alert(msg);
        }
    }

    function escapeHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }
});
