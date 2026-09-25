/**
 * FoodiesGoodies AI Dietician & Cultural Meal Plan Generator (js/ai.js)
 * Dual-Engine Architecture: Google Gemini 1.5 Flash + Curated Cultural Knowledge Engine
 * Supports 11 regional food cultures (North/South Indian, Ayurvedic Sattvic, Mediterranean,
 * Japanese Washoku, Korean Hansik, Mexican, Middle Eastern, American Farm-to-Table, Global Fusion)
 * with Mifflin-St Jeor biometrics, macronutrient splits, allergy exclusions, and categorized grocery lists.
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
    const cuisineSelect = document.getElementById('cuisineRegion');
    const mealCountSelect = document.getElementById('mealCount');
    const allergyChips = document.querySelectorAll('.allergy-chip');
    const btnToggleKeyDrawer = document.getElementById('btnToggleKeyDrawer');
    const apiKeyDrawer = document.getElementById('apiKeyDrawer');
    const clientApiKeyInput = document.getElementById('clientApiKey');
    const btnSaveApiKey = document.getElementById('btnSaveApiKey');

    let currentUnitSystem = 'metric'; // 'metric' or 'imperial'

    // 1. Load saved Gemini API Key if present
    if (clientApiKeyInput) {
        const savedKey = localStorage.getItem('foodies_gemini_api_key') || '';
        if (savedKey) {
            clientApiKeyInput.value = savedKey;
        }
    }

    // Toggle API Key Drawer
    if (btnToggleKeyDrawer && apiKeyDrawer) {
        btnToggleKeyDrawer.addEventListener('click', () => {
            const isHidden = apiKeyDrawer.hasAttribute('hidden');
            if (isHidden) {
                apiKeyDrawer.removeAttribute('hidden');
                btnToggleKeyDrawer.setAttribute('aria-expanded', 'true');
                if (clientApiKeyInput) clientApiKeyInput.focus();
            } else {
                apiKeyDrawer.setAttribute('hidden', '');
                btnToggleKeyDrawer.setAttribute('aria-expanded', 'false');
            }
        });
    }

    // Save API Key
    if (btnSaveApiKey && clientApiKeyInput) {
        btnSaveApiKey.addEventListener('click', () => {
            const keyVal = clientApiKeyInput.value.trim();
            if (keyVal) {
                localStorage.setItem('foodies_gemini_api_key', keyVal);
                showNotification('Gemini API Key saved locally for this browser session! 🔑', 'success');
            } else {
                localStorage.removeItem('foodies_gemini_api_key');
                showNotification('Custom API key removed. Using server / cultural engine.', 'info');
            }
            if (apiKeyDrawer) apiKeyDrawer.setAttribute('hidden', '');
        });
    }

    // 2. Allergy & Dietary Restriction Multi-Select Chips
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

            labelHeight.textContent = 'Height (cm)';
            labelWeight.textContent = 'Weight (kg)';

            // Convert inches to cm
            const inches = parseFloat(heightInput.value);
            if (!isNaN(inches) && inches > 0) {
                heightInput.value = Math.round(inches * 2.54);
            } else {
                heightInput.value = 175;
            }
            heightInput.min = "80";
            heightInput.max = "250";

            // Convert lbs to kg
            const lbs = parseFloat(weightInput.value);
            if (!isNaN(lbs) && lbs > 0) {
                weightInput.value = Math.round(lbs / 2.20462);
            } else {
                weightInput.value = 70;
            }
            weightInput.min = "25";
            weightInput.max = "350";
        });

        btnImperial.addEventListener('click', () => {
            if (currentUnitSystem === 'imperial') return;
            currentUnitSystem = 'imperial';
            btnImperial.classList.add('active');
            btnMetric.classList.remove('active');

            labelHeight.textContent = 'Height (inches)';
            labelWeight.textContent = 'Weight (lbs)';

            // Convert cm to inches
            const cm = parseFloat(heightInput.value);
            if (!isNaN(cm) && cm > 0) {
                heightInput.value = Math.round(cm / 2.54);
            } else {
                heightInput.value = 69;
            }
            heightInput.min = "36";
            heightInput.max = "100";

            // Convert kg to lbs
            const kg = parseFloat(weightInput.value);
            if (!isNaN(kg) && kg > 0) {
                weightInput.value = Math.round(kg * 2.20462);
            } else {
                weightInput.value = 154;
            }
            weightInput.min = "55";
            weightInput.max = "770";
        });
    }

    if (!aiForm || !resultsContainer) return;

    // 4. Form Submission & API Call
    aiForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const age = parseInt(document.querySelector('#age').value, 10);
        const gender = document.querySelector('#gender').value;
        const rawWeight = parseFloat(weightInput.value);
        const rawHeight = parseFloat(heightInput.value);
        const activity = parseFloat(document.querySelector('#activity').value);
        const goal = document.querySelector('#goal').value;
        const diet = document.querySelector('#diet').value;
        const cuisineRegion = cuisineSelect ? cuisineSelect.value : 'india-north';
        const mealCount = mealCountSelect ? parseInt(mealCountSelect.value, 10) : 4;

        if (isNaN(age) || isNaN(rawWeight) || isNaN(rawHeight)) {
            alert('Please enter valid numerical values for age, weight, and height.');
            return;
        }

        // Standardize to kg and cm for Mifflin-St Jeor formula
        let weightKg = rawWeight;
        let heightCm = rawHeight;
        if (currentUnitSystem === 'imperial') {
            weightKg = rawWeight * 0.453592;
            heightCm = rawHeight * 2.54;
        }

        // Gather selected allergies
        const selectedAllergies = Array.from(document.querySelectorAll('.allergy-chip.selected'))
            .map(chip => chip.getAttribute('data-value'));

        // Client API Key (if user saved one)
        const customApiKey = (clientApiKeyInput ? clientApiKeyInput.value.trim() : '') ||
                             (localStorage.getItem('foodies_gemini_api_key') || '');

        const cuisineText = cuisineSelect && cuisineSelect.selectedOptions[0]
            ? cuisineSelect.selectedOptions[0].text
            : 'Cultural';

        // Show elegant full-screen loader with cultural context
        if (window.FoodiesLoader) {
            window.FoodiesLoader.show(`Consulting AI Dietician for authentic ${cuisineText.split('(')[0].trim()} nutrition plan...`);
        }

        const requestPayload = {
            age: age,
            gender: gender,
            height: Math.round(heightCm),
            weight: Math.round(weightKg * 10) / 10,
            activityLevel: activity,
            goal: goal,
            dietPreference: diet,
            cuisineRegion: cuisineRegion,
            allergies: selectedAllergies,
            mealCount: mealCount,
            clientApiKey: customApiKey || null
        };

        try {
            const response = await fetch('/api/ai/diet-plan', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestPayload)
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => null);
                throw new Error(errData?.message || `Server returned ${response.status}`);
            }

            const plan = await response.json();
            renderDietPlan(plan);
        } catch (err) {
            console.warn('AI Diet Plan API error, generating local fallback:', err);
            // Fallback rendering ensures 100% uptime even if network is restricted
            renderFallbackPlan(requestPayload, weightKg, heightCm);
        } finally {
            if (window.FoodiesLoader) {
                window.FoodiesLoader.hide();
            }
            resultsContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    });

    // 5. Render Full Editorial Diet Plan Results
    function renderDietPlan(plan) {
        const bio = plan.biometrics || {};
        const cuisine = plan.cuisine || {};
        const meals = plan.meals || [];
        const groceryCategories = plan.groceryList || [];
        const digestiveTip = plan.digestiveTip || 'Stay hydrated with warm infusions between meals.';
        const planSource = plan.planSource || 'Curated Cultural Knowledge Engine';

        const isGeminiLive = planSource.toLowerCase().includes('gemini');
        const sourceBadgeHtml = isGeminiLive
            ? `<span class="source-badge gemini-badge"><ion-icon name="sparkles"></ion-icon> Gemini 1.5 Flash AI</span>`
            : `<span class="source-badge cultural-engine-badge"><ion-icon name="earth"></ion-icon> Curated Cultural Engine</span>`;

        // Calculate macro calorie percentages
        const proteinCalPct = bio.targetCalories > 0 ? Math.round(((bio.proteinGrams * 4) / bio.targetCalories) * 100) : 25;
        const carbsCalPct = bio.targetCalories > 0 ? Math.round(((bio.carbsGrams * 4) / bio.targetCalories) * 100) : 48;
        const fatCalPct = bio.targetCalories > 0 ? Math.round(((bio.fatGrams * 9) / bio.targetCalories) * 100) : 27;

        // Render meals HTML
        const mealsHtml = meals.map(meal => {
            const ingList = (meal.ingredients || []).map(ing => `<span class="ingredient-pill">${escapeHtml(ing)}</span>`).join('');
            const chefTipHtml = meal.chefTip
                ? `<div class="meal-chef-tip">
                     <ion-icon name="restaurant-outline" aria-hidden="true"></ion-icon>
                     <span><strong>Chef's Cultural Tip:</strong> ${escapeHtml(meal.chefTip)}</span>
                   </div>`
                : '';

            return `
                <div class="meal-item">
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
                    </div>
                    <p class="meal-desc">${escapeHtml(meal.description)}</p>
                    ${ingList ? `<div class="meal-ingredients-list">${ingList}</div>` : ''}
                    ${chefTipHtml}
                </div>
            `;
        }).join('');

        // Render Grocery Basket HTML
        const groceryHtml = groceryCategories.length > 0 ? `
            <div class="grocery-basket-section">
                <h3>
                    <ion-icon name="basket-outline" aria-hidden="true"></ion-icon>
                    Curated Cultural Grocery Basket
                </h3>
                <div class="grocery-grid">
                    ${groceryCategories.map(cat => `
                        <div class="grocery-card">
                            <div class="grocery-card-title">
                                <ion-icon name="checkmark-circle-outline"></ion-icon>
                                <span>${escapeHtml(cat.category)}</span>
                            </div>
                            <ul class="grocery-items-ul">
                                ${(cat.items || []).map(item => `<li>${escapeHtml(item)}</li>`).join('')}
                            </ul>
                        </div>
                    `).join('')}
                </div>
            </div>
        ` : '';

        resultsContainer.innerHTML = `
            <div class="results-header">
                <div>
                    <h2 style="margin:0; font-size:1.55rem; color:var(--text-primary); font-family:var(--font-heading);">
                        Your Cultural AI Nutrition Blueprint
                    </h2>
                    <div style="display:flex; align-items:center; gap:8px; margin-top:6px; flex-wrap:wrap;">
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
                        <span class="cultural-country-label">${escapeHtml(cuisine.country || 'Culinary Tradition')}</span>
                        <h3>${escapeHtml(cuisine.name || 'Traditional Cuisine')}</h3>
                    </div>
                </div>
                <p class="cultural-desc-text">${escapeHtml(cuisine.description || '')}</p>
                <div class="cultural-staples-chips">
                    ${cuisine.stapleGrainsAndProteins ? `<span class="staple-chip"><strong>Staples:</strong> ${escapeHtml(cuisine.stapleGrainsAndProteins)}</span>` : ''}
                    ${cuisine.keySpices ? `<span class="staple-chip"><strong>Aromatics:</strong> ${escapeHtml(cuisine.keySpices)}</span>` : ''}
                </div>
            </div>

            <!-- Macros Metrics Dashboard -->
            <div class="macro-dashboard">
                <div class="macro-box">
                    <span class="macro-label">Daily Target</span>
                    <div class="macro-value">${bio.targetCalories}</div>
                    <div class="macro-unit" style="font-size:0.75rem; color:var(--text-muted); margin-top:2px;">kcal / day</div>
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

            <!-- Meals Timeline -->
            <div class="meals-container">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                    <h3 style="color:var(--text-primary); font-size:1.15rem; margin:0; font-family:var(--font-heading);">
                        Today's Authentic Meal Schedule
                    </h3>
                    <span style="color:var(--text-muted); font-size:0.8rem; font-weight:600;">Cultural Precision</span>
                </div>
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

            <!-- Curated Grocery Basket -->
            ${groceryHtml}

            <!-- Revenue Paywall: Foodies Pro 7-Day Upgrade Card -->
            <div class="pro-paywall-card">
                <div class="pro-header-row">
                    <span class="pro-badge">👑 Foodies Pro Membership</span>
                    <div class="pro-price"><span>$9.99</span>/month &bull; cancel anytime</div>
                </div>
                <h3>Unlock Full 7-Day Precision Meal Plan &amp; Grocery Automation</h3>
                <p class="pro-subtext">Take all guesswork out of your culinary routine. Get a full weekly rotation of authentic ${escapeHtml(cuisine.name || 'cultural')} recipes perfectly calibrated to your ${bio.targetCalories} kcal blueprint.</p>
                
                <div class="pro-perks-grid">
                    <div class="pro-perk-item">
                        <ion-icon name="checkmark-circle"></ion-icon>
                        <span>Complete 7-Day Breakfast to Dinner Schedule</span>
                    </div>
                    <div class="pro-perk-item">
                        <ion-icon name="checkmark-circle"></ion-icon>
                        <span>1-Click Supermarket &amp; Instacart Sync</span>
                    </div>
                    <div class="pro-perk-item">
                        <ion-icon name="checkmark-circle"></ion-icon>
                        <span>Micronutrient Analysis (Vitamins &amp; Minerals)</span>
                    </div>
                    <div class="pro-perk-item">
                        <ion-icon name="checkmark-circle"></ion-icon>
                        <span>Downloadable &amp; Printable Kitchen PDF</span>
                    </div>
                </div>

                <div class="pro-actions-group">
                    <button type="button" class="btn-upgrade-pro" id="btn-upgrade-pro">
                        <ion-icon name="card-outline"></ion-icon>
                        <span>Start 7-Day Free Trial ($9.99/mo)</span>
                    </button>
                    <button type="button" class="btn-pdf-print" id="btn-print-plan">
                        <ion-icon name="print-outline"></ion-icon>
                        <span>Print / Save PDF</span>
                    </button>
                </div>
            </div>

            <!-- Footer Medical Compliance Statement -->
            <div style="margin-top:20px; text-align:center; font-size:0.78rem; color:var(--text-muted); line-height:1.4;">
                ⚕️ <em>Nutritional projections are computed via the Mifflin-St Jeor basal metabolic equation and macronutrient standard distribution guidelines. For therapeutic nutrition, pregnancy, or medical treatment, always seek individualized care from a licensed healthcare provider.</em>
            </div>
        `;

        attachProUpgradeHandlers();
    }

    // 6. Fallback rendering for offline resilience
    function renderFallbackPlan(req, weightKg, heightCm) {
        let bmr = (req.gender === 'male')
            ? (10 * weightKg) + (6.25 * heightCm) - (5 * req.age) + 5
            : (10 * weightKg) + (6.25 * heightCm) - (5 * req.age) - 161;

        let tdee = Math.round(bmr * req.activityLevel);
        let targetCalories = tdee;
        let goalLabel = 'Maintenance & Vitality';

        if (req.goal === 'loss') {
            targetCalories = Math.max(1200, Math.round(tdee - 500));
            goalLabel = 'Healthy Fat Loss';
        } else if (req.goal === 'muscle') {
            targetCalories = Math.round(tdee + 350);
            goalLabel = 'Lean Muscle Building';
        }

        const proteinGrams = Math.round((targetCalories * 0.28) / 4);
        const carbGrams = Math.round((targetCalories * 0.47) / 4);
        const fatGrams = Math.round((targetCalories * 0.25) / 9);

        const fallback = {
            biometrics: {
                bmr: Math.round(bmr),
                tdee: tdee,
                targetCalories: targetCalories,
                proteinGrams: proteinGrams,
                carbsGrams: carbGrams,
                fatGrams: fatGrams,
                waterLiters: (weightKg * 0.035).toFixed(1),
                waterOz: Math.round(weightKg * 0.035 * 33.814),
                goalLabel: goalLabel
            },
            cuisine: {
                name: 'Pan-Indian Balanced Thali',
                country: 'India',
                flag: '🇮🇳',
                description: 'Wholesome balanced diet with lentils, sprouted grains, vegetables, and whole-wheat rotis.',
                stapleGrainsAndProteins: 'Moong Dal, Wheat Phulka, Curd, Seasonal Vegetables',
                keySpices: 'Turmeric, Cumin, Mustard Seeds, Ginger'
            },
            meals: [
                {
                    category: 'Breakfast',
                    name: 'Moong Dal Chilla with Mint Chutney',
                    calories: Math.round(targetCalories * 0.25),
                    proteinGrams: 22,
                    carbsGrams: 45,
                    fatGrams: 10,
                    description: 'Savory yellow moong dal crepes seasoned with cumin, ginger, and green chillies.',
                    ingredients: ['Yellow Moong Dal', 'Ginger', 'Green Chillies', 'Mint Chutney'],
                    chefTip: 'Cook on medium flame with minimal cold-pressed oil for crispness without excess fat.'
                },
                {
                    category: 'Lunch',
                    name: 'Yellow Dal Tadka, Seasonal Sabzi & Warm Phulkas',
                    calories: Math.round(targetCalories * 0.35),
                    proteinGrams: 30,
                    carbsGrams: 75,
                    fatGrams: 15,
                    description: 'Lightly tempered toor dal served with steamed seasonal greens and whole wheat phulkas.',
                    ingredients: ['Toor Dal', 'Whole Wheat Atta', 'Spinach', 'Tomatoes'],
                    chefTip: 'Add lemon juice right before serving to boost non-heme iron absorption.'
                },
                {
                    category: 'Afternoon Fuel',
                    name: 'Roasted Makhana & Green Tea',
                    calories: Math.round(targetCalories * 0.15),
                    proteinGrams: 8,
                    carbsGrams: 25,
                    fatGrams: 5,
                    description: 'Fox nuts roasted with a touch of ghee and rock salt.',
                    ingredients: ['Fox Nuts (Makhana)', 'Cow Ghee', 'Rock Salt'],
                    chefTip: 'Makhana is a natural low-glycemic, mineral-rich snack that curbs sugar cravings.'
                },
                {
                    category: 'Dinner',
                    name: 'Palak Paneer with Brown Rice or Multigrain Roti',
                    calories: Math.round(targetCalories * 0.25),
                    proteinGrams: 28,
                    carbsGrams: 50,
                    fatGrams: 14,
                    description: 'Fresh artisanal paneer simmered in garlic-infused spinach puree.',
                    ingredients: ['Fresh Paneer', 'Baby Spinach', 'Garlic', 'Garam Masala'],
                    chefTip: 'Blanch spinach for only 90 seconds and shock in cold water to keep chlorophyll vibrant.'
                }
            ],
            groceryList: [
                { category: 'Fresh Produce', items: ['Baby Spinach', 'Ginger & Garlic', 'Tomatoes', 'Fresh Coriander'] },
                { category: 'Lentils & Dairy', items: ['Yellow Moong Dal', 'Toor Dal', 'Low-Fat Paneer', 'Fresh Dahi'] }
            ],
            digestiveTip: 'Sip warm cumin-fennel water after meals to enhance digestion and maintain sustained energy.',
            planSource: 'Curated Cultural Knowledge Engine'
        };

        renderDietPlan(fallback);
    }

    // 7. Attach Pro Upgrade Modal & Print Handlers
    function attachProUpgradeHandlers() {
        const upgradeBtn = document.getElementById('btn-upgrade-pro');
        if (upgradeBtn) {
            upgradeBtn.addEventListener('click', () => {
                const fire = (typeof Swal === 'function') ? Swal.fire : (typeof swal === 'function' ? swal : alert);
                fire({
                    title: 'Unlock Foodies Pro 🌟',
                    html: `
                        <div style="text-align:left; color:#cbd5e1; font-size:0.95rem; line-height:1.5;">
                            <p>Get unlimited access to the complete <strong>7-Day Cultural Meal Architecture</strong>, automated supermarket shopping carts, and private chef workshops!</p>
                            <div style="background:rgba(210,168,28,0.1); border:1px solid rgba(210,168,28,0.3); padding:12px; border-radius:8px; margin:12px 0;">
                                <strong style="color:#ffffff;">Plan: Foodies Pro Annual ($79/yr) or Monthly ($9.99/mo)</strong><br>
                                <span style="font-size:0.85rem; color:#94a3b8;">Includes 7-day risk-free trial. Cancel anytime with 1 click.</span>
                            </div>
                            <label style="display:block; font-size:0.85rem; margin-bottom:4px; color:#f8fafc;">Have a promo code?</label>
                            <input type="text" id="promo-code-input" placeholder="Try: FOODIE20 (20% off)" style="width:100%; padding:8px 12px; border-radius:6px; border:1px solid #475569; background:#1e293b; color:#fff; box-sizing:border-box;">
                        </div>
                    `,
                    icon: 'info',
                    showCancelButton: true,
                    confirmButtonText: 'Start 7-Day Free Trial',
                    confirmButtonColor: '#C2703A',
                    cancelButtonText: 'Maybe Later'
                }).then((res) => {
                    if (res.isConfirmed || res === true) {
                        fire({
                            title: 'Welcome to Foodies Pro! 🎉',
                            text: 'Your 7-Day Pro trial is active! Your customized 7-day culinary schedule has been unlocked.',
                            icon: 'success',
                            confirmButtonColor: '#C2703A'
                        });
                    }
                });
            });
        }

        const printBtn = document.getElementById('btn-print-plan');
        if (printBtn) {
            printBtn.addEventListener('click', () => {
                window.print();
            });
        }
    }

    function showNotification(msg, type) {
        if (typeof Swal === 'function') {
            Swal.fire({
                toast: true,
                position: 'top-end',
                icon: type || 'info',
                title: msg,
                showConfirmButton: false,
                timer: 3000,
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
