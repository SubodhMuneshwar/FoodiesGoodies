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

    // 3.1.1 Architectural Centered Tubelight Fixture Setup & Synchronization
    let lightingTransitionTimeout = null;

    function setupNavbarTubelight() {
        let tubelight = document.getElementById('navbar-tubelight');
        if (!tubelight && header) {
            tubelight = document.createElement('div');
            tubelight.id = 'navbar-tubelight';
            tubelight.className = 'navbar-tubelight';
            tubelight.setAttribute('aria-hidden', 'true');
            tubelight.innerHTML = `
                <div class="tubelight-fixture">
                    <div class="tubelight-rosette tubelight-rosette--left"></div>
                    <div class="tubelight-rosette tubelight-rosette--right"></div>
                    <div class="tubelight-wire tubelight-wire--left"></div>
                    <div class="tubelight-wire tubelight-wire--right"></div>
                    <div class="tubelight-housing">
                        <div class="tubelight-cap tubelight-cap--left"></div>
                        <div class="tubelight-tube">
                            <div class="tubelight-filament"></div>
                            <div class="tubelight-specular"></div>
                        </div>
                        <div class="tubelight-cap tubelight-cap--right"></div>
                    </div>
                </div>
                <div class="tubelight-beam"></div>
                <div class="tubelight-ambient-wash"></div>
            `;
            header.prepend(tubelight);
        }

        const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
        updateTubelight(currentTheme, false);
    }

    function updateTubelight(theme, isUserTriggered = false) {
        const tubelight = document.getElementById('navbar-tubelight');
        if (!tubelight) return;

        if (isUserTriggered) {
            document.documentElement.classList.add('theme-lighting-transition');
            if (lightingTransitionTimeout) clearTimeout(lightingTransitionTimeout);
            lightingTransitionTimeout = setTimeout(() => {
                document.documentElement.classList.remove('theme-lighting-transition');
                lightingTransitionTimeout = null;
            }, 1250);
        }

        if (theme === 'light') {
            tubelight.classList.remove('is-off');
            if (isUserTriggered) {
                tubelight.classList.add('is-igniting');
                setTimeout(() => {
                    tubelight.classList.remove('is-igniting');
                    tubelight.classList.add('is-on');
                }, 540);
            } else {
                tubelight.classList.add('is-on');
            }
        } else {
            tubelight.classList.remove('is-on', 'is-igniting');
            tubelight.classList.add('is-off');
        }
    }

    // 3.1 Global Theme Switcher & UI Sync
    function applyTheme(theme, isUserTriggered = true) {
        document.documentElement.setAttribute('data-theme', theme);
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }

        try {
            localStorage.setItem('foodies_theme', theme);
        } catch (_) {}

        // Update tubelight illumination state
        updateTubelight(theme, isUserTriggered);

        // Update all responsive minimal theme toggle buttons across the page
        document.querySelectorAll('.mobile-theme-toggle').forEach(btn => {
            btn.setAttribute('aria-label', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
            btn.setAttribute('title', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
            const icon = btn.querySelector('ion-icon');
            if (icon) {
                icon.setAttribute('name', theme === 'dark' ? 'sunny-outline' : 'moon-outline');
            }
        });

        window.dispatchEvent(new CustomEvent('foodies:theme-change', { detail: { theme } }));
    }

    function toggleTheme() {
        const current = document.documentElement.getAttribute('data-theme') || 'light';
        const next = current === 'light' ? 'dark' : 'light';
        applyTheme(next, true);

        const hint = document.getElementById('cord-discovery-hint');
        if (hint) {
            hint.classList.add('hidden');
            sessionStorage.setItem('foodies_cord_hint_dismissed', 'true');
        }
    }

    // Initialize tubelight on page mount
    setupNavbarTubelight();

    // 3.2 Setup Header Actions Cluster
    let actionsWrap = header.querySelector('.header-actions-wrap');
    if (!actionsWrap) {
        actionsWrap = document.createElement('div');
        actionsWrap.className = 'header-actions-wrap';
        // Ensure it's a flex item and doesn't interfere with header layout
        actionsWrap.style.display = 'flex';
        actionsWrap.style.alignItems = 'center';
        header.appendChild(actionsWrap);
    }

    // 3.3 Desktop Interactive Hanging Cord Theme Switcher (Umesh Nagare Style)
    // Remove any leftover legacy button in actionsWrap
    const oldToggle = actionsWrap.querySelector('.theme-toggle-btn');
    if (oldToggle) oldToggle.remove();

    // Initialize or retrieve canvas element
    let cordCanvas = document.getElementById('cord-theme-switch');
    if (!cordCanvas) {
        cordCanvas = document.createElement('canvas');
        cordCanvas.id = 'cord-theme-switch';
        cordCanvas.setAttribute('role', 'button');
        cordCanvas.setAttribute('aria-label', 'Pull cord to toggle theme');
        cordCanvas.setAttribute('tabindex', '0');
        document.body.appendChild(cordCanvas);
    }

    // 3.3.1 Desktop Discovery Hint Tooltip
    if (window.innerWidth > 992 && !sessionStorage.getItem('foodies_cord_hint_dismissed')) {
        let hint = document.getElementById('cord-discovery-hint');
        if (!hint) {
            hint = document.createElement('div');
            hint.id = 'cord-discovery-hint';
            hint.className = 'cord-discovery-hint';
            hint.innerHTML = '<span>💡</span> <span>Pull cord to toggle lights</span>';
            hint.addEventListener('click', () => {
                hint.classList.add('hidden');
                sessionStorage.setItem('foodies_cord_hint_dismissed', 'true');
            });
            document.body.appendChild(hint);

            // Auto-hide after 8 seconds
            setTimeout(() => {
                if (hint && !hint.classList.contains('hidden')) {
                    hint.classList.add('hidden');
                    setTimeout(() => hint.remove(), 500);
                }
            }, 8000);
        }
    }

    // 3.3.2 Ensure Ambient Interactive Culinary Canvas is active
    if (!document.getElementById('ambient-culinary-canvas')) {
        const isSubfolder = window.location.pathname.includes('/pages/');
        const scriptPath = isSubfolder ? '../js/ambient-bg.js?v=4.1' : 'js/ambient-bg.js?v=4.1';
        const existingScript = document.querySelector('script[src*="ambient-bg.js"]');
        if (!existingScript) {
            const bgScript = document.createElement('script');
            bgScript.src = scriptPath;
            bgScript.defer = true;
            document.head.appendChild(bgScript);
        }
    }

    class UmeshCordSwitch {
        constructor(canvas) {
            this.canvas = canvas;
            this.ctx = canvas.getContext('2d');
            this.dpr = Math.min(window.devicePixelRatio || 1, 2);

            // Shorter, compact canvas dimensions
            this.width = 120;
            this.height = 150;
            this.canvas.width = this.width * this.dpr;
            this.canvas.height = this.height * this.dpr;
            this.ctx.scale(this.dpr, this.dpr);

            // 8-node short chain anchored at (75, 0)
            this.anchorX = 75;
            this.anchorY = 0;
            this.numNodes = 8;
            this.restLen = 8; // 7 segments * 8px = 56px resting cord length
            this.damping = 0.96;
            this.gravity = 1.15;
            this.constraintIters = 12;

            // Restricted pull range
            this.minPullThreshold = 74; // Must pull down past 74px to trigger toggle on release
            this.maxPullY = 96;          // Hard limit: cord cannot stretch past 96px total

            this.nodes = [];
            for (let i = 0; i < this.numNodes; i++) {
                this.nodes.push({
                    x: this.anchorX,
                    y: this.anchorY + i * this.restLen,
                    oldX: this.anchorX,
                    oldY: this.anchorY + i * this.restLen
                });
            }

            this.isDragging = false;
            this.hasPulledPastThreshold = false;
            this.pointerX = this.anchorX;
            this.pointerY = this.nodes[this.numNodes - 1].y;
            this.startX = this.pointerX;
            this.startY = this.pointerY;
            this.startTime = 0;

            this.isAnimating = false;
            this.rafId = null;

            this.initEvents();
            this.startLoop();
        }

        getBottomNode() {
            return this.nodes[this.numNodes - 1];
        }

        getKnobCenter() {
            const bottom = this.getBottomNode();
            const prev = this.nodes[this.numNodes - 2];
            const angle = Math.atan2(bottom.y - prev.y, bottom.x - prev.x);
            // Center of capsule is 15px along the tangent from the bottom node
            return {
                x: bottom.x + Math.cos(angle) * 15,
                y: bottom.y + Math.sin(angle) * 15
            };
        }

        initEvents() {
            const canvas = this.canvas;

            // Helper to test if a pointer position is near the cord knob (generous touch hit area)
            const isNearKnob = (clientX, clientY) => {
                const rect = canvas.getBoundingClientRect();
                const knob = this.getKnobCenter();
                const screenKnobX = rect.left + knob.x;
                const screenKnobY = rect.top + knob.y;
                const dist = Math.hypot(clientX - screenKnobX, clientY - screenKnobY);
                // 34px radius around knob or along the hanging segment
                return dist < 34 || (Math.abs(clientX - screenKnobX) < 26 && clientY >= rect.top && clientY <= screenKnobY + 22);
            };

            // Global hover / proximity cursor & ambient sway for mouse
            window.addEventListener('pointermove', (e) => {
                if (this.isDragging) return;
                const rect = canvas.getBoundingClientRect();
                const knob = this.getKnobCenter();
                const screenKnobX = rect.left + knob.x;
                const screenKnobY = rect.top + knob.y;
                const dist = Math.hypot(e.clientX - screenKnobX, e.clientY - screenKnobY);

                if (dist < 30) {
                    canvas.style.pointerEvents = 'auto';
                    canvas.style.cursor = 'grab';
                } else {
                    canvas.style.pointerEvents = 'none';

                    // Subtle ambient cord sway when cursor passes closely
                    if (dist < 50) {
                        const mid = this.nodes[3];
                        const screenMidX = rect.left + mid.x;
                        const screenMidY = rect.top + mid.y;
                        const midDist = Math.hypot(e.clientX - screenMidX, e.clientY - screenMidY);
                        if (midDist < 35) {
                            mid.x += (e.movementX || 0) * 0.12;
                            this.wakeUp();
                        }
                    }
                }
            }, { passive: true });

            const startDrag = (e) => {
                const rect = canvas.getBoundingClientRect();
                const clickX = e.clientX - rect.left;
                const clickY = e.clientY - rect.top;

                this.isDragging = true;
                this.hasPulledPastThreshold = false;
                canvas.style.pointerEvents = 'auto';
                canvas.style.cursor = 'grabbing';

                this.startX = clickX;
                this.startY = clickY;
                this.startTime = Date.now();

                this.pointerX = Math.max(this.anchorX - 25, Math.min(this.anchorX + 25, clickX));
                this.pointerY = Math.max(20, Math.min(this.maxPullY, clickY));
                this.wakeUp();
            };

            // 1. Direct canvas pointerdown
            canvas.addEventListener('pointerdown', (e) => {
                e.preventDefault();
                startDrag(e);
                try { canvas.setPointerCapture(e.pointerId); } catch (_) {}
            });

            // 2. Global window pointerdown (Crucial for mobile touch screens where hover does not precede touch)
            window.addEventListener('pointerdown', (e) => {
                if (this.isDragging) return;
                if (isNearKnob(e.clientX, e.clientY)) {
                    e.preventDefault();
                    startDrag(e);
                }
            }, { passive: false });

            // Universal drag tracking on window
            window.addEventListener('pointermove', (e) => {
                if (!this.isDragging) return;
                const rect = canvas.getBoundingClientRect();
                const currentX = e.clientX - rect.left;
                const currentY = e.clientY - rect.top;

                // Restrict pull distance strictly
                this.pointerX = Math.max(this.anchorX - 25, Math.min(this.anchorX + 25, currentX));
                this.pointerY = Math.max(20, Math.min(this.maxPullY, currentY));

                // Mark if pulled past threshold (theme only toggles upon release!)
                if (this.pointerY >= this.minPullThreshold) {
                    this.hasPulledPastThreshold = true;
                }
                this.wakeUp();
            });

            // Universal pointer release (Theme toggles strictly on release)
            const onPointerEnd = () => {
                if (!this.isDragging) return;
                this.isDragging = false;
                canvas.style.cursor = 'grab';

                const elapsed = Date.now() - this.startTime;
                const distMoved = Math.hypot(this.pointerX - this.startX, this.pointerY - this.startY);

                // Change modes ONLY when the toggle wire is released
                if (this.hasPulledPastThreshold || (elapsed < 350 && distMoved < 12)) {
                    this.toggleTheme();
                    // Subtle release rebound bounce
                    this.nodes[this.numNodes - 1].y += 18;
                }

                this.hasPulledPastThreshold = false;
                this.wakeUp();
            };

            window.addEventListener('pointerup', onPointerEnd);
            window.addEventListener('pointercancel', onPointerEnd);

            // Dynamic DPI resize listener for mobile orientation change & browser resize
            window.addEventListener('resize', () => {
                const newDpr = Math.min(window.devicePixelRatio || 1, 2);
                if (newDpr !== this.dpr) {
                    this.dpr = newDpr;
                    this.canvas.width = this.width * this.dpr;
                    this.canvas.height = this.height * this.dpr;
                    this.ctx.scale(this.dpr, this.dpr);
                }
                this.wakeUp();
            }, { passive: true });

            // Keyboard accessibility (Enter / Space)
            canvas.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.toggleTheme();
                    this.nodes[this.numNodes - 1].y += 20;
                    this.wakeUp();
                }
            });
        }

        // Silent and minimal toggle (no sounds, no quotes/toasts)
        toggleTheme() {
            toggleTheme();
        }

        updatePhysics() {
            const nodes = this.nodes;

            // 1. Verlet position update for dynamic nodes
            for (let i = 1; i < this.numNodes; i++) {
                if (i === this.numNodes - 1 && this.isDragging) {
                    nodes[i].oldX = nodes[i].x;
                    nodes[i].oldY = nodes[i].y;
                    nodes[i].x = this.pointerX;
                    nodes[i].y = this.pointerY;
                    continue;
                }

                const vx = (nodes[i].x - nodes[i].oldX) * this.damping;
                const vy = (nodes[i].y - nodes[i].oldY) * this.damping + this.gravity;

                nodes[i].oldX = nodes[i].x;
                nodes[i].oldY = nodes[i].y;

                nodes[i].x += vx;
                nodes[i].y += vy;
            }

            // 2. Relaxation constraints (maintain segment distance)
            for (let iter = 0; iter < this.constraintIters; iter++) {
                nodes[0].x = this.anchorX;
                nodes[0].y = this.anchorY;

                for (let i = 0; i < this.numNodes - 1; i++) {
                    const n1 = nodes[i];
                    const n2 = nodes[i + 1];

                    const dx = n2.x - n1.x;
                    const dy = n2.y - n1.y;
                    const dist = Math.hypot(dx, dy) || 0.001;
                    const diff = (dist - this.restLen) / dist;

                    if (i === 0) {
                        if (!(i + 1 === this.numNodes - 1 && this.isDragging)) {
                            n2.x -= dx * diff;
                            n2.y -= dy * diff;
                        }
                    } else if (i + 1 === this.numNodes - 1 && this.isDragging) {
                        n1.x += dx * diff;
                        n1.y += dy * diff;
                    } else {
                        n1.x += dx * diff * 0.5;
                        n1.y += dy * diff * 0.5;
                        n2.x -= dx * diff * 0.5;
                        n2.y -= dy * diff * 0.5;
                    }
                }
            }

            // 3. Elastic restoring force when released beyond resting length
            if (!this.isDragging) {
                const bottom = nodes[this.numNodes - 1];
                const totalDist = Math.hypot(bottom.x - this.anchorX, bottom.y - this.anchorY);
                const maxRest = (this.numNodes - 1) * this.restLen;
                if (totalDist > maxRest) {
                    const pull = (totalDist - maxRest) * 0.28;
                    const angle = Math.atan2(this.anchorY - bottom.y, this.anchorX - bottom.x);
                    bottom.x += Math.cos(angle) * pull;
                    bottom.y += Math.sin(angle) * pull;
                }
            }
        }

        draw() {
            const ctx = this.ctx;
            ctx.clearRect(0, 0, this.width, this.height);

            const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
            const nodes = this.nodes;

            // 1. Draw connecting brass thread along the spine
            ctx.beginPath();
            ctx.moveTo(nodes[0].x, nodes[0].y);
            for (let i = 1; i < this.numNodes - 1; i++) {
                const midX = (nodes[i].x + nodes[i + 1].x) / 2;
                const midY = (nodes[i].y + nodes[i + 1].y) / 2;
                ctx.quadraticCurveTo(nodes[i].x, nodes[i].y, midX, midY);
            }
            ctx.lineTo(nodes[this.numNodes - 1].x, nodes[this.numNodes - 1].y);
            ctx.strokeStyle = '#705018';
            ctx.lineWidth = 1.0;
            ctx.stroke();

            // 2. Draw Antique Beaded Brass Pull Chain Links
            for (let i = 0; i < this.numNodes - 1; i++) {
                const n1 = nodes[i];
                const n2 = nodes[i + 1];
                const dx = n2.x - n1.x;
                const dy = n2.y - n1.y;
                const segLen = Math.hypot(dx, dy);
                const steps = Math.max(1, Math.round(segLen / 7.2));

                for (let s = 0; s < steps; s++) {
                    const t = s / steps;
                    const bx = n1.x + dx * t;
                    const by = n1.y + dy * t;

                    // Metallic spherical brass bead with specular highlight
                    const beadGrad = ctx.createRadialGradient(bx - 0.7, by - 0.7, 0.4, bx, by, 2.4);
                    beadGrad.addColorStop(0, '#FFF5D6');
                    beadGrad.addColorStop(0.35, '#E5C068');
                    beadGrad.addColorStop(0.75, '#A67C1E');
                    beadGrad.addColorStop(1, '#4A3515');

                    ctx.beginPath();
                    ctx.arc(bx, by, 2.2, 0, Math.PI * 2);
                    ctx.fillStyle = beadGrad;
                    ctx.fill();
                }
            }

            // 3. Antique Brass Ceiling Escutcheon Mount
            const escutcheonGrad = ctx.createRadialGradient(this.anchorX, 1, 0.5, this.anchorX, 1, 5);
            escutcheonGrad.addColorStop(0, '#F7E7A9');
            escutcheonGrad.addColorStop(0.5, '#C5A059');
            escutcheonGrad.addColorStop(1, '#3D2A0A');

            ctx.beginPath();
            ctx.ellipse(this.anchorX, 1.2, 4.5, 2.2, 0, 0, Math.PI * 2);
            ctx.fillStyle = escutcheonGrad;
            ctx.fill();

            // 4. "Old Money" Heirloom Brass Acorn / Bell Pull Fob
            const bottom = nodes[this.numNodes - 1];
            const prev = nodes[this.numNodes - 2];
            const angle = Math.atan2(bottom.y - prev.y, bottom.x - prev.x) - Math.PI / 2;

            ctx.save();
            ctx.translate(bottom.x, bottom.y);
            ctx.rotate(angle);

            // Fob drop shadow
            ctx.shadowColor = isDark ? 'rgba(0, 0, 0, 0.65)' : 'rgba(45, 30, 15, 0.35)';
            ctx.shadowBlur = 7;
            ctx.shadowOffsetY = 3;

            // Rich 3D burnished antique brass gradient
            const brassGrad = ctx.createLinearGradient(-8, 0, 8, 0);
            brassGrad.addColorStop(0, '#3A2708');    // Deep patinated shadow
            brassGrad.addColorStop(0.18, '#705018'); // Antique brass mid-tone
            brassGrad.addColorStop(0.38, '#D4AF37'); // Rich golden body
            brassGrad.addColorStop(0.54, '#FFF8DC'); // Bright specular reflection
            brassGrad.addColorStop(0.72, '#D4AF37'); // Rich golden body
            brassGrad.addColorStop(0.88, '#8C6D37'); // Soft reflected warmth
            brassGrad.addColorStop(1, '#3A2708');    // Deep outer rim shadow

            // Top Mounting Collar / Ferrule
            ctx.beginPath();
            if (ctx.roundRect) {
                ctx.roundRect(-4, 0, 8, 4, 1);
            } else {
                ctx.rect(-4, 0, 8, 4);
            }
            ctx.fillStyle = brassGrad;
            ctx.fill();

            // Main Acorn / Bell Body contour
            ctx.beginPath();
            ctx.moveTo(-3, 4);
            ctx.bezierCurveTo(-3.5, 8, -7.5, 12, -7.5, 16.5);
            ctx.bezierCurveTo(-7.5, 22, -4.5, 25.5, -2, 26.5);
            ctx.lineTo(2, 26.5);
            ctx.bezierCurveTo(4.5, 25.5, 7.5, 22, 7.5, 16.5);
            ctx.bezierCurveTo(7.5, 12, 3.5, 8, 3, 4);
            ctx.closePath();
            ctx.fillStyle = brassGrad;
            ctx.fill();

            // Reset shadow for fine filigree details
            ctx.shadowColor = 'transparent';

            // Engraved decorative knurling ring across waist
            ctx.beginPath();
            ctx.moveTo(-7.2, 16);
            ctx.lineTo(7.2, 16);
            ctx.strokeStyle = 'rgba(61, 42, 10, 0.65)';
            ctx.lineWidth = 1;
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(-7.2, 17.5);
            ctx.lineTo(7.2, 17.5);
            ctx.strokeStyle = 'rgba(255, 248, 220, 0.55)';
            ctx.lineWidth = 0.8;
            ctx.stroke();

            // Bottom Finial Bead
            const finialGrad = ctx.createRadialGradient(-0.8, 28, 0.5, 0, 29, 2.8);
            finialGrad.addColorStop(0, '#FFF8DC');
            finialGrad.addColorStop(0.4, '#D4AF37');
            finialGrad.addColorStop(1, '#3D2A0A');

            ctx.beginPath();
            ctx.arc(0, 29.2, 2.6, 0, Math.PI * 2);
            ctx.fillStyle = finialGrad;
            ctx.fill();

            ctx.restore();
        }

        checkMotion() {
            let totalVelocity = 0;
            for (let i = 1; i < this.numNodes; i++) {
                totalVelocity += Math.hypot(this.nodes[i].x - this.nodes[i].oldX, this.nodes[i].y - this.nodes[i].oldY);
            }
            return totalVelocity;
        }

        loop() {
            this.updatePhysics();
            this.draw();

            const motion = this.checkMotion();
            if (motion < 0.04 && !this.isDragging) {
                this.isAnimating = false;
                this.rafId = null;
            } else {
                this.rafId = requestAnimationFrame(() => this.loop());
            }
        }

        wakeUp() {
            if (!this.isAnimating) {
                this.isAnimating = true;
                this.loop();
            }
        }

        startLoop() {
            this.isAnimating = true;
            this.loop();
        }
    }

    // Instantiate UmeshCordSwitch once DOM is ready
    window.__umeshCordSwitch = new UmeshCordSwitch(cordCanvas);

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

    // 3.4 Minimal Responsive Theme Toggle Button (for mobile/tablet <= 992px)
    let mobileToggle = actionsWrap.querySelector('.mobile-theme-toggle.header-theme-toggle');
    if (!mobileToggle) {
        mobileToggle = document.createElement('button');
        mobileToggle.className = 'mobile-theme-toggle header-theme-toggle';
        mobileToggle.type = 'button';
        const curTheme = document.documentElement.getAttribute('data-theme') || 'light';
        mobileToggle.setAttribute('aria-label', curTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
        mobileToggle.setAttribute('title', curTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
        mobileToggle.innerHTML = `<ion-icon name="${curTheme === 'dark' ? 'sunny-outline' : 'moon-outline'}"></ion-icon>`;
        mobileToggle.addEventListener('click', (e) => {
            e.preventDefault();
            toggleTheme();
        });
        actionsWrap.appendChild(mobileToggle);
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
        const curTheme = document.documentElement.getAttribute('data-theme') || 'light';
        drawerHeader.innerHTML = `
            <div class="drawer-brand-wrap">
                <span class="drawer-brand-title">Foodies Goodies</span>
                <span class="drawer-brand-sub">Culinary Guide</span>
            </div>
            <div style="display: flex; align-items: center; gap: 8px;">
                <button type="button" class="mobile-theme-toggle drawer-theme-btn" aria-label="${curTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}" title="${curTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}" style="display: inline-flex !important;">
                    <ion-icon name="${curTheme === 'dark' ? 'sunny-outline' : 'moon-outline'}"></ion-icon>
                </button>
                <button type="button" class="drawer-close-btn" aria-label="Close mobile navigation">
                    <span aria-hidden="true">&times;</span>
                </button>
            </div>
        `;
        navbar.prepend(drawerHeader);

        const drawerThemeBtn = drawerHeader.querySelector('.drawer-theme-btn');
        if (drawerThemeBtn) {
            drawerThemeBtn.addEventListener('click', (e) => {
                e.preventDefault();
                toggleTheme();
            });
        }
    }

    // Initialize/sync all mobile toggle buttons with the current theme
    const activeTheme = document.documentElement.getAttribute('data-theme') || localStorage.getItem('foodies_theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    applyTheme(activeTheme);

    // 3.5 Dynamic Header Layout Sync (centers navbar elements to the web page on desktop)
    function syncHeaderLayout() {
        if (!navbar || !actionsWrap) return;
        const isMobile = window.innerWidth <= 992;

        const authTarget = navbar.querySelector('.user-dropdown-wrapper') ||
                           navbar.querySelector('.nav-login-btn') ||
                           actionsWrap.querySelector('.user-dropdown-wrapper') ||
                           actionsWrap.querySelector('.nav-login-btn');

        if (!authTarget) return;

        if (isMobile) {
            // Mobile: keep inside slide-out drawer so user can access login/profile from menu
            if (authTarget.parentElement !== navbar) {
                navbar.appendChild(authTarget);
            }
        } else {
            // Desktop: keep in actionsWrap on the right side of header,
            // so navbar navigation elements remain perfectly center-aligned to the web page
            if (authTarget.parentElement !== actionsWrap) {
                const firstMobileControl = actionsWrap.querySelector('.mobile-theme-toggle, .nav-toggle');
                if (firstMobileControl) {
                    actionsWrap.insertBefore(authTarget, firstMobileControl);
                } else {
                    actionsWrap.appendChild(authTarget);
                }
            }
        }
    }

    syncHeaderLayout();
    window.addEventListener('resize', syncHeaderLayout, { passive: true });
    window.addEventListener('foodies:auth-badge-rendered', syncHeaderLayout);

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