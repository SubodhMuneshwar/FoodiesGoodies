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
                    this.setCurrentUser(result.data);
                    return result.data;
                }
            } else if (res.status === 401) {
                // Session expired or unauthenticated on backend
                this.clearUser();
                return null;
            }
        } catch (err) {
            console.warn('Session verification fallback to local cache:', err);
        }
        return this.getCurrentUser();
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
            } else if (data && !data.success) {
                return { success: false, message: data.message || 'Invalid email or password.' };
            }
        } catch (err) {
            console.warn('ASP.NET Core API login failed, checking fallback:', err);
        }

        // Fallback for offline dev testing
        const users = this.getRegisteredUsers();
        const existing = users.find(u => u.email === cleanEmail);
        if (existing) {
            this.setCurrentUser(existing);
            return { success: true, message: 'Welcome back, ' + existing.username + '!', user: existing };
        }

        return { success: false, message: 'Invalid email or password. Please try again.' };
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

            if (res.ok && data.success && data.user) {
                this.setCurrentUser(data.user);
                return { success: true, message: data.message || 'Registration successful!', user: data.user };
            } else if (data && !data.success) {
                return { success: false, message: data.message || 'Registration failed.' };
            }
        } catch (e) {
            console.warn('ASP.NET Core API registration unavailable:', e);
        }

        const newUser = {
            id: 'dev_' + Date.now(),
            username: cleanName,
            displayName: cleanName,
            handle: '@' + cleanName.toLowerCase().replace(/[^a-z0-9_]/g, ''),
            email: cleanEmail,
            avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=300&q=80',
            bio: 'New chef in town! Excited to share recipes and connect with fellow food lovers.',
            dietaryFocus: 'Culinary Explorer',
            rank: 'Home Cook',
            memberSince: new Date().toISOString()
        };

        this.setCurrentUser(newUser);
        return { success: true, message: 'Welcome to Foodies Goodies, ' + cleanName + '!', user: newUser };
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
