/**
 * FoodiesGoodies Homepage Dynamic Interactions
 * Handles filter tab switching for trending recipes and interactive animations.
 */

document.addEventListener('DOMContentLoaded', () => {
    // Filter Tabs for Trending Recipes
    const tabButtons = document.querySelectorAll('.filter-tab-btn');
    const recipeCards = document.querySelectorAll('.trending-recipe-card');

    if (tabButtons && recipeCards) {
        tabButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                // Update active tab button
                tabButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                const filter = btn.getAttribute('data-filter') || 'all';

                recipeCards.forEach(card => {
                    const categories = (card.getAttribute('data-category') || '').split(' ');
                    if (filter === 'all' || categories.includes(filter)) {
                        card.style.display = 'flex';
                        card.style.animation = 'none';
                        // Trigger reflow to restart animation
                        void card.offsetWidth;
                        card.style.animation = 'fadeInUp 0.4s ease-in-out forwards';
                    } else {
                        card.style.display = 'none';
                    }
                });
            });
        });
    }
});
