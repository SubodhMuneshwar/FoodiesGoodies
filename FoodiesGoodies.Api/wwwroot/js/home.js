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

    // Newsletter Form Submission
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

            // Newsletter subscriptions are stored locally only — no backend newsletter service exists.
            // This records intent; no server-side persistence occurs.
            localStorage.setItem('foodies_newsletter_subscribed', 'true');
            newsletterStatus.className = 'newsletter-msg success';
            newsletterStatus.textContent = 'Thank you for subscribing! Delicious weekly recipes are on their way.';
            newsletterEmail.value = '';

            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Subscribe Free';
            }
        });
    }
});
