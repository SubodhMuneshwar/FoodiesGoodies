/**
 * FoodiesGoodies Global Navigation, Theme Manager & UI Enhancements
 * Provides accessible mobile slide-out drawer, persistent dark mode engine,
 * global toast notifications, and universal modal/dialog shims.
 */

// 1. Early Theme Initialization (Prevents FOUC)
(function initTheme() {
    try {
        const savedTheme = localStorage.getItem('foodies_theme') || 'dark';
        document.documentElement.setAttribute('data-theme', savedTheme);
    } catch (e) {
        document.documentElement.setAttribute('data-theme', 'dark');
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

    // 3.1 Setup Dark / Light Theme Toggle Button
    let themeToggleBtn = header.querySelector('.theme-toggle-btn');
    if (!themeToggleBtn) {
        themeToggleBtn = document.createElement('button');
        themeToggleBtn.type = 'button';
        themeToggleBtn.className = 'theme-toggle-btn';
        themeToggleBtn.setAttribute('aria-label', 'Toggle Light/Dark Theme');

        function updateThemeIcon() {
            const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
            themeToggleBtn.innerHTML = currentTheme === 'light' ? '🌙' : '☀️';
            themeToggleBtn.title = currentTheme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode';
        }

        updateThemeIcon();

        themeToggleBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
            const nextTheme = currentTheme === 'light' ? 'dark' : 'light';
            document.documentElement.setAttribute('data-theme', nextTheme);
            try {
                localStorage.setItem('foodies_theme', nextTheme);
            } catch (err) {}
            updateThemeIcon();
            if (window.Toast) {
                window.Toast.show('info', `${nextTheme === 'light' ? 'Light' : 'Dark'} mode activated`);
            }
        });

        // Insert into header next to navbar or login btn
        header.appendChild(themeToggleBtn);
    }

    if (!navbar) return;

    // 3.2 Slide-Out Mobile Drawer Backdrop
    let backdrop = document.querySelector('.drawer-backdrop');
    if (!backdrop) {
        backdrop = document.createElement('div');
        backdrop.className = 'drawer-backdrop';
        document.body.appendChild(backdrop);
    }

    // 3.3 Hamburger Button
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
            backdrop.classList.add('active');
            toggleBtn.classList.add('is-active');
            toggleBtn.setAttribute('aria-expanded', 'true');
            document.body.classList.add('mobile-nav-active');
        } else {
            navbar.classList.remove('nav-open');
            backdrop.classList.remove('active');
            toggleBtn.classList.remove('is-active');
            toggleBtn.setAttribute('aria-expanded', 'false');
            document.body.classList.remove('mobile-nav-active');
        }
    }

    toggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleMenu();
    });

    backdrop.addEventListener('click', () => {
        toggleMenu(false);
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
            toggleBtn.focus();
        }
    });

    // Auto-close if resized to desktop
    window.addEventListener('resize', () => {
        if (window.innerWidth > 992 && navbar.classList.contains('nav-open')) {
            toggleMenu(false);
        }
    });
});
