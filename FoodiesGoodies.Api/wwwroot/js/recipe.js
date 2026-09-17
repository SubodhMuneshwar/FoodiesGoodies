/**
 * FoodiesGoodies Single Recipe Controller (js/recipe.js)
 * Manages ingredients checklist, dynamic serving scaler, allergen profiling,
 * Instacart affiliate ordering, step timers, star rating, flavor notes comments, and sharing.
 */

document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const rawId = urlParams.get('id');
    const lookupParam = rawId ? encodeURIComponent(rawId) : 'featured';

    let currentRecipe = null;

    // Recipe detail: load from localStorage community recipes (local-demo).
    // No backend recipe-detail endpoint exists; api/recipes.php was a search proxy only.
    const stored = JSON.parse(localStorage.getItem('foodies_community_recipes') || '[]');
    if (rawId) {
        currentRecipe = stored.find(r => String(r.id) === String(rawId));
    }
    if (!currentRecipe && stored.length > 0) {
        currentRecipe = stored[0];
    }

    // Fallback gourmet recipe template if entirely empty
    if (!currentRecipe) {
        currentRecipe = {
            id: 1,
            title: 'Wood-Fired Truffle Margherita',
            cuisine_type: 'Italian',
            category: 'Italian',
            username: 'Chef Gabriella Russo',
            authorName: 'Chef Gabriella Russo',
            authorHandle: '@gabriella_russo',
            authorAvatar: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?auto=format&fit=crop&w=300&q=80',
            image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=800&q=80',
            cook_time: 25,
            cookTime: '25 mins',
            difficulty: 'Medium',
            servings: 3,
            rating_avg: 4.95,
            likes_count: 124,
            description: 'Crispy wood-fired crust crowned with crushed San Marzano tomatoes, fresh buffalo mozzarella, aromatic sweet basil, and a drizzle of white truffle oil.',
            ingredients: [
                '500g 00 Flour',
                '320ml Warm Water',
                '7g Active Dry Yeast',
                '200g Fresh Buffalo Mozzarella',
                '1 cup San Marzano Tomato Sauce',
                '1 tbsp White Truffle Oil',
                'Fresh Sweet Basil Leaves'
            ],
            steps: [
                'Mix flour, yeast, and warm water; knead for 10 minutes until supple and smooth.',
                'Allow dough to rise at room temperature for 2 hours until doubled in volume.',
                'Hand-stretch into a 12-inch circle on semolina-dusted parchment paper.',
                'Ladle San Marzano sauce and distribute fresh buffalo mozzarella slices.',
                'Bake in a preheated 500°F (260°C) oven with a pizza stone for 8-10 mins until blistered and charred.',
                'Garnish with sweet basil leaves and drizzle white truffle oil immediately.'
            ]
        };
    }

    renderRecipePage(currentRecipe);

    function renderRecipePage(r) {
        // Update Title & Meta
        document.title = `${r.title} - Foodies Goodies`;
        const titleEl = document.getElementById('recipe-title');
        if (titleEl) titleEl.textContent = r.title;

        const imgEl = document.getElementById('recipe-hero-image');
        if (imgEl) imgEl.src = r.image || r.image_path || 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=800&q=80';

        const descEl = document.getElementById('recipe-description');
        if (descEl) descEl.textContent = r.description;

        const cuisineEl = document.getElementById('recipe-cuisine-badge');
        if (cuisineEl) cuisineEl.textContent = `${r.cuisine_type || r.category || 'Gourmet'} • Dinner`;

        const timeEl = document.getElementById('recipe-cook-time');
        if (timeEl) timeEl.textContent = r.cook_time ? `${r.cook_time} mins` : (r.cookTime || '25 mins');

        const diffEl = document.getElementById('recipe-difficulty');
        if (diffEl) diffEl.textContent = r.difficulty || 'Medium';

        const authorNameEl = document.getElementById('author-name');
        if (authorNameEl) authorNameEl.textContent = r.authorName || r.username || 'Chef Foodie';

        const authorHandleEl = document.getElementById('author-handle');
        if (authorHandleEl) authorHandleEl.textContent = r.authorHandle || ('@' + (r.username || 'chef').toLowerCase().replace(/[^a-z0-9_]/g, ''));

        const authorAvatarEl = document.getElementById('author-avatar');
        if (authorAvatarEl) authorAvatarEl.src = r.authorAvatar || r.profile_pic || 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?auto=format&fit=crop&w=150&q=80';

        const tasteCountEl = document.getElementById('taste-count');
        if (tasteCountEl) tasteCountEl.textContent = r.likes_count || r.likesCount || 0;

        // 1. Serving Scaler Logic
        const baseServings = parseInt(r.servings, 10) || 3;
        let currentServings = baseServings;
        const servingsEl = document.getElementById('recipe-servings');
        const scalerCountEl = document.getElementById('scaler-servings-count');
        const btnDec = document.getElementById('btn-scaler-dec');
        const btnInc = document.getElementById('btn-scaler-inc');

        function updateServingsDisplay() {
            if (servingsEl) servingsEl.textContent = `${currentServings} portions`;
            if (scalerCountEl) scalerCountEl.textContent = currentServings;
            renderIngredients(currentServings / baseServings);
        }

        if (btnDec) {
            btnDec.addEventListener('click', () => {
                if (currentServings > 1) {
                    currentServings -= 1;
                    updateServingsDisplay();
                }
            });
        }

        if (btnInc) {
            btnInc.addEventListener('click', () => {
                if (currentServings < 24) {
                    currentServings += 1;
                    updateServingsDisplay();
                }
            });
        }

        // Helper to scale numeric quantities inside ingredient string
        function scaleIngredientText(rawText, ratio) {
            if (ratio === 1) return rawText;

            // Matches leading quantities like: 500g, 320ml, 1 cup, 1/2 tsp, 2.5 tbsp
            return rawText.replace(/^(\d+\.?\d*|\d+\/\d+)\s*([a-zA-Z]*)/, (match, qtyStr, unit) => {
                let qty = 0;
                if (qtyStr.includes('/')) {
                    const parts = qtyStr.split('/');
                    qty = parseFloat(parts[0]) / parseFloat(parts[1]);
                } else {
                    qty = parseFloat(qtyStr);
                }

                if (isNaN(qty)) return match;

                const scaled = qty * ratio;
                let formatted = scaled >= 10 ? Math.round(scaled) : parseFloat(scaled.toFixed(1));
                return unit ? `${formatted} ${unit}`.trim() : `${formatted}`;
            });
        }

        // 2. Render Ingredients Checklist
        function renderIngredients(ratio = 1) {
            const ingListEl = document.getElementById('ingredients-checklist');
            if (!ingListEl) return;
            const ings = Array.isArray(r.ingredients) ? r.ingredients : [];

            ingListEl.innerHTML = ings.map((ing, i) => {
                const rawText = typeof ing === 'object' ? `${ing.quantity || ''} ${ing.unit || ''} ${ing.name || ''}`.trim() : ing;
                const displayText = scaleIngredientText(rawText, ratio);
                return `
                    <label class="checklist-item" style="display:flex; align-items:center; gap:12px; padding:10px 14px; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.06); border-radius:8px; margin-bottom:8px; cursor:pointer;">
                        <input type="checkbox" id="ing_${i}" style="accent-color:var(--primary-gold); width:18px; height:18px; cursor:pointer;">
                        <span class="chk-label" style="color:#e2e8f0; font-size:0.95rem;">${displayText}</span>
                    </label>
                `;
            }).join('');
        }

        // 3. Allergen & Dietary Profiling
        function renderAllergenProfile() {
            const pillsContainer = document.getElementById('allergen-pills-list');
            if (!pillsContainer) return;

            const ings = Array.isArray(r.ingredients) ? r.ingredients : [];
            const textCorpus = (ings.join(' ') + ' ' + (r.title || '') + ' ' + (r.description || '')).toLowerCase();

            const detected = [];

            if (/flour|wheat|bread|pasta|dough|semolina|barley|rye/.test(textCorpus)) {
                detected.push({ label: 'Contains Gluten (Wheat)', type: 'badge-allergen', icon: '🌾' });
            }
            if (/cheese|mozzarella|milk|butter|cream|dairy|parmesan|ricotta|cheddar/.test(textCorpus)) {
                detected.push({ label: 'Contains Dairy (Lactose)', type: 'badge-allergen', icon: '🧀' });
            }
            if (/egg|eggs|yolk|mayo/.test(textCorpus)) {
                detected.push({ label: 'Contains Eggs', type: 'badge-allergen', icon: '🥚' });
            }
            if (/peanut|almond|walnut|cashew|pecan|pistachio|hazelnut|nut/.test(textCorpus)) {
                detected.push({ label: 'Contains Tree Nuts / Peanuts', type: 'badge-allergen', icon: '🥜' });
            }

            const hasMeat = /chicken|beef|pork|bacon|prosciutto|meat|fish|salmon|tuna|shrimp|prawn|anchovy/.test(textCorpus);
            if (!hasMeat) {
                detected.push({ label: 'Vegetarian Friendly', type: 'badge-diet', icon: '🌱' });
            }

            if (detected.length === 0) {
                detected.push({ label: 'Whole Foods / No Common Allergens Detected', type: 'badge-neutral', icon: '🥗' });
            }

            pillsContainer.innerHTML = detected.map(item => `
                <span class="allergen-pill ${item.type}">
                    <span>${item.icon}</span>
                    <span>${item.label}</span>
                </span>
            `).join('');
        }

        // 4. Instacart Grocery Delivery Referral Button
        const instacartBtn = document.getElementById('btn-instacart-checkout');
        if (instacartBtn) {
            instacartBtn.addEventListener('click', () => {
                const ings = Array.isArray(r.ingredients) ? r.ingredients : [];
                const itemsCount = ings.length;
                const encodedRecipe = encodeURIComponent(r.title);
                const partnerUrl = `https://www.instacart.com/store/partner_recipe?title=${encodedRecipe}&items=${itemsCount}&ref=foodiesgoodies`;

                if (typeof Swal === 'function' || typeof swal === 'function') {
                    const fireModal = (typeof Swal === 'function') ? Swal.fire : swal;
                    fireModal({
                        title: 'Order via Instacart 🛒',
                        html: `
                            <p style="color:#94a3b8; font-size:0.92rem; margin-bottom:12px;">
                                We are packaging <strong>${itemsCount} ingredients</strong> from <em>${r.title}</em> for instant delivery from your local supermarkets.
                            </p>
                            <div style="background:rgba(16,185,129,0.1); border:1px solid rgba(16,185,129,0.3); padding:10px; border-radius:8px; font-size:0.8rem; color:#34d399; margin-bottom:14px;">
                                ✨ Foodies Goodies Official Partner &bull; Same-Day Delivery
                            </div>
                        `,
                        icon: 'info',
                        showCancelButton: true,
                        confirmButtonText: 'Proceed to Instacart Cart',
                        confirmButtonColor: '#10b981',
                        cancelButtonText: 'Cancel'
                    }).then((result) => {
                        if (result.isConfirmed || result === true) {
                            window.open(partnerUrl, '_blank', 'noopener,noreferrer');
                        }
                    });
                } else {
                    window.open(partnerUrl, '_blank', 'noopener,noreferrer');
                }
            });
        }

        // Initial renderings
        updateServingsDisplay();
        renderAllergenProfile();

        // 5. Render Steps List
        const stepsListEl = document.getElementById('cooking-steps-list');
        if (stepsListEl) {
            const steps = Array.isArray(r.steps) ? r.steps : (Array.isArray(r.instructions) ? r.instructions : []);
            stepsListEl.innerHTML = steps.map((step, idx) => {
                const text = typeof step === 'object' ? (step.instruction || step.step_text) : step;
                return `
                    <div class="step-card" style="display:flex; gap:16px; margin-bottom:16px; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.06); padding:18px; border-radius:12px;">
                        <div class="step-badge" style="width:32px; height:32px; border-radius:50%; background:var(--primary-gold); color:#000; font-weight:800; display:flex; align-items:center; justify-content:center; flex-shrink:0;">${idx + 1}</div>
                        <div class="step-text" style="color:#cbd5e1; font-size:1rem; line-height:1.6;">${text}</div>
                    </div>
                `;
            }).join('');
        }

        // 6. Social Taste Button
        const tasteBtn = document.getElementById('btn-recipe-taste');
        if (tasteBtn && window.Social) {
            tasteBtn.dataset.recipeId = r.id;
            tasteBtn.addEventListener('click', () => {
                Social.taste(r.id, tasteBtn);
            });
        }

        // 7. Social Pin Button
        const pinBtn = document.getElementById('btn-recipe-pin');
        if (pinBtn && window.Social) {
            pinBtn.dataset.recipeId = r.id;
            pinBtn.addEventListener('click', () => {
                Social.pin(r.id, pinBtn);
            });
        }

        // 8. Share Button
        const shareBtn = document.getElementById('btn-recipe-share');
        if (shareBtn && window.Social) {
            shareBtn.addEventListener('click', () => {
                Social.share(r.title, window.location.href);
            });
        }

        // 9. Fork Author Button
        const forkBtn = document.getElementById('btn-fork-author');
        if (forkBtn && window.Social) {
            const authorId = r.user_id || r.authorId || 'chef_gabriella';
            forkBtn.addEventListener('click', () => {
                Social.fork(authorId, forkBtn);
            });
        }

        // 10. Flavor Rating Stars
        // Rating is local-demo only — no social rating backend exists.
        document.querySelectorAll('.star-rating-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const stars = parseInt(btn.dataset.stars, 10);
                document.querySelectorAll('.star-rating-btn').forEach((b, idx) => {
                    b.classList.toggle('active', idx < stars);
                });
                // No backend rating call — rating is local visual only
                const fire = (typeof Swal === 'function') ? Swal.fire : (typeof swal === 'function' ? swal : alert);
                fire({
                    title: 'Flavor Rating Submitted! ⭐',
                    text: `You rated this recipe ${stars} stars!`,
                    icon: 'success'
                });
            });
        });

        // 11. Flavor Notes (Comment Submission)
        const commentForm = document.getElementById('form-flavor-notes');
        const commentsThread = document.getElementById('flavor-notes-thread');
        if (commentForm && commentsThread) {
            commentForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const input = document.getElementById('flavor-note-input');
                const text = input ? input.value.trim() : '';
                if (!text) return;

                if (window.Social) {
                    const note = await Social.addFlavorNote(r.id, text);
                    if (note) {
                        const noteEl = document.createElement('div');
                        noteEl.className = 'note-bubble';
                        const safeUser = (note.username || 'You').replace(/</g, '&lt;').replace(/>/g, '&gt;');
                        const safeText = (note.comment_text || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
                        noteEl.innerHTML = `
                            <img src="${note.profile_pic || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'}" class="note-avatar" alt="${safeUser}">
                            <div class="note-content">
                                <div class="note-header">
                                    <strong>${safeUser}</strong>
                                    <span>${note.time_ago || 'just now'}</span>
                                </div>
                                <p>${safeText}</p>
                            </div>
                        `;
                        commentsThread.prepend(noteEl);
                        input.value = '';
                        const fire = (typeof Swal === 'function') ? Swal.fire : (typeof swal === 'function' ? swal : alert);
                        fire({
                            title: 'Flavor Note Added! 📝',
                            text: 'Your culinary feedback has been shared with the community!',
                            icon: 'success'
                        });
                    }
                }
            });
        }
    }
});
