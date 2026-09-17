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
        status: 'Baking honey sourdough loaf 🥖'
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
    // A network failure or unreachable backend MUST NOT result in an authenticated state.
    async checkSession() {
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
            // Any non-OK response (401, 403, 5xx) = unauthenticated
            this.clearUser();
            return null;
        } catch (err) {
            // Network error / backend unreachable — clear local cache, remain unauthenticated
            console.warn('Session check failed (backend unreachable). Clearing local session.', err);
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

            if (res.ok && data.success && data.user) {
                this.setCurrentUser(data.user);
                return { success: true, message: data.message || 'Login successful!', user: data.user };
            }

            // Server rejected login (wrong password, unknown user, validation error, etc.)
            return { success: false, message: (data && data.message) || 'Invalid email or password.' };
        } catch (err) {
            // Backend unreachable — do NOT fall back to localStorage authentication
            console.error('Login request failed (backend unreachable):', err);
            return { success: false, message: 'Unable to reach the authentication server. Please try again.' };
        }
    },

    // Perform registration (ASP.NET Core Identity)
    // Registration succeeds ONLY when the server returns a successful response.
    // A failed or unreachable backend must NOT produce an authenticated state.
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

            if (res.ok && data.success && data.user) {
                this.setCurrentUser(data.user);
                return { success: true, message: data.message || 'Registration successful!', user: data.user };
            }

            // Server rejected registration (duplicate email, validation failure, etc.)
            return { success: false, message: (data && data.message) || 'Registration failed. Please try again.' };
        } catch (e) {
            // Backend unreachable — do NOT create a fake local account
            console.error('Registration request failed (backend unreachable):', e);
            return { success: false, message: 'Unable to reach the registration server. Please try again.' };
        }
    },

    // Quick 1-click Demo Foodie Login
    quickDemoLogin() {
        this.setCurrentUser(this.DEFAULT_USER);
        return this.DEFAULT_USER;
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
        const dashboardPath = isPagesDir ? 'dashboard.html' : 'pages/dashboard.html';

        if (user) {
            loginBtn.href = dashboardPath;
            const safeUsername = (user.username || 'Foodie').replace(/</g, '&lt;').replace(/>/g, '&gt;');
            const safeAvatar = user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80';
            loginBtn.innerHTML = `
                <span class="user-nav-badge" style="display:inline-flex; align-items:center; gap:8px;">
                    <img src="${safeAvatar}" alt="${safeUsername}" style="width:24px; height:24px; border-radius:50%; object-fit:cover; border:1.5px solid #000;">
                    <span>Dashboard</span>
                </span>
            `;
            loginBtn.title = `Logged in as ${safeUsername}`;
            loginBtn.classList.add('logged-in');
        } else {
            const loginPath = isPagesDir ? 'login.html' : 'pages/login.html';
            loginBtn.href = loginPath;
            loginBtn.textContent = 'Login';
            loginBtn.classList.remove('logged-in');
        }
    }
};

// Explicitly bind to global window object
window.Auth = Auth;

// Initialize navbar upon DOM readiness
document.addEventListener('DOMContentLoaded', () => {
    Auth.initNavbar();
});
