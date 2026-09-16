/**
 * FoodiesGoodies Mobile Navigation Menu Toggle
 * Provides accessible mobile hamburger navigation across all devices.
 */

document.addEventListener('DOMContentLoaded', () => {
    const header = document.querySelector('header.header') || document.querySelector('header');
    const navbar = document.querySelector('.navbar');

    if (!header || !navbar) return;

    // Check if hamburger button already exists, or create dynamically
    let toggleBtn = header.querySelector('.nav-toggle');
    if (!toggleBtn) {
        toggleBtn = document.createElement('button');
        toggleBtn.className = 'nav-toggle';
        toggleBtn.type = 'button';
        toggleBtn.setAttribute('aria-label', 'Toggle Navigation Menu');
        toggleBtn.setAttribute('aria-expanded', 'false');
        toggleBtn.innerHTML = `
            <span class="hamburger-bar"></span>
            <span class="hamburger-bar"></span>
            <span class="hamburger-bar"></span>
        `;
        header.appendChild(toggleBtn);
    }

    // Toggle menu state
    function toggleMenu(open) {
        const isCurrentlyOpen = navbar.classList.contains('nav-open');
        const shouldOpen = (open !== undefined) ? open : !isCurrentlyOpen;

        if (shouldOpen) {
            navbar.classList.add('nav-open');
            toggleBtn.classList.add('is-active');
            toggleBtn.setAttribute('aria-expanded', 'true');
            document.body.classList.add('mobile-nav-active');
        } else {
            navbar.classList.remove('nav-open');
            toggleBtn.classList.remove('is-active');
            toggleBtn.setAttribute('aria-expanded', 'false');
            document.body.classList.remove('mobile-nav-active');
        }
    }

    toggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleMenu();
    });

    // Close when clicking any nav link
    navbar.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            if (window.innerWidth <= 880) {
                toggleMenu(false);
            }
        });
    });

    // Close on click outside
    document.addEventListener('click', (e) => {
        if (!header.contains(e.target) && navbar.classList.contains('nav-open')) {
            toggleMenu(false);
        }
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && navbar.classList.contains('nav-open')) {
            toggleMenu(false);
            toggleBtn.focus();
        }
    });

    // Auto-close if resized to desktop
    window.addEventListener('resize', () => {
        if (window.innerWidth > 880 && navbar.classList.contains('nav-open')) {
            toggleMenu(false);
        }
    });
});
