/**
 * FoodiesGoodies Authentication Modal & Form Switcher
 * Handles tab transitions between Login and Registration safely without throwing null errors.
 */

document.addEventListener('DOMContentLoaded', () => {
    const wrapper = document.querySelector('.wrapper');
    const loginLink = document.querySelector('.loginlnk');
    const registerLink = document.querySelector('.registerlnk');
    const btnpop = document.querySelector('.btnLogin-popup');
    const iconClose = document.querySelector('.close');

    // Switch to Registration form
    if (registerLink && wrapper) {
        registerLink.addEventListener('click', (e) => {
            e.preventDefault();
            wrapper.classList.add('active');
        });
    }

    // Switch to Login form
    if (loginLink && wrapper) {
        loginLink.addEventListener('click', (e) => {
            e.preventDefault();
            wrapper.classList.remove('active');
        });
    }

    // Modal popup trigger (if used on page)
    if (btnpop && wrapper) {
        btnpop.addEventListener('click', () => {
            wrapper.classList.add('active-popup');
        });
    }

    // Close button trigger (if modal is used)
    if (iconClose && wrapper) {
        iconClose.addEventListener('click', () => {
            wrapper.classList.remove('active-popup');
        });
    }

    // Helper for alerts supporting SweetAlert2, SweetAlert v1, or alert fallback
    function notify(title, message, icon) {
        if (typeof Swal === 'function' && Swal.fire) {
            return Swal.fire({ title, text: message, icon });
        } else if (typeof swal === 'function') {
            return swal(title, message, icon);
        } else {
            alert(`${title}: ${message}`);
            return Promise.resolve();
        }
    }

    // Form submissions with Auth service
    const loginForm = document.querySelector('.formlogin.Login form');
    const registerForm = document.querySelector('.formlogin.Register form');
    const demoBtn = document.querySelector('.btn-demo-auth');

    // CSRF token not required for ASP.NET Core same-origin cookie authentication

    // Quick 1-click Demo Login
    if (demoBtn) {
        demoBtn.addEventListener('click', (e) => {
            e.preventDefault();
            demoBtn.innerHTML = '<span>⚡ Signing in to Demo Kitchen...</span>';
            demoBtn.disabled = true;
            setTimeout(() => {
                if (window.Auth) {
                    Auth.quickDemoLogin();
                }
                window.location.href = 'dashboard.html';
            }, 400);
        });
    }

    // Login submit
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = loginForm.querySelector('#login-email')?.value;
            const password = loginForm.querySelector('#login-password')?.value;
            const submitBtn = loginForm.querySelector('button[type="submit"]');

            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = 'Logging in...';
            }

            try {
                const authService = window.Auth || (typeof Auth !== 'undefined' ? Auth : null);
                if (authService) {
                    const result = await authService.login(email, password);
                    if (result.success) {
                        await notify('Welcome Back!', result.message, 'success');
                        window.location.href = 'dashboard.html';
                        return;
                    } else {
                        notify('Login Failed', result.message || 'Invalid credentials.', 'error');
                    }
                } else {
                    const res = await fetch('/api/auth/login', {
                        method: 'POST',
                        credentials: 'include',
                        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                        body: JSON.stringify({ email: (email || '').trim().toLowerCase(), password: password, rememberMe: true })
                    });
                    const data = await res.json().catch(() => ({}));
                    if (res.ok && data.success) {
                        await notify('Welcome Back!', data.message || 'Login successful!', 'success');
                        window.location.href = 'dashboard.html';
                        return;
                    } else {
                        notify('Login Failed', data.message || 'Invalid credentials.', 'error');
                    }
                }
            } catch (err) {
                console.error('Login error:', err);
                notify('Error', 'Something went wrong. Please try again.', 'error');
            } finally {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Login';
                }
            }
        });
    }

    // Registration submit
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = registerForm.querySelector('#reg-username')?.value;
            const email = registerForm.querySelector('#reg-email')?.value;
            const password = registerForm.querySelector('#reg-password')?.value;
            const submitBtn = registerForm.querySelector('button[type="submit"]');

            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = 'Creating Account...';
            }

            try {
                const authService = window.Auth || (typeof Auth !== 'undefined' ? Auth : null);
                if (authService) {
                    const result = await authService.register(username, email, password);
                    if (result.success) {
                        await notify('Welcome to Foodies!', result.message, 'success');
                        window.location.href = 'dashboard.html';
                        return;
                    } else {
                        notify('Registration Failed', result.message || 'Registration could not be completed.', 'error');
                    }
                } else {
                    const res = await fetch('/api/auth/register', {
                        method: 'POST',
                        credentials: 'include',
                        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                        body: JSON.stringify({ username: (username || '').trim(), email: (email || '').trim().toLowerCase(), password: password })
                    });
                    const data = await res.json().catch(() => ({}));
                    if (res.ok && data.success) {
                        await notify('Welcome to Foodies!', data.message || 'Registration successful!', 'success');
                        window.location.href = 'dashboard.html';
                        return;
                    } else {
                        notify('Registration Failed', data.message || 'Registration could not be completed.', 'error');
                    }
                }
            } catch (err) {
                console.error('Registration error:', err);
                notify('Error', 'Something went wrong. Please try again.', 'error');
            } finally {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Register';
                }
            }
        });
    }
});

