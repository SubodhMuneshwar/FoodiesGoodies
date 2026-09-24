/**
 * FoodiesGoodies - Ambient Interactive Culinary Canvas Engine
 * Creates living interactive background elements:
 * - Floating golden aroma embers, champagne bubbles & culinary stardust
 * - Fluid cursor magnetism & magnetic particle repulsion
 * - Dynamic cursor stardust wake trail
 * - Click/Tap celebratory micro-sparkle bursts
 * - Seamless Light/Dark theme synchronization
 * - High-DPI support, zero layout interference, automatic battery/visibility pausing
 */

class AmbientCulinaryEngine {
    constructor(canvas, prefersReducedMotion) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d', { alpha: true });
        this.prefersReducedMotion = prefersReducedMotion;
        this.particles = [];
        this.bokehOrbs = [];
        this.cursorTrails = [];
        this.burstParticles = [];

        this.mouse = {
            x: -9999,
            y: -9999,
            prevX: -9999,
            prevY: -9999,
            speed: 0,
            active: false
        };

        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.dpr = Math.min(window.devicePixelRatio || 1, 2);
        this.isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        this.isRunning = true;
        this.lastTime = performance.now();

        this.initResize();
        this.initThemeListener();
        this.initParticles();
        this.initInteractions();
        this.loop(this.lastTime);
    }

    initResize() {
        const resize = () => {
            this.width = window.innerWidth;
            this.height = window.innerHeight;
            this.dpr = Math.min(window.devicePixelRatio || 1, 2);

            this.canvas.width = this.width * this.dpr;
            this.canvas.height = this.height * this.dpr;
            this.ctx.scale(this.dpr, this.dpr);

            // Re-seed particles to fit new dimensions
            this.initParticles();
        };

        window.addEventListener('resize', resize, { passive: true });
        resize();
    }

    initThemeListener() {
        const updateTheme = () => {
            const dark = document.documentElement.getAttribute('data-theme') === 'dark';
            if (this.isDark !== dark) {
                this.isDark = dark;
                this.updateParticleColors();
            }
        };

        window.addEventListener('foodies:theme-change', (e) => {
            if (e.detail && e.detail.theme) {
                this.isDark = e.detail.theme === 'dark';
                this.updateParticleColors();
            }
        });

        const observer = new MutationObserver(updateTheme);
        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['data-theme', 'class']
        });

        // Pause animation when tab is not visible to preserve GPU & battery
        document.addEventListener('visibilitychange', () => {
            this.isRunning = !document.hidden;
            if (this.isRunning) {
                this.lastTime = performance.now();
                requestAnimationFrame((t) => this.loop(t));
            }
        });
    }

    getColorPalettes() {
        if (this.isDark) {
            // Luminous golden embers, paprika & warm saffron glow
            return {
                orbs: [
                    { r: 217, g: 119, b: 6, a: 0.14 },   // Warm amber
                    { r: 194, g: 112, b: 58, a: 0.11 },  // Terracotta
                    { r: 245, g: 158, b: 11, a: 0.09 }   // Golden saffron
                ],
                particles: [
                    'rgba(251, 191, 36, 0.80)',  // Warm Gold
                    'rgba(245, 158, 11, 0.70)',  // Amber Ember
                    'rgba(217, 119, 6, 0.60)',   // Saffron
                    'rgba(253, 230, 138, 0.90)', // Champagne spark
                    'rgba(194, 112, 58, 0.65)'   // Terracotta warmth
                ],
                wake: 'rgba(251, 191, 36, ',
                ring: 'rgba(245, 158, 11, 0.45)'
            };
        } else {
            // Warm delicate champagne, soft terracotta & honey peach
            return {
                orbs: [
                    { r: 194, g: 112, b: 58, a: 0.07 },  // Terracotta soft
                    { r: 231, g: 162, b: 110, a: 0.06 }, // Warm Peach
                    { r: 95, g: 111, b: 82, a: 0.04 }    // Sage hint
                ],
                particles: [
                    'rgba(194, 112, 58, 0.42)',  // Terracotta
                    'rgba(217, 134, 78, 0.36)',  // Honey Terracotta
                    'rgba(168, 90, 42, 0.32)',   // Deep Cinnamon
                    'rgba(225, 160, 110, 0.48)', // Peach Champagne
                    'rgba(95, 111, 82, 0.26)'    // Herb Sage
                ],
                wake: 'rgba(194, 112, 58, ',
                ring: 'rgba(194, 112, 58, 0.32)'
            };
        }
    }

    initParticles() {
        const isMobile = this.width < 768;
        const count = this.prefersReducedMotion ? 12 : (isMobile ? 28 : 60);
        const palette = this.getColorPalettes();

        this.particles = [];
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x: Math.random() * this.width,
                y: Math.random() * this.height,
                radius: Math.random() * 3.2 + 1.2,
                baseRadius: Math.random() * 3.2 + 1.2,
                color: palette.particles[Math.floor(Math.random() * palette.particles.length)],
                vx: (Math.random() - 0.5) * 0.45,
                vy: (Math.random() * -0.5) - 0.18, // Gentle upward drifting motion
                pulse: Math.random() * Math.PI * 2,
                pulseSpeed: 0.02 + Math.random() * 0.02,
                isStar: Math.random() > 0.82, // Stylized star particles
                starAngle: Math.random() * Math.PI,
                starRotSpeed: (Math.random() - 0.5) * 0.025
            });
        }

        // Ambient large bokeh orbs that drift gently in the background
        const orbCount = isMobile ? 3 : 5;
        this.bokehOrbs = [];
        for (let i = 0; i < orbCount; i++) {
            const orbColor = palette.orbs[i % palette.orbs.length];
            this.bokehOrbs.push({
                x: Math.random() * this.width,
                y: Math.random() * this.height,
                radius: (Math.random() * 120 + 90) * (isMobile ? 0.7 : 1),
                vx: (Math.random() - 0.5) * 0.25,
                vy: (Math.random() - 0.5) * 0.25,
                color: orbColor
            });
        }
    }

    updateParticleColors() {
        const palette = this.getColorPalettes();
        this.particles.forEach(p => {
            p.color = palette.particles[Math.floor(Math.random() * palette.particles.length)];
        });
        this.bokehOrbs.forEach((orb, i) => {
            orb.color = palette.orbs[i % palette.orbs.length];
        });
    }

    initInteractions() {
        // Track mouse position and velocity
        window.addEventListener('pointermove', (e) => {
            const prevX = this.mouse.x;
            const prevY = this.mouse.y;
            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;
            this.mouse.active = true;

            const dx = this.mouse.x - prevX;
            const dy = this.mouse.y - prevY;
            this.mouse.speed = Math.hypot(dx, dy);

            // Add stardust wake trail if moving
            if (this.mouse.speed > 2.5 && !this.prefersReducedMotion) {
                const palette = this.getColorPalettes();
                this.cursorTrails.push({
                    x: this.mouse.x + (Math.random() - 0.5) * 16,
                    y: this.mouse.y + (Math.random() - 0.5) * 16,
                    radius: Math.random() * 2.8 + 1.2,
                    alpha: 0.85,
                    decay: 0.032 + Math.random() * 0.02,
                    vx: (Math.random() - 0.5) * 0.9,
                    vy: (Math.random() - 0.5) * 0.9,
                    colorBase: palette.wake
                });

                // Cap trail length
                if (this.cursorTrails.length > 40) {
                    this.cursorTrails.shift();
                }
            }
        }, { passive: true });

        // Pointer leave window
        document.addEventListener('mouseleave', () => {
            this.mouse.active = false;
            this.mouse.x = -9999;
            this.mouse.y = -9999;
        });

        // Click / Tap celebratory micro-sparkle burst
        window.addEventListener('pointerdown', (e) => {
            if (this.prefersReducedMotion) return;
            // Spawn 14-18 micro-burst sparkles radiating outward
            const palette = this.getColorPalettes();
            const sparkCount = 16;
            for (let i = 0; i < sparkCount; i++) {
                const angle = (Math.PI * 2 / sparkCount) * i + (Math.random() * 0.35);
                const speed = 2.2 + Math.random() * 3.8;
                this.burstParticles.push({
                    x: e.clientX,
                    y: e.clientY,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    radius: Math.random() * 3.0 + 1.2,
                    alpha: 0.98,
                    decay: 0.028 + Math.random() * 0.02,
                    color: palette.particles[i % palette.particles.length]
                });
            }
        }, { passive: true });
    }

    loop(timestamp) {
        if (!this.isRunning) return;

        const dt = Math.min((timestamp - this.lastTime) / 1000, 0.1);
        this.lastTime = timestamp;

        this.ctx.clearRect(0, 0, this.width, this.height);

        // 1. Render Large Ambient Bokeh Aroma Orbs
        this.drawBokehOrbs(dt);

        // 2. Render Floating Culinary Stardust Particles
        this.drawParticles(dt);

        // 3. Render Cursor Stardust Wake
        this.drawCursorWake(dt);

        // 4. Render Click/Tap Bursts
        this.drawBurstParticles(dt);

        requestAnimationFrame((t) => this.loop(t));
    }

    drawBokehOrbs(dt) {
        for (let i = 0; i < this.bokehOrbs.length; i++) {
            const orb = this.bokehOrbs[i];

            if (!this.prefersReducedMotion) {
                orb.x += orb.vx * 60 * dt;
                orb.y += orb.vy * 60 * dt;

                // Bounce off edges gently
                if (orb.x < -orb.radius) orb.x = this.width + orb.radius;
                if (orb.x > this.width + orb.radius) orb.x = -orb.radius;
                if (orb.y < -orb.radius) orb.y = this.height + orb.radius;
                if (orb.y > this.height + orb.radius) orb.y = -orb.radius;
            }

            const grad = this.ctx.createRadialGradient(
                orb.x, orb.y, 0,
                orb.x, orb.y, orb.radius
            );
            const { r, g, b, a } = orb.color;
            grad.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${a})`);
            grad.addColorStop(0.65, `rgba(${r}, ${g}, ${b}, ${a * 0.4})`);
            grad.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);

            this.ctx.fillStyle = grad;
            this.ctx.beginPath();
            this.ctx.arc(orb.x, orb.y, orb.radius, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }

    drawParticles(dt) {
        const mouseX = this.mouse.x;
        const mouseY = this.mouse.y;
        const interactionRadius = 140;

        for (let i = 0; i < this.particles.length; i++) {
            const p = this.particles[i];

            if (!this.prefersReducedMotion) {
                // Natural upward drift and gentle horizontal wave
                p.x += p.vx * 60 * dt;
                p.y += p.vy * 60 * dt;

                // Pulsating brightness/size
                p.pulse += p.pulseSpeed;
                p.radius = p.baseRadius + Math.sin(p.pulse) * 0.7;

                // Cursor magnetic repulsion & swirling
                if (this.mouse.active) {
                    const dx = p.x - mouseX;
                    const dy = p.y - mouseY;
                    const dist = Math.hypot(dx, dy);

                    if (dist < interactionRadius && dist > 1) {
                        const force = (interactionRadius - dist) / interactionRadius;
                        const angle = Math.atan2(dy, dx);
                        // Repel with slight tangential swirl
                        const pushX = Math.cos(angle) * force * 3.8;
                        const pushY = Math.sin(angle) * force * 3.8;
                        p.x += pushX;
                        p.y += pushY;
                    }
                }

                // Wrap-around boundaries
                if (p.y < -10) {
                    p.y = this.height + 10;
                    p.x = Math.random() * this.width;
                }
                if (p.x < -10) p.x = this.width + 10;
                if (p.x > this.width + 10) p.x = -10;
            }

            // Draw particle
            if (p.isStar) {
                this.drawStar(p.x, p.y, p.radius * 1.6, p.starAngle, p.color);
                p.starAngle += p.starRotSpeed;
            } else {
                this.ctx.beginPath();
                this.ctx.arc(p.x, p.y, Math.max(0.5, p.radius), 0, Math.PI * 2);
                this.ctx.fillStyle = p.color;
                this.ctx.fill();
            }
        }
    }

    drawStar(cx, cy, r, angle, color) {
        this.ctx.save();
        this.ctx.translate(cx, cy);
        this.ctx.rotate(angle);
        this.ctx.fillStyle = color;
        this.ctx.beginPath();

        // 4-point culinary twinkle star
        for (let i = 0; i < 4; i++) {
            const rot = (Math.PI / 2) * i;
            this.ctx.lineTo(Math.cos(rot) * r, Math.sin(rot) * r);
            const halfRot = rot + Math.PI / 4;
            this.ctx.lineTo(Math.cos(halfRot) * (r * 0.32), Math.sin(halfRot) * (r * 0.32));
        }

        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.restore();
    }

    drawCursorWake(dt) {
        for (let i = this.cursorTrails.length - 1; i >= 0; i--) {
            const trail = this.cursorTrails[i];
            trail.alpha -= trail.decay;
            trail.x += trail.vx;
            trail.y += trail.vy;

            if (trail.alpha <= 0) {
                this.cursorTrails.splice(i, 1);
                continue;
            }

            this.ctx.beginPath();
            this.ctx.arc(trail.x, trail.y, trail.radius, 0, Math.PI * 2);
            this.ctx.fillStyle = `${trail.colorBase}${trail.alpha.toFixed(2)})`;
            this.ctx.fill();
        }
    }

    drawBurstParticles(dt) {
        for (let i = this.burstParticles.length - 1; i >= 0; i--) {
            const burst = this.burstParticles[i];
            burst.x += burst.vx * 60 * dt;
            burst.y += burst.vy * 60 * dt;
            burst.vx *= 0.94; // damping
            burst.vy *= 0.94;
            burst.alpha -= burst.decay;

            if (burst.alpha <= 0) {
                this.burstParticles.splice(i, 1);
                continue;
            }

            this.ctx.save();
            this.ctx.globalAlpha = Math.max(0, burst.alpha);
            this.ctx.beginPath();
            this.ctx.arc(burst.x, burst.y, burst.radius, 0, Math.PI * 2);
            this.ctx.fillStyle = burst.color;
            this.ctx.fill();
            this.ctx.restore();
        }
    }
}

// Global initialization after class declaration
(function initAmbientCulinaryBackground() {
    if (typeof window === 'undefined') return;

    // Check user accessibility preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function mountCanvas() {
        if (document.getElementById('ambient-culinary-canvas')) return;

        const canvas = document.createElement('canvas');
        canvas.id = 'ambient-culinary-canvas';
        canvas.setAttribute('aria-hidden', 'true');
        canvas.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            pointer-events: none;
            z-index: 0;
            opacity: 1;
            transition: opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1);
        `;

        document.body.prepend(canvas);
        new AmbientCulinaryEngine(canvas, prefersReducedMotion);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', mountCanvas);
    } else {
        mountCanvas();
    }
})();
