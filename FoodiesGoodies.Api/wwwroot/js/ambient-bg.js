/**
 * FoodiesGoodies - Minimal Ambient Culinary Canvas Engine
 * 
 * Elegant, whisper-soft background featuring 24 minimal culinary watermarks:
 * - Vegetables & Garden: Crisp Carrot, Hass Avocado, Cherry Tomato, Sweet Basil Leaf
 * - Fresh Fruits: Meyer Lemon Slice, Honeycrisp Apple, Sweet Cherries, Wild Strawberry, Watermelon
 * - Savory & Street: Artisan Pizza, Brioche Burger, Tokyo Ramen, Street Taco, Dim Sum Gyoza, Salmon Nigiri
 * - Bakery & Sweets: Butter Croissant, Bavarian Pretzel, Glazed Donut, Frosted Cupcake, Gelato Cone, Alpine Cheese
 * - Sips & Tools: Café Espresso, Botanical Spritz, Chef's Cutlery
 * 
 * Minimal Aesthetics & Interactivity:
 * - Whisper-soft watermark opacity (3% - 5%) that never competes with text or cards
 * - Gentle thermal float with slow, organic pendulum sway
 * - Proximity waft: soft air displacement and subtle scale lift (1.05x) when cursor passes nearby
 * - Harmonious Light / Dark theme palette synchronization
 * - Lightweight 60 FPS requestAnimationFrame with automatic visibility pausing
 */

const FOOD_DEFINITIONS = [
    { type: 0,  name: 'Artisan Pizza',    colorKey: 'terracotta' },
    { type: 1,  name: 'Brioche Burger',   colorKey: 'gold' },
    { type: 2,  name: 'Garden Carrot',    colorKey: 'orange' },
    { type: 3,  name: 'Hass Avocado',     colorKey: 'sage' },
    { type: 4,  name: 'Cherry Tomato',    colorKey: 'terracotta' },
    { type: 5,  name: 'Meyer Lemon',      colorKey: 'gold' },
    { type: 6,  name: 'Crisp Apple',      colorKey: 'terracotta' },
    { type: 7,  name: 'Sweet Cherries',   colorKey: 'berry' },
    { type: 8,  name: 'Butter Croissant', colorKey: 'gold' },
    { type: 9,  name: 'Sweet Basil',      colorKey: 'sage' },
    { type: 10, name: 'Tokyo Ramen',      colorKey: 'terracotta' },
    { type: 11, name: 'Street Taco',      colorKey: 'gold' },
    { type: 12, name: 'Artisan Pretzel',  colorKey: 'nutmeg' },
    { type: 13, name: 'Glazed Donut',     colorKey: 'berry' },
    { type: 14, name: 'Café Espresso',    colorKey: 'nutmeg' },
    { type: 15, name: 'Wild Strawberry',  colorKey: 'berry' },
    { type: 16, name: 'Frosted Cupcake',  colorKey: 'gold' },
    { type: 17, name: 'Salmon Nigiri',    colorKey: 'orange' },
    { type: 18, name: 'Alpine Cheese',    colorKey: 'gold' },
    { type: 19, name: 'Watermelon Slice', colorKey: 'terracotta' },
    { type: 20, name: "Chef's Cutlery",   colorKey: 'nutmeg' },
    { type: 21, name: 'Dim Sum Gyoza',    colorKey: 'gold' },
    { type: 22, name: 'Gelato Swirl Cone',colorKey: 'berry' },
    { type: 23, name: 'Botanical Spritz', colorKey: 'gold' }
];

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

        // Initial canvas setup
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
            // Dark Bistro theme: muted, subtle culinary watercolor undertones
            return {
                terracotta: 'rgba(235, 115, 85, ',
                gold: 'rgba(240, 185, 75, ',
                sage: 'rgba(130, 185, 125, ',
                orange: 'rgba(240, 140, 65, ',
                berry: 'rgba(230, 105, 135, ',
                nutmeg: 'rgba(195, 140, 100, ',
                cream: 'rgba(245, 235, 215, '
            };
        } else {
            // Light Cream Editorial theme: fine warm sepia & watercolor tints
            return {
                terracotta: 'rgba(195, 80, 55, ',
                gold: 'rgba(205, 138, 35, ',
                sage: 'rgba(85, 135, 80, ',
                orange: 'rgba(215, 112, 40, ',
                berry: 'rgba(185, 60, 92, ',
                nutmeg: 'rgba(145, 95, 65, ',
                cream: 'rgba(120, 105, 90, '
            };
        }
    }

    initItems() {
        // Balanced minimal density: clearly visible elements without cluttering
        let count = 15;
        if (this.width < 768) {
            count = 5;
        } else if (this.width < 1024) {
            count = 9;
        }

        const palettes = this.getPalettes();
        this.items = [];

        // Shuffle food definitions to ensure balanced variety across pages
        const shuffled = [...FOOD_DEFINITIONS].sort(() => Math.random() - 0.5);

        for (let i = 0; i < count; i++) {
            const def = shuffled[i % shuffled.length];
            const item = this.createItem(def.type, palettes, true);
            this.items.push(item);
        }
    }

    createItem(type, palettes, initialScatter = false) {
        const isMobile = this.width < 768;
        const isTablet = this.width >= 768 && this.width < 1024;

        const x = Math.random() * this.width;
        const y = initialScatter ? Math.random() * this.height : this.height + 40 + Math.random() * 60;

        // Recognizable, clean minimal size scaling
        const baseSize = isMobile ? 18 : (isTablet ? 22 : 26);
        const sizeVariance = isMobile ? 3 : 5;
        const size = baseSize + Math.random() * sizeVariance;

        const def = FOOD_DEFINITIONS.find(d => d.type === type) || FOOD_DEFINITIONS[0];

        // Calibrated visibility: clearly visible culinary shapes while remaining refined and minimal
        const baseAlpha = this.isDark ? (0.085 + Math.random() * 0.02) : (0.07 + Math.random() * 0.015);
        const baseVy = -0.14 - Math.random() * 0.12; // Slow, tranquil thermal rise

        return {
            type: def.type,
            name: def.name,
            x,
            y,
            size,
            colorKey: def.colorKey,
            colorPrefix: palettes[def.colorKey],
            nutmegPrefix: palettes.nutmeg,
            sagePrefix: palettes.sage,
            goldPrefix: palettes.gold,
            orangePrefix: palettes.orange,
            berryPrefix: palettes.berry,
            creamPrefix: palettes.cream,
            alpha: baseAlpha,
            baseAlpha,
            targetAlpha: baseAlpha,
            scale: 1.0,
            targetScale: 1.0,
            vx: 0,
            vy: baseVy,
            baseVy,
            angle: (Math.random() - 0.5) * 0.5,
            rotSpeed: (Math.random() - 0.5) * 0.003,
            wobble: Math.random() * Math.PI * 2,
            wobbleSpeed: 0.010 + Math.random() * 0.008,
            wobbleWidth: 0.18 + Math.random() * 0.20,
            interactiveSpin: 0
        };
    }

    updateItemColors() {
        const palettes = this.getPalettes();
        this.items.forEach(item => {
            item.colorPrefix = palettes[item.colorKey];
            item.nutmegPrefix = palettes.nutmeg;
            item.sagePrefix = palettes.sage;
            item.goldPrefix = palettes.gold;
            item.orangePrefix = palettes.orange;
            item.berryPrefix = palettes.berry;
            item.creamPrefix = palettes.cream;
            item.baseAlpha = this.isDark ? (0.085 + Math.random() * 0.02) : (0.07 + Math.random() * 0.015);
            item.alpha = item.baseAlpha;
            item.targetAlpha = item.baseAlpha;
        });
    }

    initInteractions() {
        // Track pointer position softly without touching the cursor style
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

        // Subtle, quiet tactile bobble if user taps near a background element
        window.addEventListener('pointerdown', (e) => {
            if (this.prefersReducedMotion) return;

            const clickX = e.clientX;
            const clickY = e.clientY;
            const clickRadius = 70;

            for (let i = 0; i < this.items.length; i++) {
                const item = this.items[i];
                const dx = item.x - clickX;
                const dy = item.y - clickY;
                const dist = Math.hypot(dx, dy);

                if (dist < clickRadius) {
                    item.scale = 1.10;
                    item.vy -= 0.5; // gentle buoyant hop
                    item.interactiveSpin = (Math.random() > 0.5 ? 1 : -1) * 0.06;
                    break;
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
        const mouseActive = this.mouse.active;
        const interactionRadius = 110;

        for (let i = 0; i < this.items.length; i++) {
            const item = this.items[i];

            // 1. Natural slow thermal drift & gentle horizontal sway
            item.wobble += item.wobbleSpeed;
            const sway = Math.sin(item.wobble) * item.wobbleWidth;

            // Decay interactive spin smoothly
            if (Math.abs(item.interactiveSpin) > 0.001) {
                item.angle += item.interactiveSpin;
                item.interactiveSpin *= 0.94;
            }

            // 2. Gentle air waft from cursor proximity
            let isNearCursor = false;
            if (mouseActive) {
                const dx = item.x - mouseX;
                const dy = item.y - mouseY;
                const dist = Math.hypot(dx, dy);

                if (dist < interactionRadius && dist > 1) {
                    isNearCursor = true;
                    const force = (interactionRadius - dist) / interactionRadius;
                    // Whisper-soft air displacement
                    item.vx += (dx / dist) * force * 0.22;
                    item.vy += (dy / dist) * force * 0.15;
                }
            }

            // Subtle target scale & alpha response: quiet and unobtrusive
            item.targetScale = isNearCursor ? 1.08 : 1.0;
            item.targetAlpha = isNearCursor ? (item.baseAlpha + 0.05) : item.baseAlpha;

            item.scale += (item.targetScale - item.scale) * 0.10;
            item.alpha += (item.targetAlpha - item.alpha) * 0.10;

            // Velocity damping back to baseline drift
            item.vx *= 0.95;
            item.vy = item.vy * 0.96 + item.baseVy * 0.04;

            item.x += (item.vx + sway) * 60 * dt;
            item.y += item.vy * 60 * dt;
            item.angle += item.rotSpeed;

            // Screen boundary wrapping
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
        const alpha = Math.max(0.01, item.alpha);
        const size = item.size * item.scale;
        const color = item.colorPrefix;
        const nutmeg = item.nutmegPrefix;
        const sage = item.sagePrefix;
        const gold = item.goldPrefix;
        const orange = item.orangePrefix;
        const berry = item.berryPrefix;
        const cream = item.creamPrefix;

        ctx.save();
        ctx.translate(item.x, item.y);
        ctx.rotate(item.angle);

        switch (item.type) {
            case 0:  this.drawPizza(ctx, size, color, alpha); break;
            case 1:  this.drawBurger(ctx, size, color, nutmeg, sage, alpha); break;
            case 2:  this.drawCarrot(ctx, size, orange, sage, alpha); break;
            case 3:  this.drawAvocado(ctx, size, sage, nutmeg, alpha); break;
            case 4:  this.drawTomato(ctx, size, color, sage, alpha); break;
            case 5:  this.drawCitrus(ctx, size, gold, alpha); break;
            case 6:  this.drawApple(ctx, size, color, sage, nutmeg, alpha); break;
            case 7:  this.drawCherries(ctx, size, berry, sage, alpha); break;
            case 8:  this.drawCroissant(ctx, size, gold, alpha); break;
            case 9:  this.drawHerbLeaf(ctx, size, sage, alpha); break;
            case 10: this.drawRamen(ctx, size, color, nutmeg, gold, alpha); break;
            case 11: this.drawTaco(ctx, size, gold, sage, color, alpha); break;
            case 12: this.drawPretzel(ctx, size, nutmeg, alpha); break;
            case 13: this.drawDonut(ctx, size, berry, gold, alpha); break;
            case 14: this.drawEspresso(ctx, size, nutmeg, cream, alpha); break;
            case 15: this.drawStrawberry(ctx, size, berry, sage, gold, alpha); break;
            case 16: this.drawCupcake(ctx, size, berry, gold, alpha); break;
            case 17: this.drawSushi(ctx, size, orange, cream, alpha); break;
            case 18: this.drawCheese(ctx, size, gold, alpha); break;
            case 19: this.drawWatermelon(ctx, size, color, sage, alpha); break;
            case 20: this.drawUtensils(ctx, size, nutmeg, alpha); break;
            case 21: this.drawDumpling(ctx, size, gold, alpha); break;
            case 22: this.drawIceCream(ctx, size, berry, nutmeg, alpha); break;
            case 23: this.drawCocktail(ctx, size, gold, sage, alpha); break;
        }

        ctx.restore();
    }

    // -------------------------------------------------------------------------
    // 24 MINIMAL CULINARY VECTOR SILHOUETTES (HAIRLINE STROKES & SOFT TINTS)
    // -------------------------------------------------------------------------

    // 0. Pizza Slice
    drawPizza(ctx, size, color, alpha) {
        const r = size * 0.9;
        const halfAngle = 0.36;

        ctx.fillStyle = `${color}${alpha.toFixed(3)})`;
        ctx.strokeStyle = `${color}${(alpha * 1.25).toFixed(3)})`;
        ctx.lineWidth = 1.1;

        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(r * Math.sin(halfAngle), -r * Math.cos(halfAngle));
        ctx.arc(0, 0, r, -Math.PI / 2 + halfAngle, -Math.PI / 2 - halfAngle, true);
        ctx.closePath();
        ctx.fill();

        // Crust edge
        ctx.beginPath();
        ctx.arc(0, 0, r, -Math.PI / 2 + halfAngle, -Math.PI / 2 - halfAngle, true);
        ctx.lineWidth = 2.0;
        ctx.stroke();

        // Pepperoni spots
        ctx.fillStyle = `${color}${(alpha * 1.4).toFixed(3)})`;
        const pR = size * 0.11;
        ctx.beginPath();
        ctx.arc(0, -r * 0.55, pR, 0, Math.PI * 2);
        ctx.arc(-r * 0.16, -r * 0.72, pR * 0.85, 0, Math.PI * 2);
        ctx.arc(r * 0.15, -r * 0.36, pR * 0.9, 0, Math.PI * 2);
        ctx.fill();
    }

    // 1. Gourmet Burger
    drawBurger(ctx, size, color, nutmeg, sage, alpha) {
        const w = size * 1.1;
        const h = size * 0.85;

        ctx.fillStyle = `${color}${alpha.toFixed(3)})`;
        ctx.strokeStyle = `${color}${(alpha * 1.2).toFixed(3)})`;
        ctx.lineWidth = 1.0;

        // Top Bun
        ctx.beginPath();
        ctx.arc(0, -h * 0.14, w * 0.48, Math.PI, 0);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Sesame seeds
        ctx.fillStyle = `${color}${(alpha * 1.5).toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(-w * 0.18, -h * 0.34, 1.0, 0, Math.PI * 2);
        ctx.arc(0, -h * 0.44, 1.0, 0, Math.PI * 2);
        ctx.arc(w * 0.2, -h * 0.32, 1.0, 0, Math.PI * 2);
        ctx.fill();

        // Lettuce line
        ctx.strokeStyle = `${sage}${(alpha * 1.3).toFixed(3)})`;
        ctx.beginPath();
        ctx.moveTo(-w * 0.48, -h * 0.08);
        ctx.quadraticCurveTo(-w * 0.24, 0, 0, -h * 0.08);
        ctx.quadraticCurveTo(w * 0.24, 0, w * 0.48, -h * 0.08);
        ctx.lineWidth = 1.4;
        ctx.stroke();

        // Patty
        ctx.fillStyle = `${nutmeg}${(alpha * 1.3).toFixed(3)})`;
        ctx.beginPath();
        if (ctx.roundRect) {
            ctx.roundRect(-w * 0.46, 0, w * 0.92, h * 0.20, 2);
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
        ctx.lineWidth = 0.9;
        ctx.stroke();
    }

    // 2. Crisp Carrot
    drawCarrot(ctx, size, orange, sage, alpha) {
        const w = size * 0.7;
        const h = size * 1.15;

        ctx.fillStyle = `${orange}${alpha.toFixed(3)})`;
        ctx.strokeStyle = `${orange}${(alpha * 1.25).toFixed(3)})`;
        ctx.lineWidth = 1.0;

        ctx.beginPath();
        ctx.moveTo(-w * 0.38, -h * 0.3);
        ctx.quadraticCurveTo(0, -h * 0.38, w * 0.38, -h * 0.3);
        ctx.quadraticCurveTo(w * 0.2, h * 0.2, 0, h * 0.55);
        ctx.quadraticCurveTo(-w * 0.2, h * 0.2, -w * 0.38, -h * 0.3);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Accent ridges
        ctx.strokeStyle = `${orange}${(alpha * 1.3).toFixed(3)})`;
        ctx.beginPath();
        ctx.moveTo(-w * 0.2, -h * 0.08);
        ctx.lineTo(w * 0.14, -h * 0.06);
        ctx.moveTo(-w * 0.14, h * 0.14);
        ctx.lineTo(w * 0.16, h * 0.16);
        ctx.stroke();

        // Foliage top
        ctx.strokeStyle = `${sage}${(alpha * 1.3).toFixed(3)})`;
        ctx.beginPath();
        ctx.moveTo(0, -h * 0.34);
        ctx.quadraticCurveTo(-w * 0.25, -h * 0.55, -w * 0.4, -h * 0.5);
        ctx.moveTo(0, -h * 0.34);
        ctx.quadraticCurveTo(0, -h * 0.65, 0, -h * 0.6);
        ctx.moveTo(0, -h * 0.34);
        ctx.quadraticCurveTo(w * 0.25, -h * 0.55, w * 0.4, -h * 0.5);
        ctx.stroke();
    }

    // 3. Hass Avocado
    drawAvocado(ctx, size, sage, nutmeg, alpha) {
        const w = size * 0.8;
        const h = size * 1.05;

        ctx.fillStyle = `${sage}${alpha.toFixed(3)})`;
        ctx.strokeStyle = `${sage}${(alpha * 1.25).toFixed(3)})`;
        ctx.lineWidth = 1.0;

        ctx.beginPath();
        ctx.moveTo(0, -h * 0.5);
        ctx.bezierCurveTo(w * 0.35, -h * 0.45, w * 0.55, 0, w * 0.45, h * 0.35);
        ctx.bezierCurveTo(w * 0.35, h * 0.55, -w * 0.35, h * 0.55, -w * 0.45, h * 0.35);
        ctx.bezierCurveTo(-w * 0.55, 0, -w * 0.35, -h * 0.45, 0, -h * 0.5);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Pit
        ctx.fillStyle = `${nutmeg}${(alpha * 1.5).toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(0, h * 0.15, w * 0.22, 0, Math.PI * 2);
        ctx.fill();
    }

    // 4. Cherry Tomato
    drawTomato(ctx, size, color, sage, alpha) {
        const r = size * 0.48;

        ctx.fillStyle = `${color}${alpha.toFixed(3)})`;
        ctx.strokeStyle = `${color}${(alpha * 1.25).toFixed(3)})`;
        ctx.lineWidth = 1.0;

        ctx.beginPath();
        ctx.arc(0, r * 0.12, r * 0.88, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Calyx top
        ctx.strokeStyle = `${sage}${(alpha * 1.4).toFixed(3)})`;
        ctx.beginPath();
        ctx.moveTo(0, -r * 0.65);
        ctx.lineTo(-r * 0.38, -r * 0.52);
        ctx.moveTo(0, -r * 0.65);
        ctx.lineTo(r * 0.38, -r * 0.52);
        ctx.moveTo(0, -r * 0.65);
        ctx.lineTo(0, -r * 0.92);
        ctx.stroke();
    }

    // 5. Meyer Lemon Slice
    drawCitrus(ctx, size, gold, alpha) {
        const r = size * 0.52;

        ctx.strokeStyle = `${gold}${(alpha * 1.3).toFixed(3)})`;
        ctx.lineWidth = 1.1;

        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = `${gold}${alpha.toFixed(3)})`;
        const innerR = r * 0.78;
        const segments = 6;
        for (let i = 0; i < segments; i++) {
            const startA = (i * 2 * Math.PI) / segments + 0.14;
            const endA = ((i + 1) * 2 * Math.PI) / segments - 0.14;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.arc(0, 0, innerR, startA, endA);
            ctx.closePath();
            ctx.fill();
        }
    }

    // 6. Crisp Apple
    drawApple(ctx, size, color, sage, nutmeg, alpha) {
        const w = size * 0.82;
        const h = size * 0.82;

        ctx.fillStyle = `${color}${alpha.toFixed(3)})`;
        ctx.strokeStyle = `${color}${(alpha * 1.25).toFixed(3)})`;
        ctx.lineWidth = 1.0;

        ctx.beginPath();
        ctx.moveTo(0, -h * 0.32);
        ctx.bezierCurveTo(w * 0.45, -h * 0.52, w * 0.58, h * 0.25, w * 0.24, h * 0.5);
        ctx.bezierCurveTo(w * 0.1, h * 0.55, -w * 0.1, h * 0.55, -w * 0.24, h * 0.5);
        ctx.bezierCurveTo(-w * 0.58, h * 0.25, -w * 0.45, -h * 0.52, 0, -h * 0.32);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Stem & Leaf
        ctx.strokeStyle = `${nutmeg}${(alpha * 1.4).toFixed(3)})`;
        ctx.lineWidth = 1.0;
        ctx.beginPath();
        ctx.moveTo(0, -h * 0.32);
        ctx.quadraticCurveTo(w * 0.14, -h * 0.56, w * 0.08, -h * 0.68);
        ctx.stroke();

        ctx.fillStyle = `${sage}${(alpha * 1.35).toFixed(3)})`;
        ctx.beginPath();
        ctx.ellipse(w * 0.16, -h * 0.54, w * 0.11, h * 0.06, 0.4, 0, Math.PI * 2);
        ctx.fill();
    }

    // 7. Sweet Cherries
    drawCherries(ctx, size, berry, sage, alpha) {
        const r = size * 0.24;
        const w = size * 0.78;
        const h = size * 0.88;

        ctx.fillStyle = `${berry}${alpha.toFixed(3)})`;
        ctx.strokeStyle = `${berry}${(alpha * 1.25).toFixed(3)})`;
        ctx.lineWidth = 1.0;

        ctx.beginPath();
        ctx.arc(-w * 0.25, h * 0.24, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(w * 0.22, h * 0.16, r * 0.92, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Stems & Leaf
        ctx.strokeStyle = `${sage}${(alpha * 1.35).toFixed(3)})`;
        ctx.beginPath();
        ctx.moveTo(-w * 0.25, h * 0.24 - r);
        ctx.quadraticCurveTo(-w * 0.1, -h * 0.18, 0, -h * 0.38);
        ctx.moveTo(w * 0.22, h * 0.16 - r * 0.92);
        ctx.quadraticCurveTo(w * 0.14, -h * 0.12, 0, -h * 0.38);
        ctx.stroke();

        ctx.fillStyle = `${sage}${(alpha * 1.35).toFixed(3)})`;
        ctx.beginPath();
        ctx.ellipse(w * 0.12, -h * 0.42, w * 0.11, h * 0.06, -0.3, 0, Math.PI * 2);
        ctx.fill();
    }

    // 8. Butter Croissant
    drawCroissant(ctx, size, gold, alpha) {
        const w = size * 0.96;
        const h = size * 0.62;

        ctx.fillStyle = `${gold}${alpha.toFixed(3)})`;
        ctx.strokeStyle = `${gold}${(alpha * 1.25).toFixed(3)})`;
        ctx.lineWidth = 1.0;

        ctx.beginPath();
        ctx.moveTo(-w * 0.48, h * 0.24);
        ctx.bezierCurveTo(-w * 0.34, -h * 0.52, w * 0.34, -h * 0.52, w * 0.48, h * 0.24);
        ctx.bezierCurveTo(w * 0.28, -h * 0.12, -w * 0.28, -h * 0.12, -w * 0.48, h * 0.24);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Folds
        ctx.strokeStyle = `${gold}${(alpha * 1.35).toFixed(3)})`;
        ctx.beginPath();
        ctx.moveTo(-w * 0.16, -h * 0.36);
        ctx.lineTo(-w * 0.08, -h * 0.05);
        ctx.moveTo(0, -h * 0.4);
        ctx.lineTo(0, -h * 0.05);
        ctx.moveTo(w * 0.16, -h * 0.36);
        ctx.lineTo(w * 0.08, -h * 0.05);
        ctx.stroke();
    }

    // 9. Sweet Basil Leaf
    drawHerbLeaf(ctx, size, sage, alpha) {
        ctx.fillStyle = `${sage}${alpha.toFixed(3)})`;
        ctx.beginPath();
        ctx.moveTo(0, size * 0.65);
        ctx.bezierCurveTo(-size * 0.45, size * 0.2, -size * 0.42, -size * 0.45, 0, -size * 0.65);
        ctx.bezierCurveTo(size * 0.42, -size * 0.45, size * 0.45, size * 0.2, 0, size * 0.65);
        ctx.fill();

        ctx.strokeStyle = `${sage}${(alpha * 1.3).toFixed(3)})`;
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(0, size * 0.55);
        ctx.lineTo(0, -size * 0.45);
        ctx.stroke();
    }

    // 10. Tokyo Ramen Bowl
    drawRamen(ctx, size, color, nutmeg, gold, alpha) {
        const w = size * 1.05;
        const h = size * 0.8;

        ctx.fillStyle = `${color}${alpha.toFixed(3)})`;
        ctx.strokeStyle = `${color}${(alpha * 1.25).toFixed(3)})`;
        ctx.lineWidth = 1.0;

        ctx.beginPath();
        ctx.arc(0, -h * 0.05, w * 0.46, 0, Math.PI);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Base foot
        ctx.beginPath();
        ctx.moveTo(-w * 0.16, h * 0.41);
        ctx.lineTo(w * 0.16, h * 0.41);
        ctx.lineWidth = 1.8;
        ctx.stroke();

        // Chopsticks
        ctx.strokeStyle = `${nutmeg}${(alpha * 1.4).toFixed(3)})`;
        ctx.lineWidth = 1.1;
        ctx.beginPath();
        ctx.moveTo(-w * 0.45, -h * 0.15);
        ctx.lineTo(w * 0.5, -h * 0.32);
        ctx.stroke();
    }

    // 11. Street Taco
    drawTaco(ctx, size, gold, sage, color, alpha) {
        const w = size * 1.0;
        const h = size * 0.7;

        ctx.fillStyle = `${gold}${alpha.toFixed(3)})`;
        ctx.strokeStyle = `${gold}${(alpha * 1.25).toFixed(3)})`;
        ctx.lineWidth = 1.0;

        ctx.beginPath();
        ctx.arc(0, -h * 0.05, w * 0.46, 0, Math.PI);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Lettuce ruffle
        ctx.strokeStyle = `${sage}${(alpha * 1.35).toFixed(3)})`;
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(-w * 0.4, -h * 0.05);
        ctx.quadraticCurveTo(-w * 0.2, -h * 0.2, 0, -h * 0.05);
        ctx.quadraticCurveTo(w * 0.2, -h * 0.2, w * 0.4, -h * 0.05);
        ctx.stroke();
    }

    // 12. Artisan Pretzel
    drawPretzel(ctx, size, nutmeg, alpha) {
        const r = size * 0.45;

        ctx.strokeStyle = `${nutmeg}${(alpha * 1.3).toFixed(3)})`;
        ctx.lineWidth = 1.8;

        ctx.beginPath();
        ctx.arc(-r * 0.42, -r * 0.25, r * 0.4, Math.PI * 0.7, Math.PI * 2.3);
        ctx.arc(r * 0.42, -r * 0.25, r * 0.4, Math.PI * 0.7, Math.PI * 2.3);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(-r * 0.6, -r * 0.1);
        ctx.lineTo(r * 0.38, r * 0.42);
        ctx.moveTo(r * 0.6, -r * 0.1);
        ctx.lineTo(-r * 0.38, r * 0.42);
        ctx.stroke();
    }

    // 13. Glazed Donut
    drawDonut(ctx, size, berry, gold, alpha) {
        const r = size * 0.48;

        ctx.strokeStyle = `${gold}${(alpha * 1.25).toFixed(3)})`;
        ctx.lineWidth = size * 0.30;
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.68, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = `${berry}${(alpha * 1.35).toFixed(3)})`;
        ctx.lineWidth = size * 0.18;
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.68, -0.6, Math.PI * 1.5);
        ctx.stroke();
    }

    // 14. Hot Espresso
    drawEspresso(ctx, size, nutmeg, cream, alpha) {
        const w = size * 0.9;
        const h = size * 0.7;

        ctx.fillStyle = `${nutmeg}${alpha.toFixed(3)})`;
        ctx.strokeStyle = `${nutmeg}${(alpha * 1.25).toFixed(3)})`;
        ctx.lineWidth = 1.0;

        ctx.beginPath();
        ctx.moveTo(-w * 0.36, -h * 0.28);
        ctx.lineTo(-w * 0.26, h * 0.28);
        ctx.quadraticCurveTo(0, h * 0.42, w * 0.26, h * 0.28);
        ctx.lineTo(w * 0.36, -h * 0.28);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Handle
        ctx.beginPath();
        ctx.arc(w * 0.4, 0, h * 0.2, -Math.PI * 0.5, Math.PI * 0.5);
        ctx.stroke();

        // Saucer
        ctx.beginPath();
        ctx.moveTo(-w * 0.48, h * 0.42);
        ctx.lineTo(w * 0.48, h * 0.42);
        ctx.lineWidth = 1.4;
        ctx.stroke();
    }

    // 15. Wild Strawberry
    drawStrawberry(ctx, size, berry, sage, gold, alpha) {
        const w = size * 0.75;
        const h = size * 0.92;

        ctx.fillStyle = `${berry}${alpha.toFixed(3)})`;
        ctx.strokeStyle = `${berry}${(alpha * 1.25).toFixed(3)})`;
        ctx.lineWidth = 1.0;

        ctx.beginPath();
        ctx.moveTo(-w * 0.4, -h * 0.3);
        ctx.quadraticCurveTo(0, -h * 0.4, w * 0.4, -h * 0.3);
        ctx.quadraticCurveTo(w * 0.42, h * 0.15, 0, h * 0.5);
        ctx.quadraticCurveTo(-w * 0.42, h * 0.15, -w * 0.4, -h * 0.3);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Crown
        ctx.fillStyle = `${sage}${(alpha * 1.35).toFixed(3)})`;
        ctx.beginPath();
        ctx.ellipse(-w * 0.2, -h * 0.36, w * 0.12, h * 0.07, -0.4, 0, Math.PI * 2);
        ctx.ellipse(0, -h * 0.4, w * 0.11, h * 0.07, 0, 0, Math.PI * 2);
        ctx.ellipse(w * 0.2, -h * 0.36, w * 0.12, h * 0.07, 0.4, 0, Math.PI * 2);
        ctx.fill();
    }

    // 16. Frosted Cupcake
    drawCupcake(ctx, size, berry, gold, alpha) {
        const w = size * 0.9;
        const h = size * 1.0;

        ctx.fillStyle = `${gold}${alpha.toFixed(3)})`;
        ctx.strokeStyle = `${gold}${(alpha * 1.25).toFixed(3)})`;
        ctx.lineWidth = 1.0;

        ctx.beginPath();
        ctx.moveTo(-w * 0.36, 0);
        ctx.lineTo(-w * 0.26, h * 0.42);
        ctx.lineTo(w * 0.26, h * 0.42);
        ctx.lineTo(w * 0.36, 0);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = `${berry}${(alpha * 1.3).toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(-w * 0.2, -h * 0.06, size * 0.18, Math.PI, 0);
        ctx.arc(w * 0.2, -h * 0.06, size * 0.18, Math.PI, 0);
        ctx.arc(0, -h * 0.2, size * 0.22, Math.PI, 0);
        ctx.fill();
    }

    // 17. Salmon Nigiri Sushi
    drawSushi(ctx, size, orange, cream, alpha) {
        const w = size * 1.1;
        const h = size * 0.6;

        ctx.fillStyle = `${cream}${(alpha * 1.2).toFixed(3)})`;
        ctx.beginPath();
        if (ctx.roundRect) {
            ctx.roundRect(-w * 0.44, 0, w * 0.88, h * 0.42, 3);
        } else {
            ctx.rect(-w * 0.44, 0, w * 0.88, h * 0.42);
        }
        ctx.fill();

        ctx.fillStyle = `${orange}${alpha.toFixed(3)})`;
        ctx.strokeStyle = `${orange}${(alpha * 1.25).toFixed(3)})`;
        ctx.lineWidth = 1.0;

        ctx.beginPath();
        ctx.moveTo(-w * 0.5, 0);
        ctx.quadraticCurveTo(0, -h * 0.32, w * 0.5, 0);
        ctx.quadraticCurveTo(0, -h * 0.1, -w * 0.5, 0);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    }

    // 18. Alpine Cheese Wedge
    drawCheese(ctx, size, gold, alpha) {
        const w = size * 0.9;
        const h = size * 0.7;

        ctx.fillStyle = `${gold}${alpha.toFixed(3)})`;
        ctx.strokeStyle = `${gold}${(alpha * 1.25).toFixed(3)})`;
        ctx.lineWidth = 1.0;

        ctx.beginPath();
        ctx.moveTo(-w * 0.46, h * 0.24);
        ctx.lineTo(w * 0.46, -h * 0.32);
        ctx.lineTo(w * 0.46, h * 0.24);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = `rgba(0, 0, 0, ${(alpha * 0.25).toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(0, h * 0.05, size * 0.07, 0, Math.PI * 2);
        ctx.arc(w * 0.22, 0, size * 0.05, 0, Math.PI * 2);
        ctx.fill();
    }

    // 19. Watermelon Slice
    drawWatermelon(ctx, size, color, sage, alpha) {
        const r = size * 0.6;

        ctx.fillStyle = `${color}${alpha.toFixed(3)})`;
        ctx.beginPath();
        ctx.moveTo(0, -r * 0.35);
        ctx.lineTo(-r * 0.6, r * 0.38);
        ctx.quadraticCurveTo(0, r * 0.62, r * 0.6, r * 0.38);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = `${sage}${(alpha * 1.35).toFixed(3)})`;
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(-r * 0.62, r * 0.4);
        ctx.quadraticCurveTo(0, r * 0.66, r * 0.62, r * 0.4);
        ctx.stroke();
    }

    // 20. Chef's Cutlery
    drawUtensils(ctx, size, nutmeg, alpha) {
        const l = size * 0.8;

        ctx.strokeStyle = `${nutmeg}${(alpha * 1.3).toFixed(3)})`;
        ctx.lineWidth = 1.1;

        ctx.beginPath();
        ctx.moveTo(-l * 0.42, -l * 0.42);
        ctx.lineTo(l * 0.42, l * 0.42);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(l * 0.42, -l * 0.42);
        ctx.lineTo(-l * 0.42, l * 0.42);
        ctx.stroke();
    }

    // 21. Dim Sum Gyoza
    drawDumpling(ctx, size, gold, alpha) {
        const w = size * 1.0;
        const h = size * 0.65;

        ctx.fillStyle = `${gold}${alpha.toFixed(3)})`;
        ctx.strokeStyle = `${gold}${(alpha * 1.25).toFixed(3)})`;
        ctx.lineWidth = 1.0;

        ctx.beginPath();
        ctx.moveTo(-w * 0.46, h * 0.2);
        ctx.quadraticCurveTo(-w * 0.18, -h * 0.42, 0, -h * 0.38);
        ctx.quadraticCurveTo(w * 0.18, -h * 0.42, w * 0.46, h * 0.2);
        ctx.quadraticCurveTo(0, h * 0.32, -w * 0.46, h * 0.2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    }

    // 22. Gelato Swirl Cone
    drawIceCream(ctx, size, berry, nutmeg, alpha) {
        const w = size * 0.78;
        const h = size * 1.05;

        ctx.fillStyle = `${nutmeg}${alpha.toFixed(3)})`;
        ctx.strokeStyle = `${nutmeg}${(alpha * 1.25).toFixed(3)})`;
        ctx.lineWidth = 1.0;

        ctx.beginPath();
        ctx.moveTo(-w * 0.32, 0);
        ctx.lineTo(0, h * 0.5);
        ctx.lineTo(w * 0.32, 0);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = `${berry}${(alpha * 1.3).toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(0, -h * 0.16, size * 0.28, 0, Math.PI * 2);
        ctx.fill();
    }

    // 23. Botanical Spritz / Cocktail
    drawCocktail(ctx, size, gold, sage, alpha) {
        const w = size * 0.85;
        const h = size * 1.0;

        ctx.strokeStyle = `${gold}${(alpha * 1.25).toFixed(3)})`;
        ctx.lineWidth = 1.0;

        ctx.beginPath();
        ctx.moveTo(-w * 0.42, -h * 0.32);
        ctx.lineTo(0, 0);
        ctx.lineTo(w * 0.42, -h * 0.32);
        ctx.closePath();
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, h * 0.36);
        ctx.moveTo(-w * 0.25, h * 0.36);
        ctx.lineTo(w * 0.25, h * 0.36);
        ctx.stroke();

        ctx.fillStyle = `${sage}${(alpha * 1.4).toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(-w * 0.04, -h * 0.22, size * 0.07, 0, Math.PI * 2);
        ctx.fill();
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
