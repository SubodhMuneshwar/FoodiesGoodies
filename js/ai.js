/**
 * FoodiesGoodies AI Dietician & Meal Plan Generator
 * Calculates BMR, TDEE, macronutrient distribution, and generates tailored meal plans.
 */

document.addEventListener('DOMContentLoaded', () => {
    const aiForm = document.querySelector('#aiDieticianForm');
    const resultsContainer = document.querySelector('#aiResults');

    if (!aiForm || !resultsContainer) return;

    aiForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const age = parseInt(document.querySelector('#age').value, 10);
        const gender = document.querySelector('#gender').value;
        const weight = parseFloat(document.querySelector('#weight').value);
        const height = parseFloat(document.querySelector('#height').value);
        const activity = parseFloat(document.querySelector('#activity').value);
        const goal = document.querySelector('#goal').value;
        const diet = document.querySelector('#diet').value;

        if (isNaN(age) || isNaN(weight) || isNaN(height)) {
            alert('Please enter valid numerical values for age, weight, and height.');
            return;
        }

        // Calculate BMR using Mifflin-St Jeor
        let bmr = 0;
        if (gender === 'male') {
            bmr = (10 * weight) + (6.25 * height) - (5 * age) + 5;
        } else if (gender === 'female') {
            bmr = (10 * weight) + (6.25 * height) - (5 * age) - 161;
        } else {
            bmr = (10 * weight) + (6.25 * height) - (5 * age) - 78;
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
        const waterLiters = (weight * 0.035).toFixed(1);

        // Meal suggestions library
        const mealPlans = getMealSuggestions(diet, goal);

        // Render Results
        resultsContainer.innerHTML = `
            <div class="results-header">
                <h2>Your Personalized AI Nutrition Blueprint</h2>
                <span class="goal-tag">${goalLabel}</span>
            </div>

            <!-- Macros Metrics Dashboard -->
            <div class="macro-dashboard">
                <div class="macro-box">
                    <div class="macro-label">Daily Calories</div>
                    <div class="macro-val">${targetCalories}</div>
                    <div class="macro-unit">kcal / day</div>
                </div>
                <div class="macro-box">
                    <div class="macro-label">Protein</div>
                    <div class="macro-val">${proteinGrams}g</div>
                    <div class="macro-unit">${Math.round(proteinRatio * 100)}% energy</div>
                </div>
                <div class="macro-box">
                    <div class="macro-label">Carbohydrates</div>
                    <div class="macro-val">${carbGrams}g</div>
                    <div class="macro-unit">${Math.round(carbRatio * 100)}% energy</div>
                </div>
                <div class="macro-box">
                    <div class="macro-label">Healthy Fats</div>
                    <div class="macro-val">${fatGrams}g</div>
                    <div class="macro-unit">${Math.round(fatRatio * 100)}% energy</div>
                </div>
            </div>

            <!-- Meals Timeline -->
            <div class="meals-container">
                <div class="meal-item">
                    <h4><span>🌅 Breakfast</span> <span class="meal-cals">~${Math.round(targetCalories * 0.25)} kcal</span></h4>
                    <p>${mealPlans.breakfast}</p>
                </div>
                <div class="meal-item">
                    <h4><span>☀️ Lunch</span> <span class="meal-cals">~${Math.round(targetCalories * 0.35)} kcal</span></h4>
                    <p>${mealPlans.lunch}</p>
                </div>
                <div class="meal-item">
                    <h4><span>🍎 Afternoon Fuel</span> <span class="meal-cals">~${Math.round(targetCalories * 0.15)} kcal</span></h4>
                    <p>${mealPlans.snack}</p>
                </div>
                <div class="meal-item">
                    <h4><span>🌙 Dinner</span> <span class="meal-cals">~${Math.round(targetCalories * 0.25)} kcal</span></h4>
                    <p>${mealPlans.dinner}</p>
                </div>
            </div>

            <!-- AI Dietician Insights -->
            <div class="dietician-tips-box">
                <ion-icon name="sparkles" aria-hidden="true"></ion-icon>
                <p>
                    <strong>Dietician Recommendation:</strong> Maintain an optimal hydration of at least <strong>${waterLiters} Liters</strong> of water daily. Pair nutrient-dense whole foods with your favorite Foodies Goodies dishes to keep your metabolism energized and balanced.
                </p>
            </div>
        `;

        resultsContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
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
