/**
 * FoodiesGoodies Global Authentication & User Session Manager
 * Provides unified session handling, navbar state updates, and demo login across all pages.
 */

const Auth = {
    STORAGE_KEY: 'foodies_active_user',
    USERS_KEY: 'foodies_registered_users',

    // Default demo foodie profile
    DEFAULT_USER: {
        id: 'user_alex_101',
        username: 'Chef Alex Morgan',
        handle: '@chef_alex',
        email: 'alex.morgan@foodiesgoodies.com',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
        bio: 'Artisanal baker, sourdough obsessive & Mediterranean home cook. Always chasing the perfect crust!',
        dietaryFocus: 'Mediterranean & Whole Foods',
        rank: 'Sous Chef',
        followersCount: 142,
        followingCount: 68,
        recipesCount: 5,
        savedRecipesCount: 19,
        status: 'Baking honey sourdough loaf 🥖',
        is_demo: true
    },

    // Check if user is authenticated
    isAuthenticated() {
        return !!this.getCurrentUser();
    },

    // Get current logged-in user from local cache
    getCurrentUser() {
        try {
            const raw = localStorage.getItem(this.STORAGE_KEY);
            return raw ? JSON.parse(raw) : null;
        } catch (e) {
            console.error('Error reading auth state:', e);
            return null;
        }
    },

    // Set current logged-in user into cache
    setCurrentUser(user) {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(user));
            this.updateRegisteredUser(user);
        } catch (e) {
            console.error('Error saving auth state:', e);
        }
    },

    // Clear user cache
    clearUser() {
        try {
            localStorage.removeItem(this.STORAGE_KEY);
        } catch (e) {}
    },

    // Verify session with server (Single Source of Truth)
    // A network failure or unreachable backend MUST NOT result in an authenticated state for production users.
    async checkSession() {
        const currentUser = this.getCurrentUser();
        const isDemo = currentUser && (currentUser.is_demo || currentUser.email === 'demo@foodiesgoodies.local' || currentUser.id === 'user_alex_101' || currentUser.id === 'demo_ephemeral_user');

        try {
            const res = await fetch('/api/auth/me', {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Accept': 'application/json'
                }
            });

            if (res.ok) {
                const result = await res.json();
                if (result && result.success && result.data) {
                    // Server confirmed session — cache profile for UI use only
                    this.setCurrentUser(result.data);
                    return result.data;
                }
            }
            // Preserve demo kitchen exploration session if active
            if (isDemo) {
                return currentUser;
            }
            // Any non-OK response (401, 403, 5xx) = unauthenticated
            this.clearUser();
            return null;
        } catch (err) {
            console.warn('Session check failed (backend unreachable).', err);
            if (isDemo) {
                return currentUser;
            }
            this.clearUser();
            return null;
        }
    },

    // Get all registered users from local cache
    getRegisteredUsers() {
        try {
            const raw = localStorage.getItem(this.USERS_KEY);
            return raw ? JSON.parse(raw) : [];
        } catch (e) {
            return [];
        }
    },

    // Save/update user in registry
    updateRegisteredUser(user) {
        const users = this.getRegisteredUsers();
        const index = users.findIndex(u => u.email === user.email || u.id === user.id);
        if (index >= 0) {
            users[index] = { ...users[index], ...user };
        } else {
            users.push(user);
        }
        localStorage.setItem(this.USERS_KEY, JSON.stringify(users));
    },

    // Perform login (ASP.NET Core Identity Cookie Authentication)
    // Login succeeds ONLY when the server returns a successful response.
    // A failed or unreachable backend must NOT produce an authenticated state.
    async login(email, password) {
        const cleanEmail = (email || '').trim().toLowerCase();

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    email: cleanEmail,
                    password: password,
                    rememberMe: true
                })
            });

            const data = await res.json().catch(() => ({}));
            const user = data.data || data.user;

            if (res.ok && data.success && user) {
                this.setCurrentUser(user);
                const msg = data.message || 'Login successful! Welcome back.';
                if (window.Toast) window.Toast.show('success', msg);
                return { success: true, message: msg, user: user };
            }

            // Server rejected login
            const errMsg = (data && data.message) || 'Invalid email or password.';
            if (window.Toast) window.Toast.show('error', errMsg);
            return { success: false, message: errMsg };
        } catch (err) {
            console.error('Login request failed (backend unreachable):', err);
            const errNet = 'Unable to reach the authentication server. Please try again.';
            if (window.Toast) window.Toast.show('error', errNet);
            return { success: false, message: errNet };
        }
    },

    // Perform registration (ASP.NET Core Identity)
    async register(username, email, password) {
        const cleanName = (username || '').trim() || 'Foodie Chef';
        const cleanEmail = (email || '').trim().toLowerCase();

        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    username: cleanName,
                    email: cleanEmail,
                    password: password
                })
            });

            const data = await res.json().catch(() => ({}));
            const user = data.data || data.user;

            if (res.ok && data.success && user) {
                this.setCurrentUser(user);
                const msg = data.message || 'Registration successful! Welcome to Foodies Goodies.';
                if (window.Toast) window.Toast.show('success', msg);
                return { success: true, message: msg, user: user };
            }

            // Server rejected registration
            const errMsg = (data && data.message) || 'Registration failed. Please check your details.';
            if (window.Toast) window.Toast.show('error', errMsg);
            return { success: false, message: errMsg };
        } catch (e) {
            console.error('Registration request failed (backend unreachable):', e);
            const errNet = 'Unable to reach the registration server. Please try again.';
            if (window.Toast) window.Toast.show('error', errNet);
            return { success: false, message: errNet };
        }
    },

    // Quick 1-click Demo Foodie Login with server-issued authentication session
    async quickDemoLogin() {
        try {
            const res = await fetch('/api/auth/demo', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            });
            const data = await res.json().catch(() => ({}));
            const user = data.data || data.user;
            if (res.ok && data.success && user) {
                this.setCurrentUser(user);
                const msg = data.message || 'Welcome to the Demo Kitchen!';
                if (window.Toast) window.Toast.show('success', msg);
                return { success: true, message: msg, user: user };
            }
        } catch (e) {
            console.warn('Demo login API unavailable, falling back to local demo profile:', e);
        }

        // Offline / fallback demo profile
        this.setCurrentUser(this.DEFAULT_USER);
        if (window.Toast) window.Toast.show('info', 'Offline Demo Kitchen Activated');
        return { success: true, message: 'Welcome to the Demo Kitchen!', user: this.DEFAULT_USER };
    },

    // Logout with server session invalidation
    async logout(redirectUrl) {
        try {
            await fetch('/api/auth/logout', {
                method: 'POST',
                credentials: 'include',
                headers: { 'Accept': 'application/json' }
            });
        } catch (e) {
            console.warn('Server logout request failed:', e);
        }

        this.clearUser();

        const isPagesDir = window.location.pathname.includes('/pages/');
        const target = redirectUrl || (isPagesDir ? 'login.html' : 'pages/login.html');
        window.location.href = target;
    },

    // Synchronize and update all navbar headers across the site
    async initNavbar() {
        // Optimistic render from cache first
        let user = this.getCurrentUser();
        this.renderNavbarBadge(user);

        // Async verification against server session
        const verifiedUser = await this.checkSession();
        if (verifiedUser !== user) {
            this.renderNavbarBadge(verifiedUser);
        }
    },

    renderNavbarBadge(user) {
        const loginBtn = document.querySelector('.nav-login-btn');
        if (!loginBtn) return;

        const isPagesDir = window.location.pathname.includes('/pages/');
        const pfx = isPagesDir ? '' : 'pages/';

        if (user) {
            const safeUsername = (user.username || 'Foodie Chef').replace(/</g, '&lt;').replace(/>/g, '&gt;');
            const safeHandle = (user.handle || '@foodie').replace(/</g, '&lt;').replace(/>/g, '&gt;');
            const safeAvatar = user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80';

            // Check if wrapper already exists
            let wrapper = loginBtn.closest('.user-dropdown-wrapper');
            if (!wrapper) {
                wrapper = document.createElement('div');
                wrapper.className = 'user-dropdown-wrapper';
                loginBtn.parentNode.insertBefore(wrapper, loginBtn);
                wrapper.appendChild(loginBtn);
            }

            loginBtn.removeAttribute('href');
            loginBtn.setAttribute('role', 'button');
            loginBtn.setAttribute('aria-haspopup', 'true');
            loginBtn.setAttribute('aria-expanded', 'false');
            loginBtn.className = 'nav-login-btn user-nav-badge logged-in';
            loginBtn.innerHTML = `
                <img src="${safeAvatar}" alt="${safeUsername}" class="user-nav-avatar">
                <span>${safeUsername.split(' ')[0] || 'Chef'}</span>
                <span class="user-nav-caret" aria-hidden="true">▼</span>
            `;

            // Existing or new dropdown menu
            let menu = wrapper.querySelector('.user-dropdown-menu');
            if (!menu) {
                menu = document.createElement('div');
                menu.className = 'user-dropdown-menu';
                wrapper.appendChild(menu);
            }

            menu.innerHTML = `
                <div class="user-dropdown-header">
                    <div class="user-name">${safeUsername}</div>
                    <div class="user-handle">${safeHandle}</div>
                </div>
                <a href="${pfx}dashboard.html" class="user-dropdown-item">
                    <ion-icon name="grid-outline"></ion-icon>
                    <span>Social Kitchen Feed</span>
                </a>
                <a href="${pfx}profile.html" class="user-dropdown-item">
                    <ion-icon name="person-circle-outline"></ion-icon>
                    <span>My Chef Profile</span>
                </a>
                <a href="${pfx}create-recipe.html" class="user-dropdown-item">
                    <ion-icon name="restaurant-outline"></ion-icon>
                    <span>Share New Recipe</span>
                </a>
                <a href="${pfx}notifications.html" class="user-dropdown-item">
                    <ion-icon name="notifications-outline"></ion-icon>
                    <span>Kitchen Alerts</span>
                </a>
                <a href="${pfx}settings.html" class="user-dropdown-item">
                    <ion-icon name="settings-outline"></ion-icon>
                    <span>Account Settings</span>
                </a>
                <div class="user-dropdown-divider"></div>
                <button type="button" class="user-dropdown-item item-logout" id="headerLogoutBtn">
                    <ion-icon name="log-out-outline"></ion-icon>
                    <span>Sign Out</span>
                </button>
            `;

            // Toggle dropdown
            loginBtn.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                const isOpen = wrapper.classList.toggle('open');
                loginBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
            };

            // Sign out handler
            const logoutBtn = menu.querySelector('#headerLogoutBtn');
            if (logoutBtn) {
                logoutBtn.onclick = async (e) => {
                    e.preventDefault();
                    await Auth.logout();
                };
            }

            // Close on outside click
            document.addEventListener('click', (e) => {
                if (!wrapper.contains(e.target)) {
                    wrapper.classList.remove('open');
                    loginBtn.setAttribute('aria-expanded', 'false');
                }
            });
        } else {
            // Unauthenticated state
            const wrapper = loginBtn.closest('.user-dropdown-wrapper');
            if (wrapper && wrapper !== loginBtn) {
                wrapper.parentNode.insertBefore(loginBtn, wrapper);
                wrapper.remove();
            }

            loginBtn.href = `${pfx}login.html`;
            loginBtn.className = 'nav-login-btn';
            loginBtn.removeAttribute('role');
            loginBtn.removeAttribute('aria-haspopup');
            loginBtn.removeAttribute('aria-expanded');
            loginBtn.innerHTML = 'Sign In';
            loginBtn.onclick = null;
        }
    }
};

// Explicitly bind to global window object
window.Auth = Auth;

// Initialize navbar upon DOM readiness
document.addEventListener('DOMContentLoaded', () => {
    Auth.initNavbar();
});
