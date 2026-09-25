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
    const btnResetPlan = document.getElementById('btnResetPlan');

    const STORAGE_KEY_INPUTS = 'foodies_diet_inputs';
    const STORAGE_KEY_PLAN = 'foodies_diet_plan';
    const STORAGE_KEY_UNIT = 'foodies_diet_unit_system';

    let currentUnitSystem = 'metric'; // 'metric' or 'imperial'
    let currentPlanData = null;       // Cached active 7-day plan
    let activeDayIndex = 0;           // Current visible day (0 = Day 1)
    let currentRequestPayload = null; // Stored user constraints for meal swaps

    // Reset button handler to clear saved plan and restore initial state
    if (btnResetPlan) {
        btnResetPlan.addEventListener('click', () => {
            try {
                localStorage.removeItem(STORAGE_KEY_INPUTS);
                localStorage.removeItem(STORAGE_KEY_PLAN);
                localStorage.removeItem(STORAGE_KEY_UNIT);
            } catch (e) {}

            currentPlanData = null;
            currentRequestPayload = null;
            aiForm.reset();
            allergyChips.forEach(chip => chip.classList.remove('selected'));
            if (btnMetric) btnMetric.click();

            resultsContainer.innerHTML = `
                <div class="results-placeholder">
                    <div class="icon-placeholder" aria-hidden="true">
                        <ion-icon name="speedometer-outline"></ion-icon>
                    </div>
                    <h3>Ready for Your Tailored Nutrition Plan &amp; BMI Analysis?</h3>
                    <p>Adjust your biometric parameters above and tap "Generate 7-Day Personalized Plan" to calculate your validated BMI assessment, target calories, macronutrient split, and personal meal schedule.</p>
                </div>
            `;
            showNotification('Form reset and saved plan cleared.', 'info');
            window.scrollTo({ top: aiForm.offsetTop - 80, behavior: 'smooth' });
        });
    }

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
            savePlanToStorage(requestPayload, currentUnitSystem, plan);
            renderCompleteDietPlan(plan);
            showNotification('Your personalized diet plan & BMI analysis are ready! 🥗', 'success');
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
            <!-- 1. Biometric Validation & Authoritative BMI Assessment Card -->
            ${renderBmiAssessmentCard(plan)}

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

            <!-- Minimalist Macro Nutrition Split Bar -->
            <div class="macro-minimal-section">
                <div class="macro-bar-wrap">
                    <div class="macro-bar">
                        <div class="macro-seg seg-protein" style="width: ${proteinCalPct}%;" title="Protein: ${bio.proteinGrams}g (${proteinCalPct}%)"></div>
                        <div class="macro-seg seg-carbs" style="width: ${carbsCalPct}%;" title="Carbohydrates: ${bio.carbsGrams}g (${carbsCalPct}%)"></div>
                        <div class="macro-seg seg-fats" style="width: ${fatCalPct}%;" title="Fats: ${bio.fatGrams}g (${fatCalPct}%)"></div>
                    </div>
                </div>
                <div class="macro-legend-row">
                    <div class="macro-legend-item">
                        <span class="legend-dot dot-cal"></span>
                        <span class="legend-name">Daily Target:</span>
                        <strong>${bio.targetCalories} kcal</strong>
                        <span class="legend-sub">(TDEE ${bio.tdee})</span>
                    </div>
                    <div class="macro-legend-item">
                        <span class="legend-dot dot-protein"></span>
                        <span class="legend-name">Protein:</span>
                        <strong>${bio.proteinGrams}g</strong>
                        <span class="legend-pct">(${proteinCalPct}%)</span>
                    </div>
                    <div class="macro-legend-item">
                        <span class="legend-dot dot-carbs"></span>
                        <span class="legend-name">Carbs:</span>
                        <strong>${bio.carbsGrams}g</strong>
                        <span class="legend-pct">(${carbsCalPct}%)</span>
                    </div>
                    <div class="macro-legend-item">
                        <span class="legend-dot dot-fats"></span>
                        <span class="legend-name">Fats:</span>
                        <strong>${bio.fatGrams}g</strong>
                        <span class="legend-pct">(${fatCalPct}%)</span>
                    </div>
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

                        // Persist updated plan with swapped meal
                        savePlanToStorage(currentRequestPayload, currentUnitSystem, currentPlanData);

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

    // 7. Render Authoritative Minimalist BMI Assessment Card
    function renderBmiAssessmentCard(plan) {
        const bio = plan.nutrition || {};
        let bmi = typeof bio.bmi === 'number' && bio.bmi > 0 ? bio.bmi : null;
        let bmiCategory = bio.bmiCategory || '';

        // Fallback calculation if not provided by backend
        if (!bmi) {
            let w = currentRequestPayload?.weightKg || parseFloat(weightInput?.value) || 70;
            let h = currentRequestPayload?.heightCm || parseFloat(heightInput?.value) || 175;
            if (currentUnitSystem === 'imperial') {
                w = w * 0.453592;
                h = h * 2.54;
            }
            if (w > 0 && h > 0) {
                const hm = h / 100;
                bmi = Math.round((w / (hm * hm)) * 10) / 10;
            } else {
                bmi = 22.9;
            }
        }

        if (!bmiCategory) {
            if (bmi < 18.5) bmiCategory = 'Underweight';
            else if (bmi < 25.0) bmiCategory = 'Normal Weight';
            else if (bmi < 30.0) bmiCategory = 'Overweight';
            else bmiCategory = 'Obese';
        }

        let categoryClass = 'normal';
        let dotColor = '#10B981';
        if (bmi < 18.5) { categoryClass = 'underweight'; dotColor = '#3B82F6'; }
        else if (bmi < 25.0) { categoryClass = 'normal'; dotColor = '#10B981'; }
        else if (bmi < 30.0) { categoryClass = 'overweight'; dotColor = '#F59E0B'; }
        else { categoryClass = 'obese'; dotColor = '#EF4444'; }

        // Scale marker position across 14 to 36 BMI range
        let meterPercent = Math.min(97, Math.max(3, ((bmi - 14) / 22) * 100));

        // Healthy weight range display string
        const healthyRangeStr = currentUnitSystem === 'imperial' && bio.healthyWeightRangeLbs
            ? bio.healthyWeightRangeLbs
            : (bio.healthyWeightRangeKg || '18.5 – 24.9 BMI');

        const goalLabel = bio.goalLabel || 'Optimal Health & Vitality';
        const weightDisplay = currentUnitSystem === 'imperial'
            ? `${Math.round((currentRequestPayload?.weightKg || 70) * 2.20462)} lbs`
            : `${currentRequestPayload?.weightKg || 70} kg`;
        const heightDisplay = currentUnitSystem === 'imperial'
            ? `${Math.round((currentRequestPayload?.heightCm || 175) / 2.54)} in`
            : `${currentRequestPayload?.heightCm || 175} cm`;

        let insightAdvice = '';
        if (bmi < 18.5) {
            insightAdvice = `Your validated BMI indicates you are in the <strong>Underweight</strong> spectrum. Calibrated with nutrient-dense complex foods for safe mass increase.`;
        } else if (bmi < 25.0) {
            insightAdvice = `Your validated BMI is in the <strong>Healthy Weight</strong> range. Calibrated specifically to sustain energy and hit your <strong>${escapeHtml(goalLabel)}</strong> goal.`;
        } else if (bmi < 30.0) {
            insightAdvice = `Your validated BMI indicates you are in the <strong>Overweight</strong> spectrum. Calibrated with high-satiety fiber and a safe metabolic deficit.`;
        } else {
            insightAdvice = `Your validated BMI falls in the <strong>Obese</strong> category. Calibrated with anti-inflammatory staples and structured portion pacing for cardiovascular health.`;
        }

        return `
            <div class="bmi-minimal-card" id="bmiAssessmentCard">
                <div class="bmi-minimal-topbar">
                    <div class="bmi-topbar-left">
                        <span class="bmi-title-label">Biometric Analysis</span>
                        <span class="bmi-verified-badge"><span class="badge-dot" style="background:${dotColor}"></span> Validated Baseline</span>
                    </div>
                    <div class="bmi-healthy-tag">
                        <span>Healthy Range: <strong>${escapeHtml(healthyRangeStr)}</strong></span>
                    </div>
                </div>

                <!-- Main Score & Spectrum Row -->
                <div class="bmi-minimal-hero">
                    <div class="bmi-hero-digits">
                        <div class="bmi-num-wrap">
                            <span class="bmi-num">${bmi.toFixed(1)}</span>
                            <span class="bmi-unit-sub">kg/m²</span>
                        </div>
                        <span class="bmi-pill-badge category-${categoryClass}">
                            <span class="pill-dot"></span>
                            ${escapeHtml(bmiCategory)}
                        </span>
                    </div>

                    <div class="bmi-hero-gauge">
                        <div class="bmi-gauge-track" role="meter" aria-valuenow="${bmi.toFixed(1)}" aria-valuemin="14" aria-valuemax="36" aria-label="BMI spectrum gauge">
                            <div class="gauge-marker" style="left: ${meterPercent.toFixed(1)}%;" title="Your BMI: ${bmi.toFixed(1)}">
                                <div class="gauge-marker-pin"></div>
                                <span class="gauge-marker-bubble">${bmi.toFixed(1)}</span>
                            </div>
                        </div>
                        <div class="bmi-gauge-scale">
                            <span>&lt;18.5 Under</span>
                            <span>18.5–24.9 Normal</span>
                            <span>25–29.9 Over</span>
                            <span>&ge;30 Obese</span>
                        </div>
                    </div>
                </div>

                <!-- Seamless Minimal Stat Ribbon -->
                <div class="bmi-ribbon">
                    <div class="ribbon-col">
                        <span class="ribbon-label">Basal Metabolic Rate</span>
                        <div class="ribbon-value">${bio.bmr || '--'} <span class="ribbon-unit">kcal</span></div>
                        <span class="ribbon-sub">Resting energy</span>
                    </div>
                    <div class="ribbon-col">
                        <span class="ribbon-label">Active Burn (TDEE)</span>
                        <div class="ribbon-value">${bio.tdee || '--'} <span class="ribbon-unit">kcal</span></div>
                        <span class="ribbon-sub">Daily expenditure</span>
                    </div>
                    <div class="ribbon-col highlight">
                        <span class="ribbon-label">Target Intake</span>
                        <div class="ribbon-value">${bio.targetCalories || '--'} <span class="ribbon-unit">kcal</span></div>
                        <span class="ribbon-sub">${escapeHtml(goalLabel)}</span>
                    </div>
                    <div class="ribbon-col">
                        <span class="ribbon-label">Hydration</span>
                        <div class="ribbon-value">${bio.hydrationLiters || bio.waterLiters || '2.5'} <span class="ribbon-unit">L</span></div>
                        <span class="ribbon-sub">~${bio.hydrationOz || bio.waterOz || '84'} fl oz</span>
                    </div>
                </div>

                <!-- Minimal Insight Line -->
                <div class="bmi-minimal-insight">
                    <ion-icon name="sparkles-outline"></ion-icon>
                    <p><strong>${escapeHtml(weightDisplay)}, ${escapeHtml(heightDisplay)}:</strong> ${insightAdvice}</p>
                </div>
            </div>
        `;
    }

    // 8. Storage Persistence Helpers
    function savePlanToStorage(requestPayload, unitSystem, plan) {
        try {
            localStorage.setItem(STORAGE_KEY_INPUTS, JSON.stringify(requestPayload));
            localStorage.setItem(STORAGE_KEY_UNIT, unitSystem);
            localStorage.setItem(STORAGE_KEY_PLAN, JSON.stringify(plan));
        } catch (e) {
            console.warn('Unable to persist diet plan to localStorage', e);
        }
    }

    function restoreSavedPlanIfAvailable() {
        try {
            const savedPlanRaw = localStorage.getItem(STORAGE_KEY_PLAN);
            if (!savedPlanRaw) return;

            const plan = JSON.parse(savedPlanRaw);
            if (!plan || !plan.days || plan.days.length === 0) return;

            const savedUnit = localStorage.getItem(STORAGE_KEY_UNIT);
            const savedInputsRaw = localStorage.getItem(STORAGE_KEY_INPUTS);

            // Restore Unit System
            if (savedUnit && savedUnit !== currentUnitSystem) {
                if (savedUnit === 'imperial' && btnImperial) {
                    btnImperial.click();
                } else if (savedUnit === 'metric' && btnMetric) {
                    btnMetric.click();
                }
            }

            // Restore Input Fields if available
            if (savedInputsRaw) {
                const inputs = JSON.parse(savedInputsRaw);
                currentRequestPayload = inputs;

                if (inputs.age && document.querySelector('#age')) document.querySelector('#age').value = inputs.age;
                if (inputs.gender && document.querySelector('#gender')) document.querySelector('#gender').value = inputs.gender;

                if (currentUnitSystem === 'imperial') {
                    if (inputs.weightKg && weightInput) weightInput.value = Math.round(inputs.weightKg * 2.20462);
                    if (inputs.heightCm && heightInput) heightInput.value = Math.round(inputs.heightCm / 2.54);
                } else {
                    if (inputs.weightKg && weightInput) weightInput.value = inputs.weightKg;
                    if (inputs.heightCm && heightInput) heightInput.value = inputs.heightCm;
                }

                if (inputs.country && countrySelect) countrySelect.value = inputs.country;
                if (inputs.region && regionInput) regionInput.value = inputs.region;
                if (inputs.goal && document.querySelector('#goal')) document.querySelector('#goal').value = inputs.goal;
                if (inputs.activity && document.querySelector('#activity')) document.querySelector('#activity').value = inputs.activity;
                if (inputs.diet && document.querySelector('#diet')) document.querySelector('#diet').value = inputs.diet;
                if (inputs.cuisine && cuisineSelect) cuisineSelect.value = inputs.cuisine;
                if (inputs.mealCount && mealCountSelect) mealCountSelect.value = inputs.mealCount;
                if (inputs.maxCookingTimeMinutes && document.querySelector('#maxCookingTime')) {
                    document.querySelector('#maxCookingTime').value = inputs.maxCookingTimeMinutes;
                }
                if (inputs.budget && document.querySelector('#budget')) {
                    document.querySelector('#budget').value = inputs.budget;
                }
                if (inputs.cookingSkill && document.querySelector('#cookingSkill')) {
                    document.querySelector('#cookingSkill').value = inputs.cookingSkill;
                }
                if (inputs.favoriteFoods && document.querySelector('#favoriteFoods')) {
                    document.querySelector('#favoriteFoods').value = Array.isArray(inputs.favoriteFoods) ? inputs.favoriteFoods.join(', ') : inputs.favoriteFoods;
                }
                if (inputs.foodsToAvoid && document.querySelector('#foodsToAvoid')) {
                    document.querySelector('#foodsToAvoid').value = Array.isArray(inputs.foodsToAvoid) ? inputs.foodsToAvoid.join(', ') : inputs.foodsToAvoid;
                }

                // Restore Allergies chips
                if (inputs.allergies && Array.isArray(inputs.allergies)) {
                    allergyChips.forEach(chip => {
                        const val = chip.getAttribute('data-value');
                        if (inputs.allergies.includes(val)) {
                            chip.classList.add('selected');
                        } else {
                            chip.classList.remove('selected');
                        }
                    });
                }
            }

            currentPlanData = plan;
            activeDayIndex = 0;
            renderCompleteDietPlan(plan);
        } catch (e) {
            console.error('Error restoring saved diet plan:', e);
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

    // 9. Initial Load Check: Restore saved plan if available after page refresh
    restoreSavedPlanIfAvailable();
});
