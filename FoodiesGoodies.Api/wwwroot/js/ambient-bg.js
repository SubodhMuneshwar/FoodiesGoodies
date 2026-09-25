/**
 * FoodiesGoodies - Minimal Culinary Food Elements Ambient Canvas Engine
 * 
 * Interactive background featuring stylized minimal culinary icons:
 * - Vegetables: Carrot, Avocado, Cherry Tomato
 * - Fruits: Citrus / Lemon Slice, Apple, Twin Cherries
 * - Comfort Classics: Pizza Slice, Gourmet Burger
 * - Bakery & Botanicals: Flaky Croissant, Fresh Herb Leaf
 * 
 * Interactivity:
 * - Gentle thermal floating drift with organic pendulum sway
 * - Proximity interaction: nearby cursor creates a soft thermal waft, slight scale lift, and gentle tilt
 * - Tap / Click: gentle playful food bobble / wobble spin without distracting visual clutter
 * - Fully responsive across mobile, tablet, and 4K desktop screens
 * - Subtle, elegant opacity that enhances the recipe journal aesthetic without taking attention away from text
 * - Dynamic Light / Dark theme palette synchronization
 * - High-DPI support, battery-saving visibility pausing, and prefers-reduced-motion accessibility
 */

class AmbientCulinaryEngine {
    constructor(canvas, prefersReducedMotion) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d', { alpha: true });
        this.prefersReducedMotion = prefersReducedMotion;
        this.items = [];

        this.mouse = {
            x: -9999,
            y: -9999,
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
        this.initItems();
        this.initInteractions();

        if (!this.prefersReducedMotion) {
            this.loop(this.lastTime);
        } else {
            this.renderStatic();
        }
    }

    initResize() {
        let resizeTimer = null;
        const onResize = () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                this.width = window.innerWidth;
                this.height = window.innerHeight;
                this.dpr = Math.min(window.devicePixelRatio || 1, 2);

                this.canvas.width = this.width * this.dpr;
                this.canvas.height = this.height * this.dpr;
                this.ctx.setTransform(1, 0, 0, 1, 0, 0);
                this.ctx.scale(this.dpr, this.dpr);

                this.initItems();
                if (this.prefersReducedMotion) {
                    this.renderStatic();
                }
            }, 120);
        };

        window.addEventListener('resize', onResize, { passive: true });

        // Initial setup
        this.canvas.width = this.width * this.dpr;
        this.canvas.height = this.height * this.dpr;
        this.ctx.scale(this.dpr, this.dpr);
    }

    initThemeListener() {
        const updateTheme = () => {
            const dark = document.documentElement.getAttribute('data-theme') === 'dark';
            if (this.isDark !== dark) {
                this.isDark = dark;
                this.updateItemColors();
                if (this.prefersReducedMotion) {
                    this.renderStatic();
                }
            }
        };

        window.addEventListener('foodies:theme-change', (e) => {
            if (e.detail && e.detail.theme) {
                this.isDark = e.detail.theme === 'dark';
                this.updateItemColors();
                if (this.prefersReducedMotion) {
                    this.renderStatic();
                }
            }
        });

        const observer = new MutationObserver(updateTheme);
        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['data-theme', 'class']
        });

        // Pause rendering when tab is hidden to conserve system resources
        document.addEventListener('visibilitychange', () => {
            this.isRunning = !document.hidden;
            if (this.isRunning && !this.prefersReducedMotion) {
                this.lastTime = performance.now();
                requestAnimationFrame((t) => this.loop(t));
            }
        });
    }

    getPalettes() {
        if (this.isDark) {
            // Dark Bistro theme
            return {
                terracotta: 'rgba(226, 126, 88, ',  // Pizza, tomato, cherries
                gold: 'rgba(238, 178, 72, ',        // Burger, croissant, citrus
                sage: 'rgba(128, 172, 124, ',       // Avocado, herbs
                nutmeg: 'rgba(188, 134, 98, ',      // Patty, apple stem
                orange: 'rgba(232, 138, 70, '       // Carrot, citrus
            };
        } else {
            // Light Cream Editorial theme
            return {
                terracotta: 'rgba(196, 92, 60, ',   // Pizza, tomato, cherries
                gold: 'rgba(206, 142, 38, ',        // Burger, croissant, citrus
                sage: 'rgba(92, 126, 88, ',         // Avocado, herbs
                nutmeg: 'rgba(152, 102, 70, ',      // Patty, apple stem
                orange: 'rgba(214, 116, 52, '       // Carrot, citrus
            };
        }
    }

    initItems() {
        // Responsive item count: 22-26 on desktop, 16 on tablet, 10-12 on mobile
        let count = 22;
        if (this.width < 768) {
            count = 11;
        } else if (this.width < 1024) {
            count = 16;
        }

        const palettes = this.getPalettes();
        this.items = [];

        // 10 Food types:
        // 0: Pizza Slice
        // 1: Burger
        // 2: Carrot
        // 3: Avocado
        // 4: Cherry Tomato
        // 5: Citrus / Lemon Slice
        // 6: Apple
        // 7: Twin Cherries
        // 8: Croissant
        // 9: Herb Leaf
        const foodTypes = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

        for (let i = 0; i < count; i++) {
            const type = foodTypes[i % foodTypes.length];
            const item = this.createItem(type, palettes, true);
            this.items.push(item);
        }
    }

    createItem(type, palettes, initialScatter = false) {
        const isMobile = this.width < 768;
        const isTablet = this.width >= 768 && this.width < 1024;
        
        const x = Math.random() * this.width;
        const y = initialScatter ? Math.random() * this.height : this.height + 40 + Math.random() * 40;

        // Responsive size scaling
        let baseSize = isMobile ? 16 : (isTablet ? 20 : 25);
        let sizeVariance = isMobile ? 4 : 7;
        const size = baseSize + Math.random() * sizeVariance;

        let colorKey = 'terracotta';
        switch (type) {
            case 0: colorKey = 'terracotta'; break; // Pizza
            case 1: colorKey = 'gold'; break;       // Burger
            case 2: colorKey = 'orange'; break;     // Carrot
            case 3: colorKey = 'sage'; break;       // Avocado
            case 4: colorKey = 'terracotta'; break; // Tomato
            case 5: colorKey = 'gold'; break;       // Citrus
            case 6: colorKey = 'terracotta'; break; // Apple
            case 7: colorKey = 'terracotta'; break; // Cherries
            case 8: colorKey = 'gold'; break;       // Croissant
            case 9: colorKey = 'sage'; break;       // Herb Leaf
        }

        const baseAlpha = this.isDark ? (0.10 + Math.random() * 0.06) : (0.08 + Math.random() * 0.05);
        const baseVy = -0.16 - Math.random() * 0.16; // Gentle thermal rise

        return {
            type,
            x,
            y,
            size,
            colorKey,
            colorPrefix: palettes[colorKey],
            nutmegPrefix: palettes.nutmeg,
            alpha: baseAlpha,
            baseAlpha,
            targetAlpha: baseAlpha,
            scale: 1.0,
            targetScale: 1.0,
            vx: 0,
            vy: baseVy,
            baseVy,
            angle: Math.random() * Math.PI * 2,
            rotSpeed: (Math.random() - 0.5) * 0.005,
            wobble: Math.random() * Math.PI * 2,
            wobbleSpeed: 0.014 + Math.random() * 0.012,
            wobbleWidth: 0.22 + Math.random() * 0.28,
            interactiveSpin: 0
        };
    }

    updateItemColors() {
        const palettes = this.getPalettes();
        this.items.forEach(item => {
            item.colorPrefix = palettes[item.colorKey];
            item.nutmegPrefix = palettes.nutmeg;
            item.baseAlpha = this.isDark ? 0.12 : 0.09;
            item.alpha = item.baseAlpha;
            item.targetAlpha = item.baseAlpha;
        });
    }

    initInteractions() {
        // Track pointer position softly
        window.addEventListener('pointermove', (e) => {
            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;
            this.mouse.active = true;
        }, { passive: true });

        document.addEventListener('mouseleave', () => {
            this.mouse.active = false;
            this.mouse.x = -9999;
            this.mouse.y = -9999;
        });

        // Gentle interactive tap/click bobble for food elements near click point
        window.addEventListener('pointerdown', (e) => {
            if (this.prefersReducedMotion) return;

            const clickX = e.clientX;
            const clickY = e.clientY;
            const clickRadius = 90;

            for (let i = 0; i < this.items.length; i++) {
                const item = this.items[i];
                const dx = item.x - clickX;
                const dy = item.y - clickY;
                const dist = Math.hypot(dx, dy);

                if (dist < clickRadius) {
                    // Tactile culinary bobble
                    item.scale = 1.22;
                    item.vy -= 0.6; // Gentle buoyant hop
                    item.interactiveSpin = (Math.random() > 0.5 ? 1 : -1) * 0.08;
                    item.wobbleSpeed += 0.03;
                }
            }
        }, { passive: true });
    }

    loop(timestamp) {
        if (!this.isRunning) return;

        const dt = Math.min((timestamp - this.lastTime) / 1000, 0.1);
        this.lastTime = timestamp;

        this.ctx.clearRect(0, 0, this.width, this.height);
        this.updateAndDrawItems(dt);

        requestAnimationFrame((t) => this.loop(t));
    }

    renderStatic() {
        this.ctx.clearRect(0, 0, this.width, this.height);
        for (let i = 0; i < this.items.length; i++) {
            this.drawFoodItem(this.items[i]);
        }
    }

    updateAndDrawItems(dt) {
        const mouseX = this.mouse.x;
        const mouseY = this.mouse.y;
        const interactionRadius = 95;

        for (let i = 0; i < this.items.length; i++) {
            const item = this.items[i];

            // 1. Natural slow thermal updraft & horizontal sway
            item.wobble += item.wobbleSpeed;
            const sway = Math.sin(item.wobble) * item.wobbleWidth;

            // Decay temporary interactive boosts smoothly
            if (item.wobbleSpeed > 0.02) {
                item.wobbleSpeed *= 0.98;
            }
            if (Math.abs(item.interactiveSpin) > 0.001) {
                item.angle += item.interactiveSpin;
                item.interactiveSpin *= 0.94;
            }

            // 2. Soft air current / thermal waft from cursor proximity
            let isHovered = false;
            if (this.mouse.active) {
                const dx = item.x - mouseX;
                const dy = item.y - mouseY;
                const dist = Math.hypot(dx, dy);

                if (dist < interactionRadius && dist > 1) {
                    isHovered = true;
                    const force = (interactionRadius - dist) / interactionRadius;
                    // Whisper-soft air displacement
                    item.vx += (dx / dist) * force * 0.30;
                    item.vy += (dy / dist) * force * 0.20;
                }
            }

            // Target scale & alpha response
            item.targetScale = isHovered ? 1.15 : 1.0;
            item.targetAlpha = isHovered ? (item.baseAlpha + 0.05) : item.baseAlpha;

            // Smooth spring interpolation
            item.scale += (item.targetScale - item.scale) * 0.1;
            item.alpha += (item.targetAlpha - item.alpha) * 0.1;

            // Velocity damping back to baseline drift
            item.vx *= 0.95;
            item.vy = item.vy * 0.96 + item.baseVy * 0.04;

            item.x += (item.vx + sway) * 60 * dt;
            item.y += item.vy * 60 * dt;
            item.angle += item.rotSpeed;

            // Screen wrap-around (gentle loop)
            const margin = item.size + 40;
            if (item.y < -margin) {
                item.y = this.height + margin;
                item.x = Math.random() * this.width;
            }
            if (item.x < -margin) {
                item.x = this.width + margin;
            } else if (item.x > this.width + margin) {
                item.x = -margin;
            }

            // Draw culinary element
            this.drawFoodItem(item);
        }
    }

    drawFoodItem(item) {
        const ctx = this.ctx;
        const color = item.colorPrefix;
        const nutmeg = item.nutmegPrefix;
        const alpha = Math.max(0.01, item.alpha);
        const size = item.size * item.scale;

        ctx.save();
        ctx.translate(item.x, item.y);
        ctx.rotate(item.angle);

        switch (item.type) {
            case 0: // Pizza Slice
                this.drawPizza(ctx, size, color, alpha);
                break;
            case 1: // Gourmet Burger
                this.drawBurger(ctx, size, color, nutmeg, alpha);
                break;
            case 2: // Crisp Carrot
                this.drawCarrot(ctx, size, color, alpha);
                break;
            case 3: // Avocado
                this.drawAvocado(ctx, size, color, nutmeg, alpha);
                break;
            case 4: // Cherry Tomato
                this.drawTomato(ctx, size, color, alpha);
                break;
            case 5: // Citrus / Lemon Slice
                this.drawCitrus(ctx, size, color, alpha);
                break;
            case 6: // Apple
                this.drawApple(ctx, size, color, alpha);
                break;
            case 7: // Twin Cherries
                this.drawCherries(ctx, size, color, alpha);
                break;
            case 8: // Flaky Croissant
                this.drawCroissant(ctx, size, color, alpha);
                break;
            case 9: // Fresh Herb Leaf
                this.drawHerbLeaf(ctx, size, color, alpha);
                break;
        }

        ctx.restore();
    }

    // -------------------------------------------------------------------------
    // PROCEDURAL MINIMAL FOOD VECTOR SILHOUETTES
    // -------------------------------------------------------------------------

    // 1. Pizza Slice
    drawPizza(ctx, size, color, alpha) {
        const r = size * 0.9;
        const halfAngle = 0.36; // ~20 deg wedge

        ctx.fillStyle = `${color}${alpha.toFixed(3)})`;
        ctx.strokeStyle = `${color}${(alpha * 1.25).toFixed(3)})`;
        ctx.lineWidth = 1.2;

        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(r * Math.sin(halfAngle), -r * Math.cos(halfAngle));
        ctx.arc(0, 0, r, -Math.PI / 2 + halfAngle, -Math.PI / 2 - halfAngle, true);
        ctx.closePath();
        ctx.fill();

        // Crust edge
        ctx.beginPath();
        ctx.arc(0, 0, r, -Math.PI / 2 + halfAngle, -Math.PI / 2 - halfAngle, true);
        ctx.lineWidth = 2.4;
        ctx.stroke();

        // Pepperoni spots
        ctx.fillStyle = `${color}${(alpha * 1.5).toFixed(3)})`;
        const pR = size * 0.12;
        ctx.beginPath();
        ctx.arc(0, -r * 0.55, pR, 0, Math.PI * 2);
        ctx.arc(-r * 0.16, -r * 0.72, pR * 0.85, 0, Math.PI * 2);
        ctx.arc(r * 0.15, -r * 0.36, pR * 0.9, 0, Math.PI * 2);
        ctx.fill();
    }

    // 2. Gourmet Burger
    drawBurger(ctx, size, color, nutmeg, alpha) {
        const w = size * 1.1;
        const h = size * 0.85;

        ctx.fillStyle = `${color}${alpha.toFixed(3)})`;
        ctx.strokeStyle = `${color}${(alpha * 1.2).toFixed(3)})`;
        ctx.lineWidth = 1.1;

        // Top Bun (rounded dome)
        ctx.beginPath();
        ctx.arc(0, -h * 0.15, w * 0.48, Math.PI, 0);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Sesame seeds
        ctx.fillStyle = `${color}${(alpha * 1.6).toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(-w * 0.18, -h * 0.34, 1.1, 0, Math.PI * 2);
        ctx.arc(0, -h * 0.44, 1.1, 0, Math.PI * 2);
        ctx.arc(w * 0.2, -h * 0.32, 1.1, 0, Math.PI * 2);
        ctx.fill();

        // Wavy lettuce line
        ctx.beginPath();
        ctx.moveTo(-w * 0.5, -h * 0.1);
        ctx.quadraticCurveTo(-w * 0.25, -h * 0.02, 0, -h * 0.1);
        ctx.quadraticCurveTo(w * 0.25, -h * 0.02, w * 0.5, -h * 0.1);
        ctx.lineWidth = 1.8;
        ctx.stroke();

        // Patty
        ctx.fillStyle = `${nutmeg}${(alpha * 1.35).toFixed(3)})`;
        ctx.beginPath();
        if (ctx.roundRect) {
            ctx.roundRect(-w * 0.46, 0, w * 0.92, h * 0.20, 2.5);
        } else {
            ctx.rect(-w * 0.46, 0, w * 0.92, h * 0.20);
        }
        ctx.fill();

        // Bottom bun
        ctx.fillStyle = `${color}${alpha.toFixed(3)})`;
        ctx.beginPath();
        if (ctx.roundRect) {
            ctx.roundRect(-w * 0.44, h * 0.24, w * 0.88, h * 0.18, [1, 1, 3, 3]);
        } else {
            ctx.rect(-w * 0.44, h * 0.24, w * 0.88, h * 0.18);
        }
        ctx.fill();
        ctx.lineWidth = 1.0;
        ctx.stroke();
    }

    // 3. Crisp Carrot
    drawCarrot(ctx, size, color, alpha) {
        const w = size * 0.7;
        const h = size * 1.15;

        ctx.fillStyle = `${color}${alpha.toFixed(3)})`;
        ctx.strokeStyle = `${color}${(alpha * 1.25).toFixed(3)})`;
        ctx.lineWidth = 1.1;

        // Carrot body
        ctx.beginPath();
        ctx.moveTo(-w * 0.38, -h * 0.3);
        ctx.quadraticCurveTo(0, -h * 0.38, w * 0.38, -h * 0.3);
        ctx.quadraticCurveTo(w * 0.2, h * 0.2, 0, h * 0.55);
        ctx.quadraticCurveTo(-w * 0.2, h * 0.2, -w * 0.38, -h * 0.3);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Accent ridges
        ctx.strokeStyle = `${color}${(alpha * 1.35).toFixed(3)})`;
        ctx.beginPath();
        ctx.moveTo(-w * 0.22, -h * 0.1);
        ctx.lineTo(w * 0.14, -h * 0.08);
        ctx.moveTo(-w * 0.16, h * 0.12);
        ctx.lineTo(w * 0.18, h * 0.14);
        ctx.stroke();

        // Green fronds top
        ctx.beginPath();
        ctx.moveTo(0, -h * 0.34);
        ctx.quadraticCurveTo(-w * 0.25, -h * 0.55, -w * 0.4, -h * 0.5);
        ctx.moveTo(0, -h * 0.34);
        ctx.quadraticCurveTo(0, -h * 0.65, 0, -h * 0.6);
        ctx.moveTo(0, -h * 0.34);
        ctx.quadraticCurveTo(w * 0.25, -h * 0.55, w * 0.4, -h * 0.5);
        ctx.stroke();
    }

    // 4. Avocado
    drawAvocado(ctx, size, color, nutmeg, alpha) {
        const w = size * 0.8;
        const h = size * 1.05;

        ctx.fillStyle = `${color}${alpha.toFixed(3)})`;
        ctx.strokeStyle = `${color}${(alpha * 1.25).toFixed(3)})`;
        ctx.lineWidth = 1.1;

        // Pear contour
        ctx.beginPath();
        ctx.moveTo(0, -h * 0.5);
        ctx.bezierCurveTo(w * 0.35, -h * 0.45, w * 0.55, 0, w * 0.45, h * 0.35);
        ctx.bezierCurveTo(w * 0.35, h * 0.55, -w * 0.35, h * 0.55, -w * 0.45, h * 0.35);
        ctx.bezierCurveTo(-w * 0.55, 0, -w * 0.35, -h * 0.45, 0, -h * 0.5);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Seed / Pit
        ctx.fillStyle = `${nutmeg}${(alpha * 1.5).toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(0, h * 0.15, w * 0.22, 0, Math.PI * 2);
        ctx.fill();
    }

    // 5. Cherry Tomato
    drawTomato(ctx, size, color, alpha) {
        const r = size * 0.48;

        ctx.fillStyle = `${color}${alpha.toFixed(3)})`;
        ctx.strokeStyle = `${color}${(alpha * 1.25).toFixed(3)})`;
        ctx.lineWidth = 1.1;

        // Plump tomato round
        ctx.beginPath();
        ctx.arc(0, r * 0.12, r * 0.88, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Star-like calyx / stem
        ctx.strokeStyle = `${color}${(alpha * 1.45).toFixed(3)})`;
        ctx.beginPath();
        ctx.moveTo(0, -r * 0.65);
        ctx.lineTo(-r * 0.38, -r * 0.52);
        ctx.moveTo(0, -r * 0.65);
        ctx.lineTo(r * 0.38, -r * 0.52);
        ctx.moveTo(0, -r * 0.65);
        ctx.lineTo(0, -r * 0.92);
        ctx.stroke();
    }

    // 6. Citrus / Lemon Slice
    drawCitrus(ctx, size, color, alpha) {
        const r = size * 0.52;

        ctx.strokeStyle = `${color}${(alpha * 1.3).toFixed(3)})`;
        ctx.lineWidth = 1.3;

        // Outer rind
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.stroke();

        // Segments
        ctx.fillStyle = `${color}${alpha.toFixed(3)})`;
        const innerR = r * 0.78;
        const segments = 6;
        for (let i = 0; i < segments; i++) {
            const startA = (i * 2 * Math.PI) / segments + 0.12;
            const endA = ((i + 1) * 2 * Math.PI) / segments - 0.12;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.arc(0, 0, innerR, startA, endA);
            ctx.closePath();
            ctx.fill();
        }
    }

    // 7. Apple
    drawApple(ctx, size, color, alpha) {
        const w = size * 0.82;
        const h = size * 0.82;

        ctx.fillStyle = `${color}${alpha.toFixed(3)})`;
        ctx.strokeStyle = `${color}${(alpha * 1.25).toFixed(3)})`;
        ctx.lineWidth = 1.1;

        // Apple lobes
        ctx.beginPath();
        ctx.moveTo(0, -h * 0.32);
        ctx.bezierCurveTo(w * 0.45, -h * 0.52, w * 0.58, h * 0.25, w * 0.24, h * 0.5);
        ctx.bezierCurveTo(w * 0.1, h * 0.55, -w * 0.1, h * 0.55, -w * 0.24, h * 0.5);
        ctx.bezierCurveTo(-w * 0.58, h * 0.25, -w * 0.45, -h * 0.52, 0, -h * 0.32);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Apple stem
        ctx.strokeStyle = `${color}${(alpha * 1.45).toFixed(3)})`;
        ctx.lineWidth = 1.1;
        ctx.beginPath();
        ctx.moveTo(0, -h * 0.32);
        ctx.quadraticCurveTo(w * 0.14, -h * 0.56, w * 0.08, -h * 0.68);
        ctx.stroke();

        // Tiny leaf
        ctx.fillStyle = `${color}${(alpha * 1.35).toFixed(3)})`;
        ctx.beginPath();
        ctx.ellipse(w * 0.16, -h * 0.54, w * 0.11, h * 0.06, 0.4, 0, Math.PI * 2);
        ctx.fill();
    }

    // 8. Twin Cherries
    drawCherries(ctx, size, color, alpha) {
        const r = size * 0.24;
        const w = size * 0.78;
        const h = size * 0.88;

        ctx.fillStyle = `${color}${alpha.toFixed(3)})`;
        ctx.strokeStyle = `${color}${(alpha * 1.25).toFixed(3)})`;
        ctx.lineWidth = 1.1;

        // Left cherry
        ctx.beginPath();
        ctx.arc(-w * 0.25, h * 0.24, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Right cherry
        ctx.beginPath();
        ctx.arc(w * 0.22, h * 0.16, r * 0.92, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Stems
        ctx.strokeStyle = `${color}${(alpha * 1.4).toFixed(3)})`;
        ctx.beginPath();
        ctx.moveTo(-w * 0.25, h * 0.24 - r);
        ctx.quadraticCurveTo(-w * 0.1, -h * 0.18, 0, -h * 0.38);
        ctx.moveTo(w * 0.22, h * 0.16 - r * 0.92);
        ctx.quadraticCurveTo(w * 0.14, -h * 0.12, 0, -h * 0.38);
        ctx.stroke();

        // Leaf at apex
        ctx.fillStyle = `${color}${(alpha * 1.4).toFixed(3)})`;
        ctx.beginPath();
        ctx.ellipse(w * 0.12, -h * 0.42, w * 0.11, h * 0.06, -0.3, 0, Math.PI * 2);
        ctx.fill();
    }

    // 9. Flaky Croissant
    drawCroissant(ctx, size, color, alpha) {
        const w = size * 0.96;
        const h = size * 0.62;

        ctx.fillStyle = `${color}${alpha.toFixed(3)})`;
        ctx.strokeStyle = `${color}${(alpha * 1.25).toFixed(3)})`;
        ctx.lineWidth = 1.1;

        // Crescent shape
        ctx.beginPath();
        ctx.moveTo(-w * 0.48, h * 0.24);
        ctx.bezierCurveTo(-w * 0.34, -h * 0.52, w * 0.34, -h * 0.52, w * 0.48, h * 0.24);
        ctx.bezierCurveTo(w * 0.28, -h * 0.12, -w * 0.28, -h * 0.12, -w * 0.48, h * 0.24);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Pastry seams
        ctx.strokeStyle = `${color}${(alpha * 1.4).toFixed(3)})`;
        ctx.beginPath();
        ctx.moveTo(-w * 0.16, -h * 0.36);
        ctx.lineTo(-w * 0.08, -h * 0.05);
        ctx.moveTo(0, -h * 0.4);
        ctx.lineTo(0, -h * 0.05);
        ctx.moveTo(w * 0.16, -h * 0.36);
        ctx.lineTo(w * 0.08, -h * 0.05);
        ctx.stroke();
    }

    // 10. Fresh Herb Leaf
    drawHerbLeaf(ctx, size, color, alpha) {
        ctx.fillStyle = `${color}${alpha.toFixed(3)})`;
        ctx.beginPath();
        ctx.moveTo(0, size * 0.65);
        ctx.bezierCurveTo(-size * 0.45, size * 0.2, -size * 0.42, -size * 0.45, 0, -size * 0.65);
        ctx.bezierCurveTo(size * 0.42, -size * 0.45, size * 0.45, size * 0.2, 0, size * 0.65);
        ctx.fill();

        // Central vein
        ctx.strokeStyle = `${color}${(alpha * 0.8).toFixed(3)})`;
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(0, size * 0.55);
        ctx.lineTo(0, -size * 0.45);
        ctx.stroke();
    }
}

// Global initialization
(function initAmbientCulinaryBackground() {
    if (typeof window === 'undefined') return;

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
