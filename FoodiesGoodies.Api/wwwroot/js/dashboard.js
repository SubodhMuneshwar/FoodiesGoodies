/**
 * FoodiesGoodies Social Recipe Hub & User Dashboard Controller (dashboard.js)
 * Manages personalized profile, community recipe stream, publishing, reactions, and foodie network.
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Authenticate or redirect to login
    let currentUser = Auth.getCurrentUser();
    if (!currentUser) {
        window.location.href = 'login.html';
        return;
    }

    // Verify session with server single-source-of-truth in background
    if (window.Auth && typeof Auth.checkSession === 'function') {
        Auth.checkSession().then(verifiedUser => {
            if (!verifiedUser) {
                const local = Auth.getCurrentUser();
                if (local && (local.is_demo || local.email === 'demo@foodiesgoodies.local' || local.id === 'user_alex_101')) {
                    // Retain demo exploration session
                    return;
                }
                window.location.href = 'login.html';
            } else {
                currentUser = verifiedUser;
                if (typeof renderProfile === 'function') {
                    renderProfile();
                }
            }
        });
    }

    // 2. Storage Keys
    const RECIPES_STORAGE_KEY = 'foodies_community_recipes';
    const FOLLOWS_STORAGE_KEY = 'foodies_user_follows';
    const YUMS_STORAGE_KEY = 'foodies_user_yums';
    const SAVED_STORAGE_KEY = 'foodies_user_saved';

    // 3. Community Chefs Preloaded Network
    const COMMUNITY_CHEFS = [
        {
            id: 'chef_gabriella',
            name: 'Chef Gabriella Russo',
            handle: '@gabriella_russo',
            avatar: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?auto=format&fit=crop&w=300&q=80',
            specialty: 'Wood-Fired Neapolitan & Pastas',
            status: 'Proofing 72hr pizza dough 🍕',
            followersCount: 1420,
            isFollowing: true
        },
        {
            id: 'chef_luca',
            name: 'Chef Luca Bianchi',
            handle: '@luca_bianchi',
            avatar: 'https://images.unsplash.com/photo-1583394293214-28ded15ee548?auto=format&fit=crop&w=300&q=80',
            specialty: 'Artisanal Baker & Sourdough Specialist',
            status: 'Scoring wild rye batards 🥖',
            followersCount: 890,
            isFollowing: true
        },
        {
            id: 'chef_aisha',
            name: 'Chef Aisha Patel',
            handle: '@aisha_spices',
            avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&q=80',
            specialty: 'Spice Fusion & Plant-Based Bowls',
            status: 'Roasting whole garam masala seeds 🌶️',
            followersCount: 1150,
            isFollowing: false
        },
        {
            id: 'chef_javier',
            name: 'Chef Javier Morales',
            handle: '@javier_grill',
            avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
            specialty: 'Latin Grill & Street Tacos',
            status: 'Charring charred salsa verde 🌮',
            followersCount: 760,
            isFollowing: false
        },
        {
            id: 'foodie_claire',
            name: 'Claire Chen',
            handle: '@claire_eats',
            avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80',
            specialty: 'Asian Dumplings & Broths',
            status: 'Folding crystal shrimp dumplings 🥟',
            followersCount: 430,
            isFollowing: true
        }
    ];

    // 4. Default Seed Community Recipes
    const DEFAULT_RECIPES = [
        {
            id: 'rec_101',
            authorId: 'chef_gabriella',
            authorName: 'Chef Gabriella Russo',
            authorHandle: '@gabriella_russo',
            authorAvatar: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?auto=format&fit=crop&w=300&q=80',
            title: 'Truffle Margherita with Roasted Cherry Tomatoes',
            category: 'Italian',
            cookTime: '25 mins',
            difficulty: 'Medium',
            image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=700&q=80',
            description: 'Crispy wood-fired crust crowned with crushed San Marzano tomatoes, fresh buffalo mozzarella, aromatic sweet basil, and a drizzle of white truffle oil.',
            ingredients: [
                '500g 00 Flour',
                '320ml Warm Water',
                '7g Active Dry Yeast',
                '200g Fresh Buffalo Mozzarella',
                '1 cup San Marzano Tomato Sauce',
                '1 tbsp White Truffle Oil',
                'Fresh Basil Leaves'
            ],
            instructions: [
                'Mix flour, yeast, and warm water; knead for 10 minutes until smooth.',
                'Allow dough to rise at room temperature for 2 hours until doubled in size.',
                'Stretch dough into a 12-inch circle on parchment paper.',
                'Ladle seasoned San Marzano tomato sauce and distribute buffalo mozzarella slices.',
                'Bake in a preheated oven at 500°F (260°C) with a pizza stone for 8-10 mins until bubbling and charred.',
                'Garnish with fresh basil leaves and truffle oil before serving hot!'
            ],
            yumsCount: 88,
            timestamp: '2 hours ago',
            createdAt: Date.now() - 7200000
        },
        {
            id: 'rec_102',
            authorId: 'chef_luca',
            authorName: 'Chef Luca Bianchi',
            authorHandle: '@luca_bianchi',
            authorAvatar: 'https://images.unsplash.com/photo-1583394293214-28ded15ee548?auto=format&fit=crop&w=300&q=80',
            title: 'Artisanal Honey Rye Sourdough Batard',
            category: 'Bakery',
            cookTime: '45 mins',
            difficulty: 'Master Chef',
            image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=700&q=80',
            description: 'Naturally leavened loaf boasting a blistered mahogany crust, open honeycomb crumb, and a delicate touch of wildflower honey.',
            ingredients: [
                '350g Bread Flour',
                '100g Whole Dark Rye Flour',
                '340g Water (75% hydration)',
                '90g Active Sourdough Starter',
                '10g Fine Sea Salt',
                '1 tbsp Wildflower Honey'
            ],
            instructions: [
                'Autolyse bread flour, rye flour, and water for 45 minutes.',
                'Add active sourdough starter and honey; knead gently, then incorporate salt.',
                'Perform 4 sets of stretch-and-folds spaced 30 minutes apart.',
                'Bulk ferment until volume increases 50%, shape into an oval batard, and cold retard overnight.',
                'Preheat Dutch oven to 475°F (245°C). Score the dough with a sharp lame.',
                'Bake covered for 20 mins, then uncover and bake 25 mins more until deep golden brown.'
            ],
            yumsCount: 114,
            timestamp: '5 hours ago',
            createdAt: Date.now() - 18000000
        },
        {
            id: 'rec_103',
            authorId: 'user_alex_101', // Owned by logged in demo user
            authorName: currentUser.username,
            authorHandle: currentUser.handle,
            authorAvatar: currentUser.avatar,
            title: 'Pan-Seared Salmon with Garlic Herb Ghee',
            category: 'Healthy',
            cookTime: '20 mins',
            difficulty: 'Easy',
            image: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=700&q=80',
            description: 'Crispy skin salmon fillets pan-basted with garlic butter, fresh dill, and squeezed lemon juice. High protein and keto friendly!',
            ingredients: [
                '2 fresh Atlantic Salmon fillets',
                '2 tbsp Cultured Ghee or Butter',
                '3 cloves Garlic, crushed',
                '1 tbsp Fresh Dill, chopped',
                '1/2 Lemon, juiced',
                'Sea Salt and Fresh Black Pepper'
            ],
            instructions: [
                'Pat salmon dry with paper towels; score skin lightly and season with sea salt and pepper.',
                'Heat a heavy skillet over medium-high heat with a drop of olive oil.',
                'Place salmon skin-side down; press gently for 10 seconds to keep flat. Cook 4-5 mins.',
                'Flip fillets, add ghee, crushed garlic, and dill to the pan.',
                'Baste continuously with melted garlic ghee for 3 minutes until medium rare.',
                'Finish with fresh lemon juice and serve with asparagus!'
            ],
            yumsCount: 45,
            timestamp: 'Yesterday',
            createdAt: Date.now() - 86400000
        },
        {
            id: 'rec_104',
            authorId: 'chef_aisha',
            authorName: 'Chef Aisha Patel',
            authorHandle: '@aisha_spices',
            authorAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&q=80',
            title: 'Fragrant Coconut Chickpea Curry & Basmati',
            category: 'Asian',
            cookTime: '30 mins',
            difficulty: 'Easy',
            image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=700&q=80',
            description: 'A comforting golden curry infused with ginger, turmeric, creamy coconut milk, baby spinach, and roasted cumin.',
            ingredients: [
                '2 cans Chickpeas, rinsed',
                '1 can Full-Fat Coconut Milk',
                '1 Onion, diced',
                '3 cloves Garlic & 1-inch Ginger grated',
                '1 tbsp Garam Masala & Turmeric',
                '2 cups Baby Spinach',
                'Fresh Cilantro and Steamed Basmati Rice'
            ],
            instructions: [
                'Sauté diced onions in olive oil until golden brown.',
                'Add garlic, ginger, turmeric, and garam masala; toast spices for 1 minute until fragrant.',
                'Pour in coconut milk and chickpeas; bring to a simmer for 15 minutes.',
                'Stir in baby spinach until wilted.',
                'Serve over steamed basmati rice with warm garlic naan and cilantro.'
            ],
            yumsCount: 63,
            timestamp: '2 days ago',
            createdAt: Date.now() - 172800000
        }
    ];

    // 5. State Retrieval Helpers
    function getStoredRecipes() {
        try {
            const stored = localStorage.getItem(RECIPES_STORAGE_KEY);
            return stored ? JSON.parse(stored) : DEFAULT_RECIPES;
        } catch (e) {
            return DEFAULT_RECIPES;
        }
    }

    function saveStoredRecipes(recipes) {
        localStorage.setItem(RECIPES_STORAGE_KEY, JSON.stringify(recipes));
    }

    function getFollowedChefIds() {
        try {
            const stored = localStorage.getItem(FOLLOWS_STORAGE_KEY);
            return stored ? JSON.parse(stored) : ['chef_gabriella', 'chef_luca', 'foodie_claire'];
        } catch (e) {
            return ['chef_gabriella', 'chef_luca'];
        }
    }

    function saveFollowedChefIds(ids) {
        localStorage.setItem(FOLLOWS_STORAGE_KEY, JSON.stringify(ids));
    }

    function getYumedRecipeIds() {
        try {
            const stored = localStorage.getItem(YUMS_STORAGE_KEY);
            return stored ? JSON.parse(stored) : ['rec_101', 'rec_103'];
        } catch (e) {
            return [];
        }
    }

    function saveYumedRecipeIds(ids) {
        localStorage.setItem(YUMS_STORAGE_KEY, JSON.stringify(ids));
    }

    function getSavedRecipeIds() {
        try {
            const stored = localStorage.getItem(SAVED_STORAGE_KEY);
            return stored ? JSON.parse(stored) : ['rec_101', 'rec_102'];
        } catch (e) {
            return [];
        }
    }

    function saveSavedRecipeIds(ids) {
        localStorage.setItem(SAVED_STORAGE_KEY, JSON.stringify(ids));
    }

    // Initialize local stores if empty
    if (!localStorage.getItem(RECIPES_STORAGE_KEY)) {
        saveStoredRecipes(DEFAULT_RECIPES);
    }
    if (!localStorage.getItem(FOLLOWS_STORAGE_KEY)) {
        saveFollowedChefIds(['chef_gabriella', 'chef_luca', 'foodie_claire']);
    }

    // 6. Profile View Population
    function renderProfile() {
        const user = Auth.getCurrentUser() || currentUser;
        const recipes = getStoredRecipes();
        const myRecipes = recipes.filter(r => r.authorId === user.id);
        const follows = getFollowedChefIds();
        const saved = getSavedRecipeIds();

        // Update profile card
        document.getElementById('profile-name').textContent = user.username;
        document.getElementById('profile-handle').textContent = user.handle || '@' + user.username.toLowerCase().replace(/\s+/g, '');
        document.getElementById('profile-avatar').src = user.avatar;
        document.getElementById('profile-rank').textContent = user.rank || 'Sous Chef';
        document.getElementById('profile-dietary').textContent = user.dietaryFocus || 'Culinary Adventurer';
        document.getElementById('profile-bio').textContent = user.bio || 'Exploring tasty recipes and culinary wonders on Foodies Goodies!';
        document.getElementById('profile-status').textContent = user.status || 'Cooking something delicious! 🍳';

        // Update stats counters
        document.getElementById('stat-recipes-count').textContent = myRecipes.length;
        document.getElementById('stat-followers-count').textContent = user.followersCount || 142;
        document.getElementById('stat-following-count').textContent = follows.length;
        document.getElementById('stat-saved-count').textContent = saved.length;

        // Update navbar
        const navAvatar = document.getElementById('nav-user-avatar');
        const navName = document.getElementById('nav-user-name');
        if (navAvatar) navAvatar.src = user.avatar;
        if (navName) navName.textContent = user.username.split(' ')[0] || 'Dashboard';
    }

    // 7. Render Community Feed
    let currentTab = 'community';
    let currentCategory = 'all';
    let searchQuery = '';

    function renderFeed() {
        const container = document.getElementById('recipes-feed-container');
        if (!container) return;

        const recipes = getStoredRecipes();
        const user = Auth.getCurrentUser() || currentUser;
        const follows = getFollowedChefIds();
        const yums = getYumedRecipeIds();
        const saved = getSavedRecipeIds();

        // Filter by Tab
        let filtered = recipes.filter(recipe => {
            if (currentTab === 'community') return true;
            if (currentTab === 'following') {
                return follows.includes(recipe.authorId) || recipe.authorId === user.id;
            }
            if (currentTab === 'my-recipes') {
                return recipe.authorId === user.id;
            }
            if (currentTab === 'saved') {
                return saved.includes(recipe.id);
            }
            return true;
        });

        // Filter by Category
        if (currentCategory !== 'all') {
            filtered = filtered.filter(recipe => {
                const cat = (recipe.category || '').toLowerCase();
                return cat.includes(currentCategory.toLowerCase());
            });
        }

        // Filter by Search Query
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase().trim();
            filtered = filtered.filter(recipe => {
                const titleMatch = (recipe.title || '').toLowerCase().includes(q);
                const descMatch = (recipe.description || '').toLowerCase().includes(q);
                const ingMatch = (recipe.ingredients || []).some(i => i.toLowerCase().includes(q));
                return titleMatch || descMatch || ingMatch;
            });
        }

        // Empty state
        if (filtered.length === 0) {
            container.innerHTML = `
                <div class="feed-empty-state">
                    <ion-icon name="restaurant-outline"></ion-icon>
                    <h3>No Recipes Found</h3>
                    <p>${currentTab === 'saved' ? "You haven't saved any recipes to your cookbook yet. Tap the bookmark icon on any dish to save it!" : "Try selecting another category chip, clearing your search, or publishing your own recipe!"}</p>
                </div>
            `;
            return;
        }

        // Render Cards
        container.innerHTML = filtered.map(recipe => {
            const isYumed = yums.includes(recipe.id);
            const isSaved = saved.includes(recipe.id);
            const isSelf = recipe.authorId === user.id;

            return `
                <article class="feed-recipe-card" data-id="${recipe.id}">
                    <!-- Author Header -->
                    <div class="card-author-header">
                        <div class="author-info-group">
                            <img src="${recipe.authorAvatar}" alt="${recipe.authorName}" class="author-avatar" loading="lazy">
                            <div class="author-names">
                                <span class="author-display-name">${recipe.authorName} ${isSelf ? '<span style="font-size:0.75rem; color:var(--primary-gold);">(You)</span>' : ''}</span>
                                <div class="author-subline">
                                    <span class="author-handle-text">${recipe.authorHandle}</span>
                                    <span>&bull;</span>
                                    <span class="card-time-pill">${recipe.timestamp || 'Recently'}</span>
                                </div>
                            </div>
                        </div>
                        <span class="card-category-pill" style="font-size:0.8rem; background:rgba(210,168,28,0.15); border:1px solid var(--primary-gold); color:var(--primary-gold); padding:3px 10px; border-radius:var(--radius-full); font-weight:700;">
                            ${recipe.category}
                        </span>
                    </div>

                    <!-- Dish Media -->
                    <div class="card-dish-media">
                        <img src="${recipe.image}" alt="${recipe.title}" loading="lazy">
                        <span class="media-cuisine-badge">${recipe.category}</span>
                        <span class="media-time-badge">
                            <ion-icon name="time-outline"></ion-icon>
                            <span>${recipe.cookTime}</span>
                        </span>
                    </div>

                    <!-- Content Details -->
                    <div class="card-content-wrap">
                        <h2 class="card-recipe-title">${recipe.title}</h2>
                        <p class="card-recipe-desc">${recipe.description}</p>

                        <!-- Ingredients Chips Preview -->
                        <div class="card-ingredients-preview">
                            ${(recipe.ingredients || []).slice(0, 4).map(ing => `<span class="card-ing-chip">${ing}</span>`).join('')}
                            ${(recipe.ingredients || []).length > 4 ? `<span class="card-ing-chip">+${(recipe.ingredients || []).length - 4} more</span>` : ''}
                        </div>

                        <!-- Footer Actions -->
                        <div class="card-actions-footer">
                            <div class="action-buttons-group">
                                <button type="button" class="btn-yum-reaction ${isYumed ? 'active-yum' : ''}" data-id="${recipe.id}">
                                    <span>${isYumed ? '❤️' : '😋'}</span>
                                    <span class="yum-counter">${recipe.yumsCount || 0}</span>
                                    <span>Yum!</span>
                                </button>
                                <button type="button" class="btn-bookmark-recipe ${isSaved ? 'active-saved' : ''}" data-id="${recipe.id}" title="${isSaved ? 'Remove from Cookbook' : 'Save to Cookbook'}">
                                    <ion-icon name="${isSaved ? 'bookmark' : 'bookmark-outline'}"></ion-icon>
                                </button>
                            </div>

                            <button type="button" class="btn-view-recipe-modal" data-id="${recipe.id}">
                                <span>View Recipe</span>
                                <ion-icon name="arrow-forward-outline"></ion-icon>
                            </button>
                        </div>
                    </div>
                </article>
            `;
        }).join('');

        // Bind Card Actions
        container.querySelectorAll('.btn-yum-reaction').forEach(btn => {
            btn.addEventListener('click', () => toggleYum(btn.dataset.id));
        });

        container.querySelectorAll('.btn-bookmark-recipe').forEach(btn => {
            btn.addEventListener('click', () => toggleBookmark(btn.dataset.id));
        });

        container.querySelectorAll('.btn-view-recipe-modal').forEach(btn => {
            btn.addEventListener('click', () => openRecipeDetailModal(btn.dataset.id));
        });
    }

    // 8. Reactions & Bookmarks
    function toggleYum(recipeId) {
        let yums = getYumedRecipeIds();
        let recipes = getStoredRecipes();
        const index = recipes.findIndex(r => r.id === recipeId);
        if (index === -1) return;

        if (yums.includes(recipeId)) {
            yums = yums.filter(id => id !== recipeId);
            recipes[index].yumsCount = Math.max(0, (recipes[index].yumsCount || 1) - 1);
        } else {
            yums.push(recipeId);
            recipes[index].yumsCount = (recipes[index].yumsCount || 0) + 1;
        }

        saveYumedRecipeIds(yums);
        saveStoredRecipes(recipes);
        renderFeed();
    }

    function toggleBookmark(recipeId) {
        let saved = getSavedRecipeIds();
        if (saved.includes(recipeId)) {
            saved = saved.filter(id => id !== recipeId);
        } else {
            saved.push(recipeId);
        }
        saveSavedRecipeIds(saved);
        renderProfile();
        renderFeed();
    }

    // 9. Suggested Foodies Widget
    function renderSuggestedFoodies() {
        const container = document.getElementById('suggested-foodies-container');
        if (!container) return;

        const follows = getFollowedChefIds();

        container.innerHTML = COMMUNITY_CHEFS.map(chef => {
            const isFollowed = follows.includes(chef.id);
            return `
                <div class="suggested-foodie-item" data-chef-id="${chef.id}">
                    <div class="foodie-left-meta">
                        <img src="${chef.avatar}" alt="${chef.name}" class="foodie-mini-avatar">
                        <div class="foodie-text-meta">
                            <strong>${chef.name}</strong>
                            <span>${chef.status}</span>
                        </div>
                    </div>
                    <button type="button" class="btn-follow-toggle ${isFollowed ? 'following' : ''}" data-chef-id="${chef.id}">
                        ${isFollowed ? 'Following' : '+ Follow'}
                    </button>
                </div>
            `;
        }).join('');

        container.querySelectorAll('.btn-follow-toggle').forEach(btn => {
            btn.addEventListener('click', () => toggleFollowChef(btn.dataset.chefId));
        });
    }

    function toggleFollowChef(chefId) {
        let follows = getFollowedChefIds();
        const chef = COMMUNITY_CHEFS.find(c => c.id === chefId);
        const chefName = chef ? chef.name : 'Chef';

        if (follows.includes(chefId)) {
            follows = follows.filter(id => id !== chefId);
        } else {
            follows.push(chefId);
        }

        saveFollowedChefIds(follows);
        renderProfile();
        renderSuggestedFoodies();
        renderNetworkModal();
        if (currentTab === 'following') {
            renderFeed();
        }
    }

    // 10. Feed Tabs & Category Switching
    document.querySelectorAll('.feed-tab').forEach(tabBtn => {
        tabBtn.addEventListener('click', () => {
            document.querySelectorAll('.feed-tab').forEach(b => {
                b.classList.remove('active');
                b.setAttribute('aria-selected', 'false');
            });
            tabBtn.classList.add('active');
            tabBtn.setAttribute('aria-selected', 'true');
            currentTab = tabBtn.dataset.tab;
            renderFeed();
        });
    });

    document.querySelectorAll('.category-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            document.querySelectorAll('.category-chip').forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            currentCategory = chip.dataset.category;
            renderFeed();
        });
    });

    const searchInput = document.getElementById('feed-search-input');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            searchQuery = e.target.value;
            renderFeed();
        });
    }

    // 11. Recipe Creation Studio
    const postModal = document.getElementById('modal-post-recipe');
    const openPostBtn = document.getElementById('btn-open-recipe-modal');
    const postForm = document.getElementById('form-post-recipe');
    const addIngBtn = document.getElementById('btn-add-ingredient');
    const singleIngInput = document.getElementById('recipe-single-ingredient');
    const ingTagsContainer = document.getElementById('recipe-ingredients-tags');
    let currentIngredients = [
        '2 salmon fillets',
        '3 cloves garlic, minced',
        '1/2 cup heavy cream'
    ];

    function renderIngredientTags() {
        if (!ingTagsContainer) return;
        ingTagsContainer.innerHTML = currentIngredients.map((ing, idx) => `
            <span class="ing-tag" data-idx="${idx}">
                <span>${ing}</span>
                <button type="button" class="remove-tag" data-idx="${idx}">&times;</button>
            </span>
        `).join('');

        ingTagsContainer.querySelectorAll('.remove-tag').forEach(btn => {
            btn.addEventListener('click', () => {
                const idx = parseInt(btn.dataset.idx, 10);
                currentIngredients.splice(idx, 1);
                renderIngredientTags();
            });
        });
    }

    if (addIngBtn && singleIngInput) {
        const addIngredient = () => {
            const val = singleIngInput.value.trim();
            if (val) {
                currentIngredients.push(val);
                singleIngInput.value = '';
                renderIngredientTags();
                singleIngInput.focus();
            }
        };

        addIngBtn.addEventListener('click', addIngredient);
        singleIngInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                addIngredient();
            }
        });
    }

    // Image preset picker
    document.querySelectorAll('.img-preset').forEach(preset => {
        preset.addEventListener('click', () => {
            document.querySelectorAll('.img-preset').forEach(p => p.classList.remove('active'));
            preset.classList.add('active');
            const imgUrl = preset.dataset.img;
            const inputImg = document.getElementById('recipe-input-image');
            if (inputImg) inputImg.value = imgUrl;
        });
    });

    if (postForm) {
        postForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const user = Auth.getCurrentUser() || currentUser;
            const title = document.getElementById('recipe-input-title').value.trim();
            const category = document.getElementById('recipe-input-category').value;
            const cookTime = document.getElementById('recipe-input-time').value.trim();
            const difficulty = document.getElementById('recipe-input-difficulty').value;
            const image = document.getElementById('recipe-input-image').value.trim() || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=700&q=80';
            const desc = document.getElementById('recipe-input-desc').value.trim();
            const instructionsRaw = document.getElementById('recipe-input-instructions').value.trim();
            const instructions = instructionsRaw.split('\n').map(s => s.trim()).filter(s => s.length > 0);

            if (currentIngredients.length === 0) {
                if (typeof swal === 'function') {
                    swal('Missing Ingredients', 'Please add at least one ingredient for your recipe.', 'warning');
                } else {
                    alert('Please add at least one ingredient.');
                }
                return;
            }

            const newRecipe = {
                id: 'rec_' + Date.now(),
                authorId: user.id,
                authorName: user.username,
                authorHandle: user.handle || '@' + user.username.toLowerCase().replace(/\s+/g, ''),
                authorAvatar: user.avatar,
                title: title,
                category: category,
                cookTime: cookTime,
                difficulty: difficulty,
                image: image,
                description: desc,
                ingredients: [...currentIngredients],
                instructions: instructions,
                yumsCount: 1,
                timestamp: 'Just now',
                createdAt: Date.now()
            };

            const recipes = getStoredRecipes();
            recipes.unshift(newRecipe);
            saveStoredRecipes(recipes);

            // Also auto-yum our own creation
            const yums = getYumedRecipeIds();
            yums.push(newRecipe.id);
            saveYumedRecipeIds(yums);

            // No community backend exists — recipe is stored locally only (local-demo).

            closeModal(postModal);
            postForm.reset();
            currentIngredients = ['2 salmon fillets', '3 cloves garlic, minced'];
            renderIngredientTags();

            renderProfile();
            currentTab = 'my-recipes';
            document.querySelectorAll('.feed-tab').forEach(b => {
                b.classList.toggle('active', b.dataset.tab === 'my-recipes');
            });
            renderFeed();

            if (typeof swal === 'function') {
                swal('Recipe Published!', 'Your recipe is now live in the Community Kitchen!', 'success');
            }
        });
    }

    // 12. Recipe Detail Modal
    const viewModal = document.getElementById('modal-view-recipe');
    function openRecipeDetailModal(recipeId) {
        const recipes = getStoredRecipes();
        const recipe = recipes.find(r => r.id === recipeId);
        if (!recipe || !viewModal) return;

        const detailContent = document.getElementById('recipe-detail-content');
        detailContent.innerHTML = `
            <div class="detail-hero-media">
                <img src="${recipe.image}" alt="${recipe.title}">
            </div>

            <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
                <div class="detail-author-badge">
                    <img src="${recipe.authorAvatar}" alt="${recipe.authorName}" style="width:48px; height:48px; border-radius:50%; object-fit:cover; border:2px solid var(--primary-gold);">
                    <div>
                        <strong style="color:#ffffff; font-size:1.05rem; display:block;">${recipe.authorName}</strong>
                        <span style="color:var(--primary-gold); font-size:0.85rem;">${recipe.authorHandle}</span>
                    </div>
                </div>
                <div style="display:flex; gap:10px; align-items:center;">
                    <span style="background:rgba(210,168,28,0.15); border:1px solid var(--primary-gold); color:var(--primary-gold); padding:4px 12px; border-radius:var(--radius-full); font-weight:700; font-size:0.85rem;">
                        ${recipe.category}
                    </span>
                    <span style="color:#cbd5e1; font-size:0.85rem; font-weight:600;">
                        ⏱️ ${recipe.cookTime} &bull; 🎯 ${recipe.difficulty}
                    </span>
                </div>
            </div>

            <div>
                <h1 style="font-size:1.6rem; color:#ffffff; margin-bottom:8px; font-weight:800;">${recipe.title}</h1>
                <p style="color:#cbd5e1; font-size:1rem; line-height:1.6;">${recipe.description}</p>
            </div>

            <div>
                <h3 style="color:var(--primary-gold); font-size:1.15rem; margin-bottom:10px; font-weight:800;">Ingredients Checklist</h3>
                <div class="detail-ingredients-checklist">
                    ${(recipe.ingredients || []).map((ing, i) => `
                        <label class="checklist-item">
                            <input type="checkbox" id="chk_${i}">
                            <span>${ing}</span>
                        </label>
                    `).join('')}
                </div>
            </div>

            <div>
                <h3 style="color:var(--primary-gold); font-size:1.15rem; margin-bottom:10px; font-weight:800;">Step-by-Step Instructions</h3>
                <div class="detail-steps-list">
                    ${(recipe.instructions || []).map((step, idx) => `
                        <div class="step-item">
                            <div class="step-num">${idx + 1}</div>
                            <div>${step}</div>
                        </div>
                    `).join('')}
                </div>
            </div>

            <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:14px; padding-top:14px; border-top:1px solid rgba(255,255,255,0.1);">
                <button type="button" class="btn-dash-primary" onclick="window.print()">
                    <ion-icon name="print-outline"></ion-icon>
                    <span>Print Recipe</span>
                </button>
            </div>
        `;

        openModal(viewModal);
    }

    // 13. Foodie Friends Network Modal
    const networkModal = document.getElementById('modal-network');
    let currentNetworkTab = 'followers';
    let networkSearchQuery = '';

    function renderNetworkModal() {
        const container = document.getElementById('network-users-container');
        if (!container) return;

        const follows = getFollowedChefIds();
        const user = Auth.getCurrentUser() || currentUser;

        document.getElementById('net-followers-count').textContent = user.followersCount || 142;
        document.getElementById('net-following-count').textContent = follows.length;

        let list = COMMUNITY_CHEFS;
        if (currentNetworkTab === 'following') {
            list = COMMUNITY_CHEFS.filter(c => follows.includes(c.id));
        } else if (currentNetworkTab === 'followers') {
            list = COMMUNITY_CHEFS.slice(0, 4); // Sample followers
        }

        if (networkSearchQuery.trim()) {
            const q = networkSearchQuery.toLowerCase().trim();
            list = list.filter(c => c.name.toLowerCase().includes(q) || c.handle.toLowerCase().includes(q) || c.specialty.toLowerCase().includes(q));
        }

        if (list.length === 0) {
            container.innerHTML = `
                <div style="text-align:center; padding:30px; color:var(--text-dim);">
                    <ion-icon name="people-outline" style="font-size:2rem; margin-bottom:6px;"></ion-icon>
                    <p>No foodies found matching your search.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = list.map(chef => {
            const isFollowed = follows.includes(chef.id);
            return `
                <div class="suggested-foodie-item" style="padding:10px; background:rgba(255,255,255,0.03); border-radius:var(--radius-sm);">
                    <div class="foodie-left-meta">
                        <img src="${chef.avatar}" alt="${chef.name}" class="foodie-mini-avatar">
                        <div class="foodie-text-meta">
                            <strong>${chef.name}</strong>
                            <span style="color:var(--primary-gold);">${chef.handle}</span>
                            <span style="font-size:0.75rem; color:var(--text-dim);">${chef.specialty}</span>
                        </div>
                    </div>
                    <button type="button" class="btn-follow-toggle ${isFollowed ? 'following' : ''}" data-chef-id="${chef.id}">
                        ${isFollowed ? 'Following' : '+ Follow'}
                    </button>
                </div>
            `;
        }).join('');

        container.querySelectorAll('.btn-follow-toggle').forEach(btn => {
            btn.addEventListener('click', () => toggleFollowChef(btn.dataset.chefId));
        });
    }

    document.querySelectorAll('.network-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.network-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            currentNetworkTab = tab.dataset.networkTab;
            renderNetworkModal();
        });
    });

    const netSearch = document.getElementById('network-search-input');
    if (netSearch) {
        netSearch.addEventListener('input', (e) => {
            networkSearchQuery = e.target.value;
            renderNetworkModal();
        });
    }

    // 14. Edit Profile Modal
    const editModal = document.getElementById('modal-edit-profile');
    const editForm = document.getElementById('form-edit-profile');

    function populateEditForm() {
        const user = Auth.getCurrentUser() || currentUser;
        document.getElementById('edit-profile-name').value = user.username;
        document.getElementById('edit-profile-dietary').value = user.dietaryFocus || '';
        document.getElementById('edit-profile-bio').value = user.bio || '';
        document.getElementById('edit-profile-status-input').value = user.status || '';
    }

    if (editForm) {
        editForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const user = Auth.getCurrentUser() || currentUser;
            user.username = document.getElementById('edit-profile-name').value.trim();
            user.handle = '@' + user.username.toLowerCase().replace(/[^a-z0-9_]/g, '');
            user.dietaryFocus = document.getElementById('edit-profile-dietary').value.trim();
            user.bio = document.getElementById('edit-profile-bio').value.trim();
            user.status = document.getElementById('edit-profile-status-input').value.trim();

            Auth.setCurrentUser(user);
            renderProfile();
            closeModal(editModal);

            if (typeof swal === 'function') {
                swal('Profile Updated!', 'Your culinary profile changes have been saved.', 'success');
            }
        });
    }

    // Quick status edit trigger
    const quickStatusBtn = document.getElementById('btn-open-edit-status');
    if (quickStatusBtn) {
        quickStatusBtn.addEventListener('click', () => {
            populateEditForm();
            openModal(editModal);
            document.getElementById('edit-profile-status-input').focus();
        });
    }

    // 15. General Modal Open/Close Controls
    function openModal(modal) {
        if (!modal) return;
        modal.classList.add('is-active');
        modal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
    }

    function closeModal(modal) {
        if (!modal) return;
        modal.classList.remove('is-active');
        modal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
    }

    // Modal open buttons
    if (openPostBtn) {
        openPostBtn.addEventListener('click', () => {
            renderIngredientTags();
            openModal(postModal);
        });
    }

    const openNetworkBtn = document.getElementById('btn-open-network-modal');
    const followersStatBox = document.getElementById('stat-followers-box');
    const followingStatBox = document.getElementById('stat-following-box');
    const seeAllFoodiesBtn = document.getElementById('btn-see-all-foodies');

    const openNetwork = (tabName = 'followers') => {
        currentNetworkTab = tabName;
        document.querySelectorAll('.network-tab').forEach(t => {
            t.classList.toggle('active', t.dataset.networkTab === tabName);
        });
        renderNetworkModal();
        openModal(networkModal);
    };

    if (openNetworkBtn) openNetworkBtn.addEventListener('click', () => openNetwork('followers'));
    if (followersStatBox) followersStatBox.addEventListener('click', () => openNetwork('followers'));
    if (followingStatBox) followingStatBox.addEventListener('click', () => openNetwork('following'));
    if (seeAllFoodiesBtn) seeAllFoodiesBtn.addEventListener('click', () => openNetwork('discover'));

    const openEditBtn = document.getElementById('btn-open-profile-edit');
    if (openEditBtn) {
        openEditBtn.addEventListener('click', () => {
            populateEditForm();
            openModal(editModal);
        });
    }

    // Modal close triggers
    document.querySelectorAll('[data-close]').forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = btn.dataset.close;
            const modal = document.getElementById(targetId);
            closeModal(modal);
        });
    });

    // Close on overlay backdrop click
    document.querySelectorAll('.dash-modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                closeModal(overlay);
            }
        });
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            document.querySelectorAll('.dash-modal-overlay.is-active').forEach(modal => {
                closeModal(modal);
            });
        }
    });

    // 16. Logout Handler
    const logoutBtn = document.getElementById('btn-logout');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            if (typeof swal === 'function') {
                swal({
                    title: 'Sign Out?',
                    text: 'Are you sure you want to log out of Foodies Goodies?',
                    icon: 'warning',
                    buttons: ['Cancel', 'Logout'],
                    dangerMode: true,
                }).then((willLogout) => {
                    if (willLogout) {
                        Auth.logout('login.html');
                    }
                });
            } else {
                if (confirm('Are you sure you want to log out?')) {
                    Auth.logout('login.html');
                }
            }
        });
    }

    // 17. Initial Renders
    renderProfile();
    renderFeed();
    renderSuggestedFoodies();
});
