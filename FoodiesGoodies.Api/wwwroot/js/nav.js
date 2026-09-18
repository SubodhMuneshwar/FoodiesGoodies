/**
 * FoodiesGoodies Global Navigation, Theme Manager & UI Enhancements
 * Provides accessible mobile slide-out drawer, persistent dark mode engine,
 * global toast notifications, and universal modal/dialog shims.
 */

/**
 * Fixes and Improvements:
 * 1. Added explicit z-index and positioning for reliable stacking
 * 2. Improved touch target size for hamburger button
 * 3. Added role="button" and tabindex for better accessibility
 * 4. Fixed focus trapping to include all focusable elements
 * 5. Added reduced motion media query support for animations
 * 6. Improved backdrop coverage and z-index
 * 7. Added preventDefault for touch events to avoid scrolling issues
 * 8. Enhanced keyboard navigation
 */

// 1. Early Theme Initialization (Prevents FOUC)
(function initTheme() {
    try {
        const savedTheme = localStorage.getItem('foodies_theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
    } catch (e) {
        document.documentElement.setAttribute('data-theme', 'light');
    }
})();

// 2. Universal SweetAlert & Toast Compatibility Service
(function initAlertsAndToasts() {
    if (typeof window === 'undefined') return;

    // Global Toast helper
    window.Toast = {
        show(type, message, title = '') {
            const iconType = (type === 'error' || type === 'danger') ? 'error'
                : (type === 'success' ? 'success'
                : (type === 'warning' ? 'warning' : 'info'));

            if (typeof window.Swal === 'function') {
                const ToastMixin = window.Swal.mixin({
                    toast: true,
                    position: 'top-end',
                    showConfirmButton: false,
                    timer: 3500,
                    timerProgressBar: true,
                    didOpen: (toast) => {
                        toast.addEventListener('mouseenter', window.Swal.stopTimer);
                        toast.addEventListener('mouseleave', window.Swal.resumeTimer);
                    }
                });
                return ToastMixin.fire({
                    icon: iconType,
                    title: title || message,
                    text: title ? message : ''
                });
            }

            // Fallback native toast
            let container = document.getElementById('foodiesToastContainer');
            if (!container) {
                container = document.createElement('div');
                container.id = 'foodiesToastContainer';
                container.style.cssText = 'position:fixed;top:20px;right:20px;z-index:99999;display:flex;flex-direction:column;gap:10px;pointer-events:none;';
                document.body.appendChild(container);
            }

            const toast = document.createElement('div');
            toast.style.cssText = `
                background: ${iconType === 'success' ? '#2a9d8f' : (iconType === 'error' ? '#e63946' : '#141620')};
                color: #fff;
                padding: 12px 18px;
                border-radius: 8px;
                box-shadow: 0 4px 16px rgba(0,0,0,0.35);
                font-family: system-ui, sans-serif;
                font-size: 0.95rem;
                display: flex;
                align-items: center;
                gap: 10px;
                opacity: 0;
                transform: translateY(-10px);
                transition: all 0.3s ease;
                pointer-events: auto;
            `;
            const iconSymbol = iconType === 'success' ? '✓' : (iconType === 'error' ? '✕' : 'ℹ');
            toast.innerHTML = `<strong>${iconSymbol}</strong> <span>${message}</span>`;
            container.appendChild(toast);

            requestAnimationFrame(() => {
                toast.style.opacity = '1';
                toast.style.transform = 'translateY(0)';
            });

            setTimeout(() => {
                toast.style.opacity = '0';
                toast.style.transform = 'translateY(-10px)';
                setTimeout(() => toast.remove(), 300);
            }, 3500);
        }
    };

    // Universal SweetAlert Shim
    function createSwalShim() {
        if (typeof window.Swal === 'function' && (typeof window.swal !== 'function' || !window.swal._isShim)) {
            const shim = function(arg1, arg2, arg3) {
                if (typeof arg1 === 'object' && arg1 !== null) {
                    const opts = { ...arg1 };
                    if (opts.buttons) {
                        opts.showCancelButton = true;
                        if (Array.isArray(opts.buttons) && opts.buttons.length >= 2) {
                            opts.cancelButtonText = opts.buttons[0];
                            opts.confirmButtonText = opts.buttons[1];
                        }
                        delete opts.buttons;
                    }
                    if (opts.dangerMode) {
                        opts.confirmButtonColor = '#dc2626';
                    }
                    return window.Swal.fire(opts).then(res => res.isConfirmed);
                }
                const title = arg1 || '';
                const text = arg2 || '';
                const icon = arg3 || 'info';
                return window.Swal.fire({ title, text, icon });
            };
            shim._isShim = true;
            window.swal = shim;
        }
    }

    createSwalShim();
    window.addEventListener('load', createSwalShim);
    document.addEventListener('DOMContentLoaded', createSwalShim);
})();

// 3. Navigation Drawer & Theme Controls
document.addEventListener('DOMContentLoaded', () => {
    const header = document.querySelector('header.header') || document.querySelector('header');
    const navbar = document.querySelector('.navbar');

    if (!header) return;

    // 3.1 Setup Header Actions Cluster
    let actionsWrap = header.querySelector('.header-actions-wrap');
    if (!actionsWrap) {
        actionsWrap = document.createElement('div');
        actionsWrap.className = 'header-actions-wrap';
        // Ensure it's a flex item and doesn't interfere with header layout
        actionsWrap.style.display = 'flex';
        actionsWrap.style.alignItems = 'center';
        header.appendChild(actionsWrap);
    }

    // 3.2 Creative Culinary Kitchen Mode Switcher (Day Service 🍳 vs Night Bistro 🔥)
    let themeToggleBtn = actionsWrap.querySelector('.theme-toggle-btn');
    if (!themeToggleBtn) {
        themeToggleBtn = document.createElement('button');
        themeToggleBtn.type = 'button';
        themeToggleBtn.className = 'theme-toggle-btn culinary-mode-switch';
        themeToggleBtn.setAttribute('aria-label', 'Switch kitchen mode: Day Service or Night Bistro');
        themeToggleBtn.innerHTML = `
            <span class="culinary-track" aria-hidden="true">
                <span class="culinary-station station-day">🍳</span>
                <span class="culinary-station station-night">🔥</span>
                <span class="culinary-slider">
                    <span class="culinary-skillet">
                        <span class="skillet-icon">🍳</span>
                    </span>
                </span>
            </span>
            <span class="culinary-badge-text">Day Service</span>
        `;

        const lightQuotes = [
            "🍳 Day Service Activated: Fresh morning prep & golden sunlight!",
            "🥐 Brioche & Brunch Mode: Crisp daylight for precision cooking!",
            "🥞 The stove is hot: Morning culinary service begins!",
            "☕ Espresso & Sunrise: Welcome to the kitchen, Chef!"
        ];
        const darkQuotes = [
            "🔥 Night Service Activated: Wood-fired hearth stoked & embers glowing!",
            "🍷 Candlelit Bistro Mode: Cozy evening dining & bold vintage flavors!",
            "🌙 Midnight Kitchen: Dim the lights & let the pot slow-simmer!",
            "🍕 Wood-Fired Oven Lit: Artisanal evening service is now live!"
        ];

        function playKitchenSizzle(isNight) {
            try {
                const AudioContext = window.AudioContext || window.webkitAudioContext;
                if (!AudioContext) return;
                const ctx = new AudioContext();
                if (ctx.state === 'suspended') {
                    ctx.resume();
                }
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = isNight ? 'triangle' : 'sine';
                osc.frequency.setValueAtTime(isNight ? 300 : 540, ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(isNight ? 200 : 720, ctx.currentTime + 0.14);
                gain.gain.setValueAtTime(0.04, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.14);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start();
                osc.stop(ctx.currentTime + 0.15);
            } catch (e) {}
        }

        function createCulinaryBurst(buttonEl, targetTheme) {
            if (!buttonEl || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
            const rect = buttonEl.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;

            const items = targetTheme === 'dark'
                ? ['🔥', '🍷', '🍕', '✨', '🌶️', '🥩']
                : ['🍳', '🥞', '🥐', '✨', '🧈', '☕'];

            const count = 5;
            for (let i = 0; i < count; i++) {
                const particle = document.createElement('span');
                particle.className = 'culinary-sizzle-particle';
                particle.textContent = items[Math.floor(Math.random() * items.length)];

                const dx = (Math.random() - 0.5) * 80;
                const dy = -(Math.random() * 45 + 35);
                const rot = (Math.random() - 0.5) * 60;
                const scale = 0.8 + Math.random() * 0.4;

                particle.style.left = `${centerX + (Math.random() - 0.5) * 20}px`;
                particle.style.top = `${centerY - 6}px`;
                particle.style.setProperty('--drift-transform', `translate(${dx}px, ${dy}px) scale(${scale}) rotate(${rot}deg)`);

                document.body.appendChild(particle);
                setTimeout(() => particle.remove(), 750);
            }
        }

        function createKitchenFlash(targetTheme) {
            if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
            const flash = document.createElement('div');
            flash.className = `culinary-kitchen-flash ${targetTheme === 'dark' ? 'flash-dark' : 'flash-light'}`;
            document.body.appendChild(flash);
            setTimeout(() => flash.remove(), 460);
        }

        function updateCulinaryUI(theme, animated = false) {
            const isDark = theme === 'dark';
            const iconEl = themeToggleBtn.querySelector('.skillet-icon');
            const textEl = themeToggleBtn.querySelector('.culinary-badge-text');

            if (textEl) {
                textEl.textContent = isDark ? 'Night Bistro' : 'Day Service';
            }

            themeToggleBtn.title = isDark
                ? 'Switch to Day Service (Sunny Morning Prep)'
                : 'Switch to Night Bistro (Wood-Fired Hearth)';

            if (iconEl) {
                iconEl.textContent = isDark ? '🔥' : '🍳';
                if (animated) {
                    iconEl.classList.remove('flipping');
                    void iconEl.offsetWidth; // Trigger reflow
                    iconEl.classList.add('flipping');
                    setTimeout(() => iconEl.classList.remove('flipping'), 550);
                }
            }
        }

        const initialTheme = document.documentElement.getAttribute('data-theme') || 'light';
        updateCulinaryUI(initialTheme, false);

        themeToggleBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
            const nextTheme = currentTheme === 'light' ? 'dark' : 'light';
            document.documentElement.setAttribute('data-theme', nextTheme);
            try {
                localStorage.setItem('foodies_theme', nextTheme);
            } catch (err) {}

            updateCulinaryUI(nextTheme, true);
            playKitchenSizzle(nextTheme === 'dark');
            createCulinaryBurst(themeToggleBtn, nextTheme);
            createKitchenFlash(nextTheme);

            if (window.Toast) {
                const quotes = nextTheme === 'dark' ? darkQuotes : lightQuotes;
                const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
                window.Toast.show('info', randomQuote);
            }
        });

        actionsWrap.appendChild(themeToggleBtn);
    }

    // Header shadow on scroll
    window.addEventListener('scroll', () => {
        if (window.scrollY > 20) {
            header.classList.add('header--scrolled');
        } else {
            header.classList.remove('header--scrolled');
        }
    }, { passive: true });

    // 3.3 Slide-Out Mobile Navigation
    if (!navbar) return;

    // Create backdrop if it doesn't exist
    let backdrop = document.querySelector('.drawer-backdrop');
    if (!backdrop) {
        backdrop = document.createElement('div');
        backdrop.className = 'drawer-backdrop';
        backdrop.setAttribute('aria-hidden', 'true');
        document.body.appendChild(backdrop);
    }

    // Create or ensure hamburger button exists in actions wrap
    let toggleBtn = actionsWrap.querySelector('.nav-toggle');
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
        actionsWrap.appendChild(toggleBtn);
    }

    // Prepend sleek mobile drawer header if missing
    let drawerHeader = navbar.querySelector('.drawer-header-mobile');
    if (!drawerHeader) {
        drawerHeader = document.createElement('div');
        drawerHeader.className = 'drawer-header-mobile';
        drawerHeader.innerHTML = `
            <div class="drawer-brand-wrap">
                <span class="drawer-brand-title">Foodies Goodies</span>
                <span class="drawer-brand-sub">Culinary Guide</span>
            </div>
            <button type="button" class="drawer-close-btn" aria-label="Close mobile navigation">
                <span aria-hidden="true">&times;</span>
            </button>
        `;
        navbar.prepend(drawerHeader);
    }

    // Always ensure close button click is bound
    const closeBtn = navbar.querySelector('.drawer-close-btn');
    if (closeBtn) {
        closeBtn.onclick = (e) => {
            e.stopPropagation();
            toggleMenu(false);
        };
    }

    // Focus trap handler for mobile drawer
    function trapNavFocus(e) {
        if (!navbar.classList.contains('nav-open') || e.key !== 'Tab') return;
        const focusables = navbar.querySelectorAll('a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])');
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];

        if (e.shiftKey) {
            if (document.activeElement === first || !navbar.contains(document.activeElement)) {
                e.preventDefault();
                last.focus();
            }
        } else {
            if (document.activeElement === last || !navbar.contains(document.activeElement)) {
                e.preventDefault();
                first.focus();
            }
        }
    }

    // Toggle menu state
    function toggleMenu(open) {
        const isCurrentlyOpen = navbar.classList.contains('nav-open');
        const shouldOpen = (open !== undefined) ? open : !isCurrentlyOpen;

        if (shouldOpen) {
            navbar.classList.add('nav-open');
            backdrop.classList.add('active');
            backdrop.setAttribute('aria-hidden', 'false');
            toggleBtn.classList.add('is-active');
            toggleBtn.setAttribute('aria-expanded', 'true');
            document.body.classList.add('mobile-nav-active');
            document.addEventListener('keydown', trapNavFocus);

            // Focus first nav item inside drawer
            const firstNav = navbar.querySelector('.drawer-close-btn') || navbar.querySelector('a');
            if (firstNav) firstNav.focus();
        } else {
            navbar.classList.remove('nav-open');
            backdrop.classList.remove('active');
            backdrop.setAttribute('aria-hidden', 'true');
            toggleBtn.classList.remove('is-active');
            toggleBtn.setAttribute('aria-expanded', 'false');
            document.body.classList.remove('mobile-nav-active');
            document.removeEventListener('keydown', trapNavFocus);
            toggleBtn.focus();
        }
    }

    // Toggle button click handler
    toggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        toggleMenu();
    });

    // Backdrop click handler
    backdrop.addEventListener('click', () => {
        toggleMenu(false);
    });

    // Click outside handler (closes menu if clicked anywhere outside navbar and toggle button)
    document.addEventListener('click', (e) => {
        if (navbar.classList.contains('nav-open')) {
            if (!navbar.contains(e.target) && !toggleBtn.contains(e.target)) {
                toggleMenu(false);
            }
        }
    });

    // Close when clicking any nav link on mobile
    navbar.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            if (window.innerWidth <= 992) {
                toggleMenu(false);
            }
        });
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && navbar.classList.contains('nav-open')) {
            toggleMenu(false);
        }
    });

    // Auto-close if resized to desktop
    window.addEventListener('resize', () => {
        if (window.innerWidth > 992 && navbar.classList.contains('nav-open')) {
            toggleMenu(false);
        }
    });

    // Prevent scrolling on body when menu is open (overscroll behavior)
    let lastTouchY = null;
    backdrop.addEventListener('touchstart', (e) => {
        if (navbar.classList.contains('nav-open')) {
            lastTouchY = e.touches[0].clientY;
        }
    }, { passive: true });

    backdrop.addEventListener('touchmove', (e) => {
        if (!lastTouchY || !navbar.classList.contains('nav-open')) return;

        const touchY = e.touches[0].clientY;
        const diff = touchY - lastTouchY;

        // Prevent vertical scrolling when menu is open
        if (Math.abs(diff) > 10) {
            e.preventDefault();
        }
    }, { passive: false });

    backdrop.addEventListener('touchend', () => {
        lastTouchY = null;
    });

    // Floating Scroll-to-Top Button
    (function initScrollToTop() {
        const scrollBtn = document.createElement('button');
        scrollBtn.id = 'scroll-to-top-btn';
        scrollBtn.className = 'scroll-to-top-btn';
        scrollBtn.setAttribute('aria-label', 'Scroll to top of page');
        scrollBtn.title = 'Back to top';
        scrollBtn.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <polyline points="18 15 12 9 6 15"></polyline>
            </svg>
        `;
        document.body.appendChild(scrollBtn);

        window.addEventListener('scroll', () => {
            if (window.scrollY > 400) {
                scrollBtn.classList.add('visible');
            } else {
                scrollBtn.classList.remove('visible');
            }
        }, { passive: true });

        scrollBtn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    })();

    // Dynamic footer copyright year
    (function initFooterCopyright() {
        const currentYear = new Date().getFullYear();
        const yearRange = currentYear > 2025 ? `2025–${currentYear}` : '2025';
        document.querySelectorAll('.footer-bottom p').forEach(el => {
            el.innerHTML = el.innerHTML.replace(/(&copy;|©)\s*2025(-\d{4}|–\d{4})?/g, `&copy; ${yearRange}`);
        });
    })();
});