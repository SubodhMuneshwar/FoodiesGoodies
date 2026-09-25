/**
 * FoodiesGoodies AI Dietician & Meal Plan Generator (js/ai.js)
 * Calculates BMR (Mifflin-St Jeor), TDEE, macronutrient distribution,
 * provides metric/imperial conversion, 7-Day Foodies Pro paywall card,
 * printable PDF blueprint, and medical compliance disclosures.
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

    let currentUnitSystem = 'metric'; // 'metric' or 'imperial'

    // 1. Metric / Imperial Unit Switcher
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

    // 2. Form Submission & Calculation
    aiForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const age = parseInt(document.querySelector('#age').value, 10);
        const gender = document.querySelector('#gender').value;
        let rawWeight = parseFloat(weightInput.value);
        let rawHeight = parseFloat(heightInput.value);
        const activity = parseFloat(document.querySelector('#activity').value);
        const goal = document.querySelector('#goal').value;
        const diet = document.querySelector('#diet').value;

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

        // Calculate BMR using Mifflin-St Jeor
        let bmr = 0;
        if (gender === 'male') {
            bmr = (10 * weightKg) + (6.25 * heightCm) - (5 * age) + 5;
        } else if (gender === 'female') {
            bmr = (10 * weightKg) + (6.25 * heightCm) - (5 * age) - 161;
        } else {
            bmr = (10 * weightKg) + (6.25 * heightCm) - (5 * age) - 78;
        }

        // Calculate TDEE
        const tdee = Math.round(bmr * activity);

        // Adjust for Goal
        let targetCalories = tdee;
        let goalLabel = 'Maintenance & Vitality';

        if (goal === 'loss') {
            targetCalories = Math.max(1200, Math.round(tdee - 500));
            goalLabel = 'Healthy Fat Loss';
        } else if (goal === 'muscle') {
            targetCalories = Math.round(tdee + 350);
            goalLabel = 'Lean Muscle Building';
        } else if (goal === 'energy') {
            targetCalories = Math.round(tdee + 150);
            goalLabel = 'High Performance & Energy';
        }

        // Calculate Macros based on Diet & Goal
        let proteinRatio = 0.28;
        let carbRatio = 0.47;
        let fatRatio = 0.25;

        if (diet === 'keto') {
            proteinRatio = 0.25;
            carbRatio = 0.08;
            fatRatio = 0.67;
        } else if (goal === 'muscle') {
            proteinRatio = 0.35;
            carbRatio = 0.45;
            fatRatio = 0.20;
        } else if (diet === 'vegan' || diet === 'vegetarian') {
            proteinRatio = 0.24;
            carbRatio = 0.52;
            fatRatio = 0.24;
        }

        const proteinGrams = Math.round((targetCalories * proteinRatio) / 4);
        const carbGrams = Math.round((targetCalories * carbRatio) / 4);
        const fatGrams = Math.round((targetCalories * fatRatio) / 9);
        const waterLiters = (weightKg * 0.035).toFixed(1);
        const waterOz = Math.round(weightKg * 0.035 * 33.814);

        // Meal suggestions library
        const mealPlans = getMealSuggestions(diet, goal);

        if (window.FoodiesLoader) {
            window.FoodiesLoader.show('Analyzing metabolic blueprint & crafting nutrition plan...');
        }

        setTimeout(() => {
            // Render Results
            resultsContainer.innerHTML = `
            <div class="results-header">
                <h2 style="margin:0; font-size:1.6rem; color:var(--text-primary);">Your AI Nutrition Blueprint</h2>
                <span class="goal-tag">${goalLabel}</span>
            </div>

            <!-- Macros Metrics Dashboard -->
            <div class="macro-dashboard">
                <div class="macro-box">
                    <div class="macro-label">Daily Calories</div>
                    <div class="macro-value">${targetCalories}</div>
                    <div class="macro-unit" style="font-size:0.75rem; color:var(--text-muted); margin-top:2px;">kcal / day</div>
                </div>
                <div class="macro-box">
                    <div class="macro-label">Protein</div>
                    <div class="macro-value">${proteinGrams}g</div>
                    <div class="macro-unit" style="font-size:0.75rem; color:var(--text-muted); margin-top:2px;">${Math.round(proteinRatio * 100)}% energy</div>
                </div>
                <div class="macro-box">
                    <div class="macro-label">Carbohydrates</div>
                    <div class="macro-value">${carbGrams}g</div>
                    <div class="macro-unit" style="font-size:0.75rem; color:var(--text-muted); margin-top:2px;">${Math.round(carbRatio * 100)}% energy</div>
                </div>
                <div class="macro-box">
                    <div class="macro-label">Healthy Fats</div>
                    <div class="macro-value">${fatGrams}g</div>
                    <div class="macro-unit" style="font-size:0.75rem; color:var(--text-muted); margin-top:2px;">${Math.round(fatRatio * 100)}% energy</div>
                </div>
            </div>

            <!-- Meals Timeline (Day 1 Sample) -->
            <div class="meals-container">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                    <h3 style="color:var(--text-primary); font-size:1.15rem; margin:0; font-family:var(--font-heading);">Today's Curated Meals</h3>
                    <span style="color:var(--text-muted); font-size:0.85rem; font-weight:600;">Personalized Preview</span>
                </div>
                <div class="meal-item">
                    <h4><span>Breakfast</span> <span class="meal-cals">~${Math.round(targetCalories * 0.25)} kcal</span></h4>
                    <p>${mealPlans.breakfast}</p>
                </div>
                <div class="meal-item">
                    <h4><span>Lunch</span> <span class="meal-cals">~${Math.round(targetCalories * 0.35)} kcal</span></h4>
                    <p>${mealPlans.lunch}</p>
                </div>
                <div class="meal-item">
                    <h4><span>Afternoon Fuel</span> <span class="meal-cals">~${Math.round(targetCalories * 0.15)} kcal</span></h4>
                    <p>${mealPlans.snack}</p>
                </div>
                <div class="meal-item">
                    <h4><span>Dinner</span> <span class="meal-cals">~${Math.round(targetCalories * 0.25)} kcal</span></h4>
                    <p>${mealPlans.dinner}</p>
                </div>
            </div>

            <!-- AI Dietician Insights -->
            <div class="dietician-tips-box">
                <ion-icon name="sparkles" aria-hidden="true"></ion-icon>
                <p>
                    <strong>Dietician Hydration Target:</strong> Maintain hydration of at least <strong>${waterLiters} Liters (${waterOz} fl oz)</strong> of water daily. Pair these whole ingredients with your favorite Foodies Goodies recipes to maintain balanced metabolic vitality.
                </p>
            </div>

            <!-- Revenue Paywall: Foodies Pro 7-Day Upgrade Card -->
            <div class="pro-paywall-card">
                <div class="pro-header-row">
                    <span class="pro-badge">👑 Foodies Pro Membership</span>
                    <div class="pro-price"><span>$9.99</span>/month &bull; cancel anytime</div>
                </div>
                <h3>Unlock Full 7-Day Precision Meal Plan &amp; Grocery Automation</h3>
                <p class="pro-subtext">Take all guesswork out of your culinary routine. Get a full weekly rotation of delicious chef-crafted recipes perfectly balanced to your ${targetCalories} kcal blueprint.</p>
                
                <div class="pro-perks-grid">
                    <div class="pro-perk-item">
                        <ion-icon name="checkmark-circle"></ion-icon>
                        <span>Complete 7-Day Breakfast to Dinner Schedule</span>
                    </div>
                    <div class="pro-perk-item">
                        <ion-icon name="checkmark-circle"></ion-icon>
                        <span>1-Click Instacart Supermarket Cart Sync</span>
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

        // 3. Attach Pro Upgrade Modal Handler
        const upgradeBtn = document.getElementById('btn-upgrade-pro');
        if (upgradeBtn) {
            upgradeBtn.addEventListener('click', () => {
                const fire = (typeof Swal === 'function') ? Swal.fire : (typeof swal === 'function' ? swal : alert);
                fire({
                    title: 'Unlock Foodies Pro 🌟',
                    html: `
                        <div style="text-align:left; color:#cbd5e1; font-size:0.95rem; line-height:1.5;">
                            <p>Get unlimited access to the complete <strong>7-Day Meal Architecture</strong>, automated supermarket shopping carts, and private chef workshops!</p>
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
                    confirmButtonColor: '#f59e0b',
                    cancelButtonText: 'Maybe Later'
                }).then((res) => {
                    if (res.isConfirmed || res === true) {
                        fire({
                            title: 'Welcome to Foodies Pro! 🎉',
                            text: 'Your 7-Day Pro trial is active! Your customized 7-day culinary schedule has been unlocked.',
                            icon: 'success'
                        });
                    }
                });
            });
        }

        // 4. Attach Print / PDF Export Handler
        const printBtn = document.getElementById('btn-print-plan');
        if (printBtn) {
            printBtn.addEventListener('click', () => {
                window.print();
            });
        }

            if (window.FoodiesLoader) {
                window.FoodiesLoader.hide();
            }
            resultsContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 550);
    });

    function getMealSuggestions(diet, goal) {
        if (diet === 'keto') {
            return {
                breakfast: 'Scrambled pasture-raised eggs with baby spinach, sliced avocado, and feta cheese drizzled with cold-pressed olive oil.',
                lunch: 'Crispy herb-crusted chicken or baked paneer salad with mixed greens, walnuts, cucumber ribbons, and creamy garlic dressing.',
                snack: 'A handful of roasted macadamia nuts and celery sticks with almond butter.',
                dinner: 'Grilled salmon fillet or spiced tofu steaks served alongside roasted garlic asparagus and cauliflower mash.'
            };
        }

        if (diet === 'vegan') {
            return {
                breakfast: 'Chia seed pudding with unsweetened almond milk, ripe blueberries, hemp hearts, and a dash of Ceylon cinnamon.',
                lunch: 'Mediterranean warm quinoa power bowl with roasted chickpeas, kalamata olives, cherry tomatoes, and tahini lemon dressing.',
                snack: 'Fresh apple slices paired with organic peanut butter and pumpkin seeds.',
                dinner: 'Creamy coconut lentil curry with steamed turmeric cauliflower rice and tender baby spinach.'
            };
        }

        if (diet === 'vegetarian') {
            return {
                breakfast: 'Toasted sourdough with crushed avocado, a soft-boiled farm egg or grilled paneer slice, and crushed red pepper flakes.',
                lunch: 'Hearty Greek salad with aged feta, crisp cucumbers, bell peppers, quinoa, and warm herbed flatbread.',
                snack: 'Greek yogurt topped with organic honey, chia seeds, and fresh strawberries.',
                dinner: 'Spinach and ricotta stuffed bell peppers with roasted sweet potato wedges and garden salad.'
            };
        }

        // Default Omnivore / Balanced
        return {
            breakfast: 'Overnight rolled oats with Greek yogurt, wild berries, raw honey, and sliced almonds.',
            lunch: 'Grilled lemon-herb chicken breast or baked salmon with brown basmati rice, steamed broccoli, and avocado.',
            snack: 'Fresh seasonal fruit with a small handful of raw walnuts and dark chocolate (85%).',
            dinner: 'Lean herb-seared turkey or flank steak with roasted rosemary potatoes and a vibrant arugula parmesan salad.'
        };
    }
});
