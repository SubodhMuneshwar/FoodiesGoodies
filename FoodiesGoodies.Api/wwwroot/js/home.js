/**
 * FoodiesGoodies Homepage Dynamic Interactions & UI/UX Engine
 * - Interactive quick search pills with instant form submission
 * - Animated statistical counter ticker
 * - 3D dynamic card perspective tilt for signature spotlight
 * - Interactive favorite/bookmark system with localStorage sync
 * - Interactive Recipe Quick-View modal with interactive ingredient checklist
 * - Interactive AI Dietician macro calculation simulator
 * - Animated trending recipe filter tabs
 * - Newsletter submission feedback
 */

document.addEventListener('DOMContentLoaded', () => {
    // -------------------------------------------------------------------------
    // 1. Interactive Hero Quick Search Pills
    // -------------------------------------------------------------------------
    const heroSearchForm = document.querySelector('.hero-search-form');
    const heroSearchInput = document.querySelector('#home-search-input');
    const heroTagButtons = document.querySelectorAll('.hero-tag-btn');

    if (heroTagButtons && heroSearchInput && heroSearchForm) {
        heroTagButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const query = btn.getAttribute('data-query') || btn.textContent.replace(/^[^\w]+/, '').trim();
                heroSearchInput.value = query;
                
                // Add click ripple / active effect
                btn.style.transform = 'scale(0.95)';
                setTimeout(() => {
                    btn.style.transform = '';
                    heroSearchForm.submit();
                }, 150);
            });
        });
    }

    // 1.1 Responsive Search Placeholder Adaptation
    function syncHeroSearchPlaceholder() {
        if (!heroSearchInput) return;
        if (window.innerWidth <= 400) {
            heroSearchInput.placeholder = "Search recipes...";
        } else if (window.innerWidth <= 640) {
            heroSearchInput.placeholder = "Search recipes or ingredients...";
        } else {
            heroSearchInput.placeholder = "Search by dish, ingredient, or cuisine...";
        }
    }
    syncHeroSearchPlaceholder();
    window.addEventListener('resize', syncHeroSearchPlaceholder, { passive: true });

    // -------------------------------------------------------------------------
    // 2. Animated Statistical Counter Ticker
    // -------------------------------------------------------------------------
    const statNumbers = document.querySelectorAll('.hero-stat-item .stat-number');
    if (statNumbers.length > 0 && 'IntersectionObserver' in window) {
        const counterObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const el = entry.target;
                    const target = parseInt(el.getAttribute('data-target') || '0', 10);
                    const suffix = el.getAttribute('data-suffix') || '';
                    if (target > 0) {
                        animateCounter(el, target, suffix);
                    }
                    observer.unobserve(el);
                }
            });
        }, { threshold: 0.5 });

        statNumbers.forEach(num => counterObserver.observe(num));
    }

    function animateCounter(el, target, suffix) {
        const duration = 1800;
        const start = 0;
        const startTime = performance.now();

        function update(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            // Ease out cubic
            const ease = 1 - Math.pow(1 - progress, 3);
            const currentVal = Math.floor(start + (target - start) * ease);

            if (target >= 1000000) {
                el.textContent = (currentVal / 1000000).toFixed(1) + 'M' + suffix;
            } else if (target >= 1000) {
                el.textContent = Math.floor(currentVal / 1000) + 'K' + suffix;
            } else {
                el.textContent = currentVal + suffix;
            }

            if (progress < 1) {
                requestAnimationFrame(update);
            } else {
                if (target >= 1000000) {
                    el.textContent = (target / 1000000).toFixed(1) + 'M' + suffix;
                } else if (target >= 1000) {
                    el.textContent = (target / 1000) + 'K' + suffix;
                } else {
                    el.textContent = target + suffix;
                }
            }
        }

        requestAnimationFrame(update);
    }

    // -------------------------------------------------------------------------
    // 3. 3D Perspective Tilt on Spotlight Card
    // -------------------------------------------------------------------------
    const spotlightCard = document.querySelector('.spotlight-card');
    if (spotlightCard && window.matchMedia('(hover: hover)').matches) {
        spotlightCard.addEventListener('mousemove', (e) => {
            const rect = spotlightCard.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const centerX = rect.width / 2;
            const centerY = rect.height / 2;

            const rotateX = ((y - centerY) / centerY) * -4; // Max 4 deg tilt
            const rotateY = ((x - centerX) / centerX) * 4;

            spotlightCard.style.transform = `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateY(-2px)`;
        });

        spotlightCard.addEventListener('mouseleave', () => {
            spotlightCard.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0)';
        });
    }

    // -------------------------------------------------------------------------
    // 4. Interactive Favorite / Bookmark System
    // -------------------------------------------------------------------------
    function getFavorites() {
        try {
            return JSON.parse(localStorage.getItem('foodies_saved_recipes') || '[]');
        } catch {
            return [];
        }
    }

    function saveFavorites(favs) {
        localStorage.setItem('foodies_saved_recipes', JSON.stringify(favs));
    }

    function updateFavButtonState(btn, isFav) {
        if (isFav) {
            btn.classList.add('active');
            btn.setAttribute('aria-label', 'Remove from favorites');
            btn.setAttribute('title', 'Saved in favorites');
        } else {
            btn.classList.remove('active');
            btn.setAttribute('aria-label', 'Save to favorites');
            btn.setAttribute('title', 'Save to favorites');
        }
    }

    // Initialize all favorite buttons
    const savedFavorites = getFavorites();
    const favButtons = document.querySelectorAll('.btn-favorite-heart');

    favButtons.forEach(btn => {
        const recipeId = btn.getAttribute('data-recipe-id') || 'recipe';
        const isFav = savedFavorites.includes(recipeId);
        updateFavButtonState(btn, isFav);

        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();

            const current = getFavorites();
            const exists = current.includes(recipeId);
            let updated;

            if (exists) {
                updated = current.filter(id => id !== recipeId);
                updateFavButtonState(btn, false);
                if (window.Toast) {
                    window.Toast.show('info', 'Recipe removed from your favorites.');
                }
            } else {
                updated = [...current, recipeId];
                updateFavButtonState(btn, true);
                
                // Add pop animation
                btn.classList.add('pop-anim');
                setTimeout(() => btn.classList.remove('pop-anim'), 400);

                if (window.Toast) {
                    window.Toast.show('success', 'Recipe saved to your favorites collection!');
                }
            }

            saveFavorites(updated);
        });
    });

    // -------------------------------------------------------------------------
    // 5. Trending Recipes Tab Filtering
    // -------------------------------------------------------------------------
    const tabButtons = document.querySelectorAll('.filter-tab-btn');
    const recipeCards = document.querySelectorAll('.trending-recipe-card');

    if (tabButtons.length > 0 && recipeCards.length > 0) {
        tabButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                tabButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                const filter = btn.getAttribute('data-filter') || 'all';

                recipeCards.forEach((card, index) => {
                    const categories = (card.getAttribute('data-category') || '').split(' ');
                    if (filter === 'all' || categories.includes(filter)) {
                        card.style.display = 'flex';
                        card.style.opacity = '0';
                        card.style.transform = 'translateY(16px)';
                        
                        setTimeout(() => {
                            card.style.transition = 'opacity 0.35s ease, transform 0.35s ease';
                            card.style.opacity = '1';
                            card.style.transform = 'translateY(0)';
                        }, index * 40);
                    } else {
                        card.style.display = 'none';
                    }
                });
            });
        });
    }

    // -------------------------------------------------------------------------
    // 6. Interactive Recipe Quick-View Modal Engine
    // -------------------------------------------------------------------------
    const quickViewButtons = document.querySelectorAll('.btn-card-quickview');
    const modalBackdrop = document.getElementById('recipe-quickview-modal');
    const modalCloseBtn = document.getElementById('quickview-close-btn');

    const modalTitle = document.getElementById('quickview-title');
    const modalImage = document.getElementById('quickview-image');
    const modalCuisine = document.getElementById('quickview-cuisine');
    const modalTime = document.getElementById('quickview-time');
    const modalCalories = document.getElementById('quickview-calories');
    const modalDesc = document.getElementById('quickview-desc');
    const modalIngredientsList = document.getElementById('quickview-ingredients');
    const modalCookBtn = document.getElementById('quickview-cook-btn');

    if (quickViewButtons && modalBackdrop) {
        quickViewButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();

                const card = btn.closest('.trending-recipe-card');
                if (!card) return;

                const title = card.getAttribute('data-title') || card.querySelector('.trending-card-title')?.textContent || 'Recipe';
                const image = card.getAttribute('data-image') || card.querySelector('img')?.src || '';
                const cuisine = card.getAttribute('data-cuisine') || card.querySelector('.trending-cuisine-badge')?.textContent || 'Gourmet';
                const time = card.getAttribute('data-time') || '25 mins';
                const calories = card.getAttribute('data-calories') || '450 kcal';
                const desc = card.getAttribute('data-desc') || card.querySelector('.trending-desc')?.textContent || '';
                const ingredients = (card.getAttribute('data-ingredients') || '').split('|').filter(Boolean);
                const cookUrl = card.getAttribute('data-cook-url') || `pages/search.html?q=${encodeURIComponent(title)}`;

                if (modalTitle) modalTitle.textContent = title;
                if (modalImage) modalImage.src = image;
                if (modalCuisine) modalCuisine.textContent = cuisine;
                if (modalTime) modalTime.textContent = time;
                if (modalCalories) modalCalories.textContent = calories;
                if (modalDesc) modalDesc.textContent = desc;
                if (modalCookBtn) modalCookBtn.href = cookUrl;

                if (modalIngredientsList) {
                    modalIngredientsList.innerHTML = '';
                    ingredients.forEach((ing, i) => {
                        const li = document.createElement('li');
                        li.className = 'quickview-ing-item';
                        li.innerHTML = `
                            <label class="ing-checkbox-label">
                                <input type="checkbox" id="ing-${i}">
                                <span class="checkmark"></span>
                                <span class="ing-text">${ing.trim()}</span>
                            </label>
                        `;
                        modalIngredientsList.appendChild(li);
                    });
                }

                // Open modal
                modalBackdrop.classList.add('active');
                document.body.style.overflow = 'hidden';
            });
        });

        const closeModal = () => {
            modalBackdrop.classList.remove('active');
            document.body.style.overflow = '';
        };

        if (modalCloseBtn) {
            modalCloseBtn.addEventListener('click', closeModal);
        }

        modalBackdrop.addEventListener('click', (e) => {
            if (e.target === modalBackdrop) {
                closeModal();
            }
        });

        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modalBackdrop.classList.contains('active')) {
                closeModal();
            }
        });
    }

    // -------------------------------------------------------------------------
    // 7. Interactive AI Dietician Macro Simulator
    // -------------------------------------------------------------------------
    const simGoalButtons = document.querySelectorAll('.sim-goal-btn');
    const simCalorieSlider = document.getElementById('sim-calorie-slider');
    const simCalorieValue = document.getElementById('sim-calorie-val');
    const simProteinVal = document.getElementById('sim-protein-val');
    const simCarbsVal = document.getElementById('sim-carbs-val');
    const simFatsVal = document.getElementById('sim-fats-val');
    const simBarProtein = document.getElementById('sim-bar-protein');
    const simBarCarbs = document.getElementById('sim-bar-carbs');
    const simBarFats = document.getElementById('sim-bar-fats');
    const simLaunchBtn = document.getElementById('sim-launch-btn');

    let currentGoal = 'maintenance'; // 'fat-loss', 'maintenance', 'muscle'

    const goalSplits = {
        'fat-loss': { protein: 0.35, carbs: 0.35, fats: 0.30, label: 'Fat Loss & Tone' },
        'maintenance': { protein: 0.25, carbs: 0.50, fats: 0.25, label: 'Balanced Wellness' },
        'muscle': { protein: 0.30, carbs: 0.50, fats: 0.20, label: 'Muscle Building' }
    };

    function updateMacroSimulation() {
        if (!simCalorieSlider) return;

        const calories = parseInt(simCalorieSlider.value, 10);
        if (simCalorieValue) simCalorieValue.textContent = `${calories.toLocaleString()} kcal`;

        const split = goalSplits[currentGoal] || goalSplits['maintenance'];

        // Protein: 4 kcal/g, Carbs: 4 kcal/g, Fat: 9 kcal/g
        const proteinGrams = Math.round((calories * split.protein) / 4);
        const carbsGrams = Math.round((calories * split.carbs) / 4);
        const fatsGrams = Math.round((calories * split.fats) / 9);

        if (simProteinVal) simProteinVal.textContent = `${proteinGrams}g`;
        if (simCarbsVal) simCarbsVal.textContent = `${carbsGrams}g`;
        if (simFatsVal) simFatsVal.textContent = `${fatsGrams}g`;

        const proteinPct = Math.round(split.protein * 100);
        const carbsPct = Math.round(split.carbs * 100);
        const fatsPct = Math.round(split.fats * 100);

        if (simBarProtein) simBarProtein.style.width = `${proteinPct}%`;
        if (simBarCarbs) simBarCarbs.style.width = `${carbsPct}%`;
        if (simBarFats) simBarFats.style.width = `${fatsPct}%`;

        if (simLaunchBtn) {
            simLaunchBtn.href = `pages/ai.html?goal=${encodeURIComponent(currentGoal)}&calories=${calories}`;
        }
    }

    if (simGoalButtons && simCalorieSlider) {
        simGoalButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                simGoalButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                currentGoal = btn.getAttribute('data-goal') || 'maintenance';
                updateMacroSimulation();
            });
        });

        simCalorieSlider.addEventListener('input', updateMacroSimulation);
        updateMacroSimulation(); // initial compute
    }

    // -------------------------------------------------------------------------
    // 8. Newsletter Form Submission
    // -------------------------------------------------------------------------
    const newsletterForm = document.querySelector('#newsletter-form');
    const newsletterEmail = document.querySelector('#newsletter-email');
    const newsletterStatus = document.querySelector('#newsletter-status');

    if (newsletterForm && newsletterEmail && newsletterStatus) {
        newsletterForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = newsletterEmail.value.trim();

            if (!email || !email.includes('@')) {
                newsletterStatus.className = 'newsletter-msg error';
                newsletterStatus.textContent = 'Please enter a valid email address.';
                return;
            }

            const submitBtn = newsletterForm.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = 'Subscribing...';
            }

            // Local intent storage
            localStorage.setItem('foodies_newsletter_subscribed', 'true');
            newsletterStatus.className = 'newsletter-msg success';
            newsletterStatus.textContent = 'Welcome to the Foodies Goodies Sunday Digest! Check your inbox soon.';
            newsletterEmail.value = '';

            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Subscribe Free';
            }
        });
    }
});
