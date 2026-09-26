/**
 * FoodiesGoodies - Modern Interactive Culinary Food Elements Ambient Engine
 * 
 * Interactive background featuring 24 stylized minimal culinary icons:
 * - Vegetables & Garden: Crisp Carrot, Hass Avocado, Cherry Tomato, Sweet Basil Leaf
 * - Fresh Fruits: Meyer Lemon Slice, Honeycrisp Apple, Sweet Cherries, Wild Strawberry, Watermelon
 * - Savory & Street Food: Artisan Pizza, Brioche Burger, Tokyo Ramen, Street Taco, Dim Sum Gyoza, Salmon Nigiri
 * - Bakery & Sweets: Butter Croissant, Bavarian Pretzel, Glazed Donut, Frosted Cupcake, Gelato Cone, Alpine Cheese
 * - Sips & Tools: Café Espresso, Botanical Spritz, Chef's Cutlery
 * 
 * Interactive Features:
 * 1. Proximity Reaction: Nearby cursor attracts items, brightens opacity, gently tilts, and blooms a warm culinary aura.
 * 2. Hover Flavor Badges: Softly reveals a chic culinary name tag (e.g., "🍕 Artisan Pizza", "🍜 Tokyo Ramen").
 * 3. Aroma Steam Waves: Hot dishes waft animated curling steam ribbons.
 * 4. Interactive Spice & Seasoning Trail: Cursor movement leaves delicate golden starlets, herb flecks, and spice dust.
 * 5. Tactile Bounce & Flavor Burst: Clicking/tapping elements creates elastic squash-and-stretch with a celebratory starburst of flavor particles.
 * 6. Interactive Drag & Toss: Click and drag any food item to fling it across the atmosphere with realistic inertial physics.
 * 7. Click to Spawn: Clicking empty background creates a new buoyant food element popping into existence.
 * 8. Dynamic Theme Sync: Real-time palette transition between Dark Bistro and Light Cream Editorial modes.
 * 9. High-DPI support, battery-conserving tab suspension, and prefers-reduced-motion accessibility.
 */

const FOOD_DEFINITIONS = [
    { type: 0,  name: 'Artisan Pizza',     emoji: '🍕', colorKey: 'terracotta', hot: true },
    { type: 1,  name: 'Brioche Burger',    emoji: '🍔', colorKey: 'gold',       hot: true },
    { type: 2,  name: 'Garden Carrot',     emoji: '🥕', colorKey: 'orange',     hot: false },
    { type: 3,  name: 'Hass Avocado',      emoji: '🥑', colorKey: 'sage',       hot: false },
    { type: 4,  name: 'Cherry Tomato',     emoji: '🍅', colorKey: 'terracotta', hot: false },
    { type: 5,  name: 'Meyer Lemon',       emoji: '🍋', colorKey: 'gold',       hot: false },
    { type: 6,  name: 'Crisp Apple',       emoji: '🍎', colorKey: 'terracotta', hot: false },
    { type: 7,  name: 'Sweet Cherries',    emoji: '🍒', colorKey: 'berry',      hot: false },
    { type: 8,  name: 'Butter Croissant',  emoji: '🥐', colorKey: 'gold',       hot: true },
    { type: 9,  name: 'Sweet Basil',       emoji: '🌿', colorKey: 'sage',       hot: false },
    { type: 10, name: 'Tokyo Ramen',       emoji: '🍜', colorKey: 'terracotta', hot: true },
    { type: 11, name: 'Street Taco',       emoji: '🌮', colorKey: 'gold',       hot: true },
    { type: 12, name: 'Artisan Pretzel',   emoji: '🥨', colorKey: 'nutmeg',     hot: false },
    { type: 13, name: 'Glazed Donut',      emoji: '🍩', colorKey: 'berry',      hot: false },
    { type: 14, name: 'Café Espresso',     emoji: '☕', colorKey: 'nutmeg',     hot: true },
    { type: 15, name: 'Wild Strawberry',   emoji: '🍓', colorKey: 'berry',      hot: false },
    { type: 16, name: 'Frosted Cupcake',   emoji: '🧁', colorKey: 'gold',       hot: false },
    { type: 17, name: 'Salmon Nigiri',     emoji: '🍣', colorKey: 'orange',     hot: false },
    { type: 18, name: 'Alpine Cheese',     emoji: '🧀', colorKey: 'gold',       hot: false },
    { type: 19, name: 'Fresh Watermelon',  emoji: '🍉', colorKey: 'terracotta', hot: false },
    { type: 20, name: "Chef's Cutlery",    emoji: '🍴', colorKey: 'nutmeg',     hot: false },
    { type: 21, name: 'Dim Sum Gyoza',     emoji: '🥟', colorKey: 'gold',       hot: true },
    { type: 22, name: 'Gelato Swirl Cone', emoji: '🍦', colorKey: 'berry',      hot: false },
    { type: 23, name: 'Botanical Spritz',  emoji: '🍸', colorKey: 'gold',       hot: false }
];

class FlavorParticle {
    constructor(x, y, vx, vy, color, size, type = 'star', maxLife = 1.0) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.color = color;
        this.size = size;
        this.type = type; // 'star', 'fleck', 'leaf', 'ring'
        this.life = maxLife;
        this.maxLife = maxLife;
        this.rot = Math.random() * Math.PI * 2;
        this.rotSpeed = (Math.random() - 0.5) * 0.18;
    }

    update(dt) {
        this.x += this.vx * 60 * dt;
        this.y += this.vy * 60 * dt;
        this.vx *= 0.95;
        this.vy = this.vy * 0.95 + 0.035; // gentle gravity drift
        this.rot += this.rotSpeed;
        this.life -= dt * 1.1;
    }

    draw(ctx) {
        if (this.life <= 0) return;
        const progress = Math.max(0, this.life / this.maxLife);
        const alpha = Math.min(1, progress * 1.25);
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rot);

        ctx.fillStyle = `${this.color}${alpha.toFixed(3)})`;
        ctx.strokeStyle = `${this.color}${alpha.toFixed(3)})`;

        if (this.type === 'star') {
            const s = this.size * (0.4 + 0.6 * progress);
            ctx.beginPath();
            ctx.moveTo(0, -s);
            ctx.quadraticCurveTo(0, 0, s, 0);
            ctx.quadraticCurveTo(0, 0, 0, s);
            ctx.quadraticCurveTo(0, 0, -s, 0);
            ctx.quadraticCurveTo(0, 0, 0, -s);
            ctx.fill();
        } else if (this.type === 'leaf') {
            const s = this.size * progress;
            ctx.beginPath();
            ctx.ellipse(0, 0, s, s * 0.45, 0, 0, Math.PI * 2);
            ctx.fill();
        } else if (this.type === 'ring') {
            const r = this.size * (1 + (1 - progress) * 2.2);
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.arc(0, 0, r, 0, Math.PI * 2);
            ctx.stroke();
        } else {
            // Seasoning fleck
            ctx.beginPath();
            ctx.arc(0, 0, this.size * 0.55 * progress, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }
}

class AmbientCulinaryEngine {
    constructor(canvas, prefersReducedMotion) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d', { alpha: true });
        this.prefersReducedMotion = prefersReducedMotion;
        this.items = [];
        this.particles = [];

        this.mouse = {
            x: -9999,
            y: -9999,
            prevX: -9999,
            prevY: -9999,
            vx: 0,
            vy: 0,
            active: false
        };

        this.draggedItem = null;
        this.dragOffset = { x: 0, y: 0 };
        this.lastTrailPos = { x: -9999, y: -9999 };

        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.dpr = Math.min(window.devicePixelRatio || 1, 2);
        this.isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        this.isRunning = true;
        this.lastTime = performance.now();
        this.globalTime = 0;

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
            }, 100);
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
            // Dark Bistro theme: warm, appetizing, glowing tones
            return {
                terracotta: 'rgba(242, 115, 82, ',
                gold: 'rgba(246, 188, 72, ',
                sage: 'rgba(132, 196, 126, ',
                orange: 'rgba(246, 144, 62, ',
                berry: 'rgba(238, 102, 138, ',
                nutmeg: 'rgba(198, 142, 102, ',
                cream: 'rgba(250, 240, 222, ',
                steam: 'rgba(255, 255, 255, '
            };
        } else {
            // Light Cream Editorial theme: refined, crisp culinary watercolor tones
            return {
                terracotta: 'rgba(198, 78, 52, ',
                gold: 'rgba(206, 138, 32, ',
                sage: 'rgba(84, 136, 78, ',
                orange: 'rgba(216, 112, 38, ',
                berry: 'rgba(186, 58, 92, ',
                nutmeg: 'rgba(146, 94, 62, ',
                cream: 'rgba(118, 104, 88, ',
                steam: 'rgba(140, 136, 130, '
            };
        }
    }

    initItems() {
        // Balanced, aesthetic density: 18-22 on desktop, 12-14 on tablet, 8 on mobile
        let count = 20;
        if (this.width < 768) {
            count = 8;
        } else if (this.width < 1024) {
            count = 13;
        }

        const palettes = this.getPalettes();
        this.items = [];

        // Shuffle food definitions to ensure balanced variety
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
        const y = initialScatter ? Math.random() * this.height : this.height + 60 + Math.random() * 80;

        // Elegant responsive scaling: crisp enough to appreciate culinary craftsmanship
        const baseSize = isMobile ? 20 : (isTablet ? 25 : 30);
        const sizeVariance = isMobile ? 4 : 7;
        const size = baseSize + Math.random() * sizeVariance;

        const def = FOOD_DEFINITIONS.find(d => d.type === type) || FOOD_DEFINITIONS[0];

        // Opacity calibrated to be clearly visible as a chic culinary watermark without obstructing text
        const baseAlpha = this.isDark ? (0.16 + Math.random() * 0.07) : (0.13 + Math.random() * 0.06);
        const baseVy = -0.16 - Math.random() * 0.18; // Gentle natural thermal rise

        return {
            type: def.type,
            name: def.name,
            emoji: def.emoji,
            hot: def.hot,
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
            steamPrefix: palettes.steam,
            alpha: baseAlpha,
            baseAlpha,
            targetAlpha: baseAlpha,
            scale: initialScatter ? 1.0 : 0.2, // Newly spawned items pop in
            targetScale: 1.0,
            squish: 1.0,
            vx: (Math.random() - 0.5) * 0.2,
            vy: baseVy,
            baseVy,
            angle: (Math.random() - 0.5) * 0.4,
            rotSpeed: (Math.random() - 0.5) * 0.004,
            wobble: Math.random() * Math.PI * 2,
            wobbleSpeed: 0.012 + Math.random() * 0.010,
            wobbleWidth: 0.22 + Math.random() * 0.26,
            interactiveSpin: 0,
            isHovered: false,
            hoverProgress: 0,
            isGrabbed: false,
            steamPhase: Math.random() * Math.PI * 2
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
            item.steamPrefix = palettes.steam;
            item.baseAlpha = this.isDark ? (0.16 + Math.random() * 0.07) : (0.13 + Math.random() * 0.06);
            item.targetAlpha = item.baseAlpha;
        });
    }

    initInteractions() {
        // Track pointer position smoothly
        window.addEventListener('pointermove', (e) => {
            const curX = e.clientX;
            const curY = e.clientY;

            if (this.mouse.active) {
                this.mouse.vx = curX - this.mouse.x;
                this.mouse.vy = curY - this.mouse.y;
            }

            this.mouse.x = curX;
            this.mouse.y = curY;
            this.mouse.active = true;

            // Dynamic cursor cue: grab indicator when hovering near a food item on non-interactive page areas
            const isUiElement = !!e.target.closest('a, button, input, select, textarea, [role="button"], .tab-btn, .fav-btn, .tubelight-bulb, .tubelight-string, .tubelight-wrapper, .modal, .toast, .navbar-brand');
            if (!isUiElement) {
                if (this.draggedItem) {
                    document.body.style.cursor = 'grabbing';
                } else {
                    const isNearItem = this.items.some(it => Math.hypot(it.x - curX, it.y - curY) < it.size * 1.6);
                    document.body.style.cursor = isNearItem ? 'grab' : '';
                }
            } else if (!this.draggedItem) {
                document.body.style.cursor = '';
            }

            // Handle Dragging
            if (this.draggedItem) {
                const prevX = this.draggedItem.x;
                const prevY = this.draggedItem.y;
                this.draggedItem.x = curX + this.dragOffset.x;
                this.draggedItem.y = curY + this.dragOffset.y;
                this.draggedItem.vx = (this.draggedItem.x - prevX) * 0.45;
                this.draggedItem.vy = (this.draggedItem.y - prevY) * 0.45;
                this.draggedItem.interactiveSpin = Math.max(-0.2, Math.min(0.2, this.draggedItem.vx * 0.03));

                // Emit aroma sparkles while tossing
                if (Math.random() > 0.4 && this.particles.length < 50) {
                    this.particles.push(new FlavorParticle(
                        this.draggedItem.x,
                        this.draggedItem.y,
                        (Math.random() - 0.5) * 1.8,
                        (Math.random() - 0.5) * 1.8,
                        this.draggedItem.colorPrefix,
                        2.4 + Math.random() * 2,
                        Math.random() > 0.5 ? 'star' : 'fleck',
                        0.7
                    ));
                }
            } else {
                // Interactive Cursor Trail: Seasoning spice flecks float behind cursor
                const dTrail = Math.hypot(curX - this.lastTrailPos.x, curY - this.lastTrailPos.y);
                if (dTrail > 24 && this.particles.length < 55) {
                    this.lastTrailPos = { x: curX, y: curY };
                    const palettes = this.getPalettes();
                    const pColors = [palettes.gold, palettes.terracotta, palettes.sage, palettes.orange];
                    const chosenColor = pColors[Math.floor(Math.random() * pColors.length)];

                    this.particles.push(new FlavorParticle(
                        curX + (Math.random() - 0.5) * 14,
                        curY + (Math.random() - 0.5) * 14,
                        (Math.random() - 0.5) * 1.2,
                        (Math.random() - 0.5) * 1.2 - 0.4,
                        chosenColor,
                        2.0 + Math.random() * 2.2,
                        Math.random() > 0.65 ? 'star' : (Math.random() > 0.5 ? 'leaf' : 'fleck'),
                        0.7 + Math.random() * 0.4
                    ));
                }
            }
        }, { passive: true });

        document.addEventListener('mouseleave', () => {
            this.mouse.active = false;
            this.mouse.x = -9999;
            this.mouse.y = -9999;
            document.body.style.cursor = '';
            if (this.draggedItem) {
                this.draggedItem.isGrabbed = false;
                this.draggedItem = null;
            }
        });

        // Pointer Down: Grab element or trigger Flavor Pop Burst
        window.addEventListener('pointerdown', (e) => {
            if (this.prefersReducedMotion) return;

            const clickX = e.clientX;
            const clickY = e.clientY;
            const isUiElement = !!e.target.closest('a, button, input, select, textarea, [role="button"], .tab-btn, .fav-btn, .tubelight-bulb, .tubelight-string, .tubelight-wrapper, .modal, .toast, .navbar-brand');

            let hitItem = null;
            for (let i = this.items.length - 1; i >= 0; i--) {
                const item = this.items[i];
                const dist = Math.hypot(item.x - clickX, item.y - clickY);
                if (dist < item.size * 1.6) {
                    hitItem = item;
                    break;
                }
            }

            if (hitItem) {
                // Tactile bouncy squash & stretch
                hitItem.squish = 0.65;
                hitItem.scale = 1.38;
                hitItem.interactiveSpin = (Math.random() > 0.5 ? 1 : -1) * 0.18;
                hitItem.vy -= 1.8; // buoyant hop

                this.triggerFlavorBurst(hitItem.x, hitItem.y, hitItem.colorPrefix, 12);

                if (!isUiElement) {
                    this.draggedItem = hitItem;
                    hitItem.isGrabbed = true;
                    this.dragOffset = { x: hitItem.x - clickX, y: hitItem.y - clickY };
                    document.body.style.cursor = 'grabbing';
                }
            } else if (!isUiElement) {
                // Clicked on empty space: spawn a mini seasoning splash & a new culinary element
                const palettes = this.getPalettes();
                this.triggerFlavorBurst(clickX, clickY, palettes.gold, 8);

                const maxAllowed = this.width < 768 ? 12 : (this.width < 1024 ? 18 : 30);
                if (this.items.length < maxAllowed) {
                    const randomType = Math.floor(Math.random() * FOOD_DEFINITIONS.length);
                    const newItem = this.createItem(randomType, palettes, false);
                    newItem.x = clickX;
                    newItem.y = clickY;
                    newItem.scale = 0.2;
                    newItem.targetScale = 1.0;
                    newItem.vy = -1.2 - Math.random() * 0.6;
                    newItem.interactiveSpin = (Math.random() - 0.5) * 0.16;
                    this.items.push(newItem);
                }
            }
        }, { passive: true });

        // Pointer Up: Release thrown item with momentum
        window.addEventListener('pointerup', () => {
            document.body.style.cursor = '';
            if (this.draggedItem) {
                this.draggedItem.isGrabbed = false;
                // Clamp release velocity
                this.draggedItem.vx = Math.max(-7, Math.min(7, this.draggedItem.vx));
                this.draggedItem.vy = Math.max(-7, Math.min(7, this.draggedItem.vy));
                this.draggedItem = null;
            }
        }, { passive: true });
    }

    triggerFlavorBurst(x, y, primaryColor, count = 10) {
        const palettes = this.getPalettes();
        const colors = [primaryColor, palettes.gold, palettes.terracotta, palettes.sage, palettes.orange, palettes.berry];

        for (let k = 0; k < count; k++) {
            const angle = (k / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
            const speed = 1.8 + Math.random() * 3.8;
            const pColor = colors[k % colors.length];
            const pType = k % 4 === 0 ? 'star' : (k % 4 === 1 ? 'leaf' : (k % 4 === 2 ? 'ring' : 'fleck'));

            this.particles.push(new FlavorParticle(
                x, y,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed - 0.6,
                pColor,
                2.6 + Math.random() * 2.8,
                pType,
                0.9 + Math.random() * 0.45
            ));
        }
    }

    loop(timestamp) {
        if (!this.isRunning) return;

        const dt = Math.min((timestamp - this.lastTime) / 1000, 0.1);
        this.lastTime = timestamp;
        this.globalTime += dt;

        this.ctx.clearRect(0, 0, this.width, this.height);

        // 1. Update and draw particles (seasoning trail, flavor bursts)
        this.updateAndDrawParticles(dt);

        // 2. Update and draw culinary food items
        this.updateAndDrawItems(dt);

        requestAnimationFrame((t) => this.loop(t));
    }

    renderStatic() {
        this.ctx.clearRect(0, 0, this.width, this.height);
        for (let i = 0; i < this.items.length; i++) {
            this.drawFoodItem(this.items[i]);
        }
    }

    updateAndDrawParticles(dt) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.update(dt);
            if (p.life <= 0) {
                this.particles.splice(i, 1);
            } else {
                p.draw(this.ctx);
            }
        }
    }

    updateAndDrawItems(dt) {
        const mouseX = this.mouse.x;
        const mouseY = this.mouse.y;
        const mouseActive = this.mouse.active;
        const proximityRadius = 150;

        for (let i = 0; i < this.items.length; i++) {
            const item = this.items[i];

            // 1. Natural slow thermal buoyancy & horizontal breeze sway
            item.wobble += item.wobbleSpeed;
            const sway = Math.sin(item.wobble) * item.wobbleWidth;
            item.steamPhase += 0.04;

            // Decay squish & spin smoothly toward baseline
            if (item.squish < 1.0) {
                item.squish += (1.0 - item.squish) * 0.12;
            }
            if (Math.abs(item.interactiveSpin) > 0.001) {
                item.angle += item.interactiveSpin;
                item.interactiveSpin *= 0.94;
            }

            // 2. Proximity Magnetic Interaction
            let isHovered = false;
            let distToMouse = 9999;

            if (mouseActive && !item.isGrabbed) {
                const dx = item.x - mouseX;
                const dy = item.y - mouseY;
                distToMouse = Math.hypot(dx, dy);

                if (distToMouse < proximityRadius && distToMouse > 2) {
                    isHovered = true;
                    const force = (proximityRadius - distToMouse) / proximityRadius;

                    // Soft thermal air displacement from cursor
                    item.vx += (dx / distToMouse) * force * 0.45;
                    item.vy += (dy / distToMouse) * force * 0.35;

                    // Soft tilt toward cursor motion
                    item.angle += (this.mouse.vx * 0.005) * force;
                }
            }

            item.isHovered = isHovered;

            // Smooth spring interpolation for hover progress (0 -> 1)
            const targetHover = isHovered ? 1.0 : 0.0;
            item.hoverProgress += (targetHover - item.hoverProgress) * 0.14;

            // Target scale & luminous alpha response
            item.targetScale = isHovered ? 1.34 : 1.0;
            item.targetAlpha = isHovered ? 0.85 : item.baseAlpha;

            item.scale += (item.targetScale - item.scale) * 0.12;
            item.alpha += (item.targetAlpha - item.alpha) * 0.12;

            if (!item.isGrabbed) {
                // Velocity damping back to gentle baseline updraft
                item.vx *= 0.94;
                item.vy = item.vy * 0.95 + item.baseVy * 0.05;

                item.x += (item.vx + sway) * 60 * dt;
                item.y += item.vy * 60 * dt;
                item.angle += item.rotSpeed;

                // Screen boundary bounce on toss or soft wrapping
                const r = item.size * 0.7;
                if (item.x < r) {
                    item.x = r;
                    item.vx = Math.abs(item.vx) * 0.65;
                } else if (item.x > this.width - r) {
                    item.x = this.width - r;
                    item.vx = -Math.abs(item.vx) * 0.65;
                }

                const margin = item.size + 65;
                if (item.y < -margin) {
                    item.y = this.height + margin;
                    item.x = Math.random() * this.width;
                }
                if (item.x < -margin) {
                    item.x = this.width + margin;
                } else if (item.x > this.width + margin) {
                    item.x = -margin;
                }
            }

            // Draw culinary element
            this.drawFoodItem(item);
        }

        // Draw interactive tooltip badges on top of all elements so they are never obscured
        for (let i = 0; i < this.items.length; i++) {
            if (this.items[i].hoverProgress > 0.12) {
                this.drawHoverBadge(this.items[i]);
            }
        }
    }

    drawHoverBadge(item) {
        const ctx = this.ctx;
        const progress = item.hoverProgress;
        const size = item.size * item.scale;

        const text = `${item.emoji}  ${item.name}`;
        ctx.font = '600 12px -apple-system, BlinkMacSystemFont, "Plus Jakarta Sans", "Outfit", Inter, sans-serif';
        const textMetrics = ctx.measureText(text);
        const paddingX = 11;
        const pillWidth = textMetrics.width + paddingX * 2;
        const pillHeight = 24;

        // Ensure badge stays cleanly within the viewport
        const badgeX = Math.max(pillWidth / 2 + 12, Math.min(this.width - pillWidth / 2 - 12, item.x));
        const badgeY = Math.max(pillHeight / 2 + 12, item.y - size * 0.95 - 18 * progress);

        ctx.save();
        ctx.translate(badgeX, badgeY);
        ctx.globalAlpha = Math.min(1, progress * 1.35);

        // Badge pill background
        ctx.beginPath();
        if (ctx.roundRect) {
            ctx.roundRect(-pillWidth / 2, -pillHeight / 2, pillWidth, pillHeight, 12);
        } else {
            ctx.rect(-pillWidth / 2, -pillHeight / 2, pillWidth, pillHeight);
        }

        if (this.isDark) {
            ctx.fillStyle = 'rgba(28, 22, 18, 0.92)';
            ctx.strokeStyle = `${item.colorPrefix}0.65)`;
        } else {
            ctx.fillStyle = 'rgba(255, 252, 248, 0.96)';
            ctx.strokeStyle = `${item.colorPrefix}0.50)`;
        }

        ctx.lineWidth = 1.3;
        ctx.fill();
        ctx.stroke();

        // Badge text
        ctx.fillStyle = this.isDark ? '#fbf4ee' : '#261b15';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, 0, 0.5);

        ctx.restore();
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
        const steam = item.steamPrefix;

        ctx.save();
        ctx.translate(item.x, item.y);
        ctx.rotate(item.angle);
        ctx.scale(item.squish, 2.0 - item.squish); // Squash & stretch bounce

        // Warm culinary aura bloom when hovered
        if (item.hoverProgress > 0.05) {
            const auraR = size * 1.5;
            const auraGrad = ctx.createRadialGradient(0, 0, size * 0.2, 0, 0, auraR);
            auraGrad.addColorStop(0, `${color}${(item.hoverProgress * 0.28).toFixed(3)})`);
            auraGrad.addColorStop(1, `${color}0)`);
            ctx.fillStyle = auraGrad;
            ctx.beginPath();
            ctx.arc(0, 0, auraR, 0, Math.PI * 2);
            ctx.fill();
        }

        switch (item.type) {
            case 0:  this.drawPizza(ctx, size, color, alpha, item.steamPhase); break;
            case 1:  this.drawBurger(ctx, size, color, nutmeg, sage, alpha); break;
            case 2:  this.drawCarrot(ctx, size, orange, sage, alpha); break;
            case 3:  this.drawAvocado(ctx, size, sage, nutmeg, alpha); break;
            case 4:  this.drawTomato(ctx, size, color, sage, alpha); break;
            case 5:  this.drawCitrus(ctx, size, gold, alpha); break;
            case 6:  this.drawApple(ctx, size, color, sage, nutmeg, alpha); break;
            case 7:  this.drawCherries(ctx, size, berry, sage, alpha); break;
            case 8:  this.drawCroissant(ctx, size, gold, alpha, item.steamPhase); break;
            case 9:  this.drawHerbLeaf(ctx, size, sage, alpha); break;
            case 10: this.drawRamen(ctx, size, color, nutmeg, gold, alpha, item.steamPhase); break;
            case 11: this.drawTaco(ctx, size, gold, sage, color, alpha); break;
            case 12: this.drawPretzel(ctx, size, nutmeg, alpha); break;
            case 13: this.drawDonut(ctx, size, berry, gold, alpha); break;
            case 14: this.drawEspresso(ctx, size, nutmeg, cream, alpha, item.steamPhase); break;
            case 15: this.drawStrawberry(ctx, size, berry, sage, gold, alpha); break;
            case 16: this.drawCupcake(ctx, size, berry, gold, alpha); break;
            case 17: this.drawSushi(ctx, size, orange, cream, alpha); break;
            case 18: this.drawCheese(ctx, size, gold, alpha); break;
            case 19: this.drawWatermelon(ctx, size, color, sage, alpha); break;
            case 20: this.drawUtensils(ctx, size, nutmeg, alpha); break;
            case 21: this.drawDumpling(ctx, size, gold, alpha, item.steamPhase); break;
            case 22: this.drawIceCream(ctx, size, berry, nutmeg, alpha); break;
            case 23: this.drawCocktail(ctx, size, gold, sage, alpha); break;
        }

        ctx.restore();
    }

    // -------------------------------------------------------------------------
    // 24 PROCEDURAL MINIMAL CULINARY VECTOR SILHOUETTES
    // -------------------------------------------------------------------------

    // 0. Artisan Pizza Slice with steam
    drawPizza(ctx, size, color, alpha, steamPhase) {
        const r = size * 0.92;
        const halfAngle = 0.38;

        ctx.fillStyle = `${color}${alpha.toFixed(3)})`;
        ctx.strokeStyle = `${color}${(alpha * 1.3).toFixed(3)})`;
        ctx.lineWidth = 1.3;

        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(r * Math.sin(halfAngle), -r * Math.cos(halfAngle));
        ctx.arc(0, 0, r, -Math.PI / 2 + halfAngle, -Math.PI / 2 - halfAngle, true);
        ctx.closePath();
        ctx.fill();

        // Crust edge
        ctx.beginPath();
        ctx.arc(0, 0, r, -Math.PI / 2 + halfAngle, -Math.PI / 2 - halfAngle, true);
        ctx.lineWidth = 2.6;
        ctx.stroke();

        // Pepperoni spots
        ctx.fillStyle = `${color}${(alpha * 1.6).toFixed(3)})`;
        const pR = size * 0.11;
        ctx.beginPath();
        ctx.arc(0, -r * 0.55, pR, 0, Math.PI * 2);
        ctx.arc(-r * 0.16, -r * 0.72, pR * 0.85, 0, Math.PI * 2);
        ctx.arc(r * 0.15, -r * 0.36, pR * 0.9, 0, Math.PI * 2);
        ctx.fill();

        // Steam wisp
        this.drawSteam(ctx, 0, -r * 0.85, size * 0.4, alpha * 0.8, steamPhase);
    }

    // 1. Gourmet Burger
    drawBurger(ctx, size, color, nutmeg, sage, alpha) {
        const w = size * 1.15;
        const h = size * 0.88;

        ctx.fillStyle = `${color}${alpha.toFixed(3)})`;
        ctx.strokeStyle = `${color}${(alpha * 1.3).toFixed(3)})`;
        ctx.lineWidth = 1.2;

        // Top Bun
        ctx.beginPath();
        ctx.arc(0, -h * 0.14, w * 0.48, Math.PI, 0);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Sesame seeds
        ctx.fillStyle = `${color}${(alpha * 1.7).toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(-w * 0.18, -h * 0.35, 1.2, 0, Math.PI * 2);
        ctx.arc(0, -h * 0.44, 1.2, 0, Math.PI * 2);
        ctx.arc(w * 0.2, -h * 0.33, 1.2, 0, Math.PI * 2);
        ctx.fill();

        // Wavy lettuce line
        ctx.strokeStyle = `${sage}${(alpha * 1.4).toFixed(3)})`;
        ctx.beginPath();
        ctx.moveTo(-w * 0.5, -h * 0.08);
        ctx.quadraticCurveTo(-w * 0.25, -h * 0.01, 0, -h * 0.08);
        ctx.quadraticCurveTo(w * 0.25, -h * 0.01, w * 0.5, -h * 0.08);
        ctx.lineWidth = 2.0;
        ctx.stroke();

        // Patty
        ctx.fillStyle = `${nutmeg}${(alpha * 1.4).toFixed(3)})`;
        ctx.beginPath();
        if (ctx.roundRect) {
            ctx.roundRect(-w * 0.46, 0, w * 0.92, h * 0.22, 2.5);
        } else {
            ctx.rect(-w * 0.46, 0, w * 0.92, h * 0.22);
        }
        ctx.fill();

        // Bottom bun
        ctx.fillStyle = `${color}${alpha.toFixed(3)})`;
        ctx.beginPath();
        if (ctx.roundRect) {
            ctx.roundRect(-w * 0.44, h * 0.26, w * 0.88, h * 0.18, [1, 1, 3, 3]);
        } else {
            ctx.rect(-w * 0.44, h * 0.26, w * 0.88, h * 0.18);
        }
        ctx.fill();
        ctx.lineWidth = 1.0;
        ctx.stroke();
    }

    // 2. Crisp Carrot
    drawCarrot(ctx, size, orange, sage, alpha) {
        const w = size * 0.72;
        const h = size * 1.2;

        ctx.fillStyle = `${orange}${alpha.toFixed(3)})`;
        ctx.strokeStyle = `${orange}${(alpha * 1.3).toFixed(3)})`;
        ctx.lineWidth = 1.2;

        // Body
        ctx.beginPath();
        ctx.moveTo(-w * 0.38, -h * 0.3);
        ctx.quadraticCurveTo(0, -h * 0.38, w * 0.38, -h * 0.3);
        ctx.quadraticCurveTo(w * 0.2, h * 0.2, 0, h * 0.56);
        ctx.quadraticCurveTo(-w * 0.2, h * 0.2, -w * 0.38, -h * 0.3);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Grooves
        ctx.strokeStyle = `${orange}${(alpha * 1.4).toFixed(3)})`;
        ctx.beginPath();
        ctx.moveTo(-w * 0.22, -h * 0.08);
        ctx.lineTo(w * 0.16, -h * 0.06);
        ctx.moveTo(-w * 0.16, h * 0.14);
        ctx.lineTo(w * 0.18, h * 0.16);
        ctx.stroke();

        // Feather greens top
        ctx.strokeStyle = `${sage}${(alpha * 1.35).toFixed(3)})`;
        ctx.beginPath();
        ctx.moveTo(0, -h * 0.34);
        ctx.quadraticCurveTo(-w * 0.3, -h * 0.56, -w * 0.45, -h * 0.52);
        ctx.moveTo(0, -h * 0.34);
        ctx.quadraticCurveTo(0, -h * 0.66, 0, -h * 0.62);
        ctx.moveTo(0, -h * 0.34);
        ctx.quadraticCurveTo(w * 0.3, -h * 0.56, w * 0.45, -h * 0.52);
        ctx.stroke();
    }

    // 3. Hass Avocado
    drawAvocado(ctx, size, sage, nutmeg, alpha) {
        const w = size * 0.82;
        const h = size * 1.1;

        ctx.fillStyle = `${sage}${alpha.toFixed(3)})`;
        ctx.strokeStyle = `${sage}${(alpha * 1.3).toFixed(3)})`;
        ctx.lineWidth = 1.2;

        ctx.beginPath();
        ctx.moveTo(0, -h * 0.5);
        ctx.bezierCurveTo(w * 0.36, -h * 0.45, w * 0.56, 0, w * 0.46, h * 0.36);
        ctx.bezierCurveTo(w * 0.36, h * 0.56, -w * 0.36, h * 0.56, -w * 0.46, h * 0.36);
        ctx.bezierCurveTo(-w * 0.56, 0, -w * 0.36, -h * 0.45, 0, -h * 0.5);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Pit
        ctx.fillStyle = `${nutmeg}${(alpha * 1.6).toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(0, h * 0.15, w * 0.23, 0, Math.PI * 2);
        ctx.fill();
    }

    // 4. Cherry Tomato
    drawTomato(ctx, size, color, sage, alpha) {
        const r = size * 0.5;

        ctx.fillStyle = `${color}${alpha.toFixed(3)})`;
        ctx.strokeStyle = `${color}${(alpha * 1.3).toFixed(3)})`;
        ctx.lineWidth = 1.2;

        ctx.beginPath();
        ctx.arc(0, r * 0.12, r * 0.88, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Stem & Calyx
        ctx.strokeStyle = `${sage}${(alpha * 1.45).toFixed(3)})`;
        ctx.beginPath();
        ctx.moveTo(0, -r * 0.65);
        ctx.lineTo(-r * 0.4, -r * 0.5);
        ctx.moveTo(0, -r * 0.65);
        ctx.lineTo(r * 0.4, -r * 0.5);
        ctx.moveTo(0, -r * 0.65);
        ctx.lineTo(0, -r * 0.95);
        ctx.stroke();
    }

    // 5. Meyer Lemon Slice
    drawCitrus(ctx, size, gold, alpha) {
        const r = size * 0.54;

        ctx.strokeStyle = `${gold}${(alpha * 1.35).toFixed(3)})`;
        ctx.lineWidth = 1.3;

        // Outer rind
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.stroke();

        // Segments
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
        const w = size * 0.84;
        const h = size * 0.84;

        ctx.fillStyle = `${color}${alpha.toFixed(3)})`;
        ctx.strokeStyle = `${color}${(alpha * 1.3).toFixed(3)})`;
        ctx.lineWidth = 1.2;

        ctx.beginPath();
        ctx.moveTo(0, -h * 0.32);
        ctx.bezierCurveTo(w * 0.46, -h * 0.52, w * 0.6, h * 0.26, w * 0.25, h * 0.52);
        ctx.bezierCurveTo(w * 0.1, h * 0.56, -w * 0.1, h * 0.56, -w * 0.25, h * 0.52);
        ctx.bezierCurveTo(-w * 0.6, h * 0.26, -w * 0.46, -h * 0.52, 0, -h * 0.32);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Stem
        ctx.strokeStyle = `${nutmeg}${(alpha * 1.45).toFixed(3)})`;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(0, -h * 0.32);
        ctx.quadraticCurveTo(w * 0.14, -h * 0.58, w * 0.08, -h * 0.7);
        ctx.stroke();

        // Leaf
        ctx.fillStyle = `${sage}${(alpha * 1.4).toFixed(3)})`;
        ctx.beginPath();
        ctx.ellipse(w * 0.16, -h * 0.55, w * 0.12, h * 0.07, 0.4, 0, Math.PI * 2);
        ctx.fill();
    }

    // 7. Sweet Cherries
    drawCherries(ctx, size, berry, sage, alpha) {
        const r = size * 0.25;
        const w = size * 0.8;
        const h = size * 0.9;

        ctx.fillStyle = `${berry}${alpha.toFixed(3)})`;
        ctx.strokeStyle = `${berry}${(alpha * 1.3).toFixed(3)})`;
        ctx.lineWidth = 1.2;

        ctx.beginPath();
        ctx.arc(-w * 0.26, h * 0.24, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(w * 0.24, h * 0.16, r * 0.92, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Stems
        ctx.strokeStyle = `${sage}${(alpha * 1.4).toFixed(3)})`;
        ctx.beginPath();
        ctx.moveTo(-w * 0.26, h * 0.24 - r);
        ctx.quadraticCurveTo(-w * 0.1, -h * 0.18, 0, -h * 0.38);
        ctx.moveTo(w * 0.24, h * 0.16 - r * 0.92);
        ctx.quadraticCurveTo(w * 0.14, -h * 0.12, 0, -h * 0.38);
        ctx.stroke();

        // Leaf
        ctx.fillStyle = `${sage}${(alpha * 1.4).toFixed(3)})`;
        ctx.beginPath();
        ctx.ellipse(w * 0.12, -h * 0.42, w * 0.12, h * 0.07, -0.3, 0, Math.PI * 2);
        ctx.fill();
    }

    // 8. Butter Croissant
    drawCroissant(ctx, size, gold, alpha, steamPhase) {
        const w = size * 1.05;
        const h = size * 0.65;

        ctx.fillStyle = `${gold}${alpha.toFixed(3)})`;
        ctx.strokeStyle = `${gold}${(alpha * 1.3).toFixed(3)})`;
        ctx.lineWidth = 1.2;

        ctx.beginPath();
        ctx.moveTo(-w * 0.48, h * 0.24);
        ctx.bezierCurveTo(-w * 0.34, -h * 0.52, w * 0.34, -h * 0.52, w * 0.48, h * 0.24);
        ctx.bezierCurveTo(w * 0.28, -h * 0.12, -w * 0.28, -h * 0.12, -w * 0.48, h * 0.24);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Seams
        ctx.strokeStyle = `${gold}${(alpha * 1.45).toFixed(3)})`;
        ctx.beginPath();
        ctx.moveTo(-w * 0.16, -h * 0.36);
        ctx.lineTo(-w * 0.08, -h * 0.05);
        ctx.moveTo(0, -h * 0.4);
        ctx.lineTo(0, -h * 0.05);
        ctx.moveTo(w * 0.16, -h * 0.36);
        ctx.lineTo(w * 0.08, -h * 0.05);
        ctx.stroke();

        this.drawSteam(ctx, 0, -h * 0.45, size * 0.35, alpha * 0.7, steamPhase);
    }

    // 9. Sweet Basil Leaf
    drawHerbLeaf(ctx, size, sage, alpha) {
        ctx.fillStyle = `${sage}${alpha.toFixed(3)})`;
        ctx.beginPath();
        ctx.moveTo(0, size * 0.68);
        ctx.bezierCurveTo(-size * 0.46, size * 0.2, -size * 0.44, -size * 0.46, 0, -size * 0.68);
        ctx.bezierCurveTo(size * 0.44, -size * 0.46, size * 0.46, size * 0.2, 0, size * 0.68);
        ctx.fill();

        ctx.strokeStyle = `${sage}${(alpha * 1.4).toFixed(3)})`;
        ctx.lineWidth = 1.0;
        ctx.beginPath();
        ctx.moveTo(0, size * 0.58);
        ctx.lineTo(0, -size * 0.48);
        ctx.stroke();
    }

    // 10. Tokyo Ramen Bowl with steam
    drawRamen(ctx, size, color, nutmeg, gold, alpha, steamPhase) {
        const w = size * 1.1;
        const h = size * 0.85;

        // Bowl contour
        ctx.fillStyle = `${color}${alpha.toFixed(3)})`;
        ctx.strokeStyle = `${color}${(alpha * 1.3).toFixed(3)})`;
        ctx.lineWidth = 1.2;

        ctx.beginPath();
        ctx.arc(0, -h * 0.05, w * 0.46, 0, Math.PI);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Base foot
        ctx.beginPath();
        ctx.moveTo(-w * 0.16, h * 0.41);
        ctx.lineTo(w * 0.16, h * 0.41);
        ctx.lineWidth = 2.2;
        ctx.stroke();

        // Noodles
        ctx.strokeStyle = `${gold}${(alpha * 1.4).toFixed(3)})`;
        ctx.lineWidth = 1.3;
        ctx.beginPath();
        ctx.moveTo(-w * 0.38, -h * 0.08);
        ctx.quadraticCurveTo(-w * 0.2, -h * 0.22, 0, -h * 0.08);
        ctx.quadraticCurveTo(w * 0.2, -h * 0.22, w * 0.38, -h * 0.08);
        ctx.stroke();

        // Chopsticks
        ctx.strokeStyle = `${nutmeg}${(alpha * 1.5).toFixed(3)})`;
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(-w * 0.48, -h * 0.18);
        ctx.lineTo(w * 0.52, -h * 0.35);
        ctx.moveTo(-w * 0.46, -h * 0.12);
        ctx.lineTo(w * 0.54, -h * 0.29);
        ctx.stroke();

        // Rising Steam
        this.drawSteam(ctx, -w * 0.15, -h * 0.28, size * 0.42, alpha * 0.85, steamPhase);
        this.drawSteam(ctx, w * 0.15, -h * 0.28, size * 0.42, alpha * 0.85, steamPhase + 1.2);
    }

    // 11. Street Taco
    drawTaco(ctx, size, gold, sage, color, alpha) {
        const w = size * 1.05;
        const h = size * 0.72;

        // Shell
        ctx.fillStyle = `${gold}${alpha.toFixed(3)})`;
        ctx.strokeStyle = `${gold}${(alpha * 1.3).toFixed(3)})`;
        ctx.lineWidth = 1.2;

        ctx.beginPath();
        ctx.arc(0, -h * 0.05, w * 0.48, 0, Math.PI);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Lettuce / Filling ruffle
        ctx.strokeStyle = `${sage}${(alpha * 1.5).toFixed(3)})`;
        ctx.lineWidth = 2.0;
        ctx.beginPath();
        ctx.moveTo(-w * 0.44, -h * 0.05);
        ctx.quadraticCurveTo(-w * 0.22, -h * 0.24, 0, -h * 0.05);
        ctx.quadraticCurveTo(w * 0.22, -h * 0.24, w * 0.44, -h * 0.05);
        ctx.stroke();

        // Tomato dice
        ctx.fillStyle = `${color}${(alpha * 1.6).toFixed(3)})`;
        ctx.fillRect(-w * 0.15, -h * 0.22, size * 0.1, size * 0.1);
        ctx.fillRect(w * 0.12, -h * 0.2, size * 0.09, size * 0.09);
    }

    // 12. Artisan Pretzel
    drawPretzel(ctx, size, nutmeg, alpha) {
        const r = size * 0.48;

        ctx.strokeStyle = `${nutmeg}${(alpha * 1.35).toFixed(3)})`;
        ctx.lineWidth = 2.4;

        // Outer heart lobes
        ctx.beginPath();
        ctx.arc(-r * 0.45, -r * 0.25, r * 0.42, Math.PI * 0.7, Math.PI * 2.3);
        ctx.arc(r * 0.45, -r * 0.25, r * 0.42, Math.PI * 0.7, Math.PI * 2.3);
        ctx.stroke();

        // Crossed arms
        ctx.beginPath();
        ctx.moveTo(-r * 0.65, -r * 0.1);
        ctx.lineTo(r * 0.4, r * 0.45);
        ctx.moveTo(r * 0.65, -r * 0.1);
        ctx.lineTo(-r * 0.4, r * 0.45);
        ctx.stroke();

        // Salt flecks
        ctx.fillStyle = `rgba(255, 255, 255, ${(alpha * 1.6).toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(-r * 0.4, -r * 0.5, 1.1, 0, Math.PI * 2);
        ctx.arc(r * 0.4, -r * 0.5, 1.1, 0, Math.PI * 2);
        ctx.arc(0, -r * 0.1, 1.1, 0, Math.PI * 2);
        ctx.fill();
    }

    // 13. Glazed Donut
    drawDonut(ctx, size, berry, gold, alpha) {
        const r = size * 0.5;

        // Donut ring
        ctx.strokeStyle = `${gold}${(alpha * 1.3).toFixed(3)})`;
        ctx.lineWidth = size * 0.34;
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.68, 0, Math.PI * 2);
        ctx.stroke();

        // Berry Frosting
        ctx.strokeStyle = `${berry}${(alpha * 1.45).toFixed(3)})`;
        ctx.lineWidth = size * 0.24;
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.68, -0.6, Math.PI * 1.5);
        ctx.stroke();

        // Sprinkles
        ctx.fillStyle = `rgba(255, 255, 255, ${(alpha * 1.7).toFixed(3)})`;
        ctx.fillRect(-r * 0.45, -r * 0.45, 3.5, 1.4);
        ctx.fillRect(r * 0.25, -r * 0.55, 1.4, 3.5);
        ctx.fillRect(-r * 0.6, 0.1, 3.5, 1.4);
    }

    // 14. Hot Espresso with steam
    drawEspresso(ctx, size, nutmeg, cream, alpha, steamPhase) {
        const w = size * 0.95;
        const h = size * 0.75;

        ctx.fillStyle = `${nutmeg}${alpha.toFixed(3)})`;
        ctx.strokeStyle = `${nutmeg}${(alpha * 1.3).toFixed(3)})`;
        ctx.lineWidth = 1.2;

        // Cup body
        ctx.beginPath();
        ctx.moveTo(-w * 0.38, -h * 0.3);
        ctx.lineTo(-w * 0.28, h * 0.3);
        ctx.quadraticCurveTo(0, h * 0.45, w * 0.28, h * 0.3);
        ctx.lineTo(w * 0.38, -h * 0.3);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Handle
        ctx.beginPath();
        ctx.arc(w * 0.42, 0, h * 0.22, -Math.PI * 0.5, Math.PI * 0.5);
        ctx.stroke();

        // Saucer
        ctx.beginPath();
        ctx.moveTo(-w * 0.52, h * 0.45);
        ctx.lineTo(w * 0.52, h * 0.45);
        ctx.lineWidth = 1.8;
        ctx.stroke();

        // Rising Steam Ribbon
        this.drawSteam(ctx, 0, -h * 0.4, size * 0.45, alpha * 0.85, steamPhase);
    }

    // 15. Wild Strawberry
    drawStrawberry(ctx, size, berry, sage, gold, alpha) {
        const w = size * 0.78;
        const h = size * 0.96;

        ctx.fillStyle = `${berry}${alpha.toFixed(3)})`;
        ctx.strokeStyle = `${berry}${(alpha * 1.3).toFixed(3)})`;
        ctx.lineWidth = 1.2;

        ctx.beginPath();
        ctx.moveTo(-w * 0.42, -h * 0.3);
        ctx.quadraticCurveTo(0, -h * 0.4, w * 0.42, -h * 0.3);
        ctx.quadraticCurveTo(w * 0.45, h * 0.15, 0, h * 0.52);
        ctx.quadraticCurveTo(-w * 0.45, h * 0.15, -w * 0.42, -h * 0.3);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Crown leaves
        ctx.fillStyle = `${sage}${(alpha * 1.4).toFixed(3)})`;
        ctx.beginPath();
        ctx.ellipse(-w * 0.22, -h * 0.38, w * 0.14, h * 0.08, -0.4, 0, Math.PI * 2);
        ctx.ellipse(0, -h * 0.42, w * 0.12, h * 0.08, 0, 0, Math.PI * 2);
        ctx.ellipse(w * 0.22, -h * 0.38, w * 0.14, h * 0.08, 0.4, 0, Math.PI * 2);
        ctx.fill();

        // Seeds
        ctx.fillStyle = `${gold}${(alpha * 1.6).toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(-w * 0.18, -h * 0.1, 1.0, 0, Math.PI * 2);
        ctx.arc(w * 0.18, -h * 0.1, 1.0, 0, Math.PI * 2);
        ctx.arc(0, h * 0.08, 1.0, 0, Math.PI * 2);
        ctx.arc(-w * 0.1, h * 0.24, 1.0, 0, Math.PI * 2);
        ctx.arc(w * 0.1, h * 0.24, 1.0, 0, Math.PI * 2);
        ctx.fill();
    }

    // 16. Frosted Cupcake
    drawCupcake(ctx, size, berry, gold, alpha) {
        const w = size * 0.95;
        const h = size * 1.05;

        // Liner
        ctx.fillStyle = `${gold}${alpha.toFixed(3)})`;
        ctx.strokeStyle = `${gold}${(alpha * 1.3).toFixed(3)})`;
        ctx.lineWidth = 1.2;

        ctx.beginPath();
        ctx.moveTo(-w * 0.38, 0);
        ctx.lineTo(-w * 0.28, h * 0.45);
        ctx.lineTo(w * 0.28, h * 0.45);
        ctx.lineTo(w * 0.38, 0);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Frosting Cloud
        ctx.fillStyle = `${berry}${(alpha * 1.35).toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(-w * 0.22, -h * 0.06, size * 0.2, Math.PI, 0);
        ctx.arc(w * 0.22, -h * 0.06, size * 0.2, Math.PI, 0);
        ctx.arc(0, -h * 0.22, size * 0.25, Math.PI, 0);
        ctx.fill();

        // Cherry on top
        ctx.fillStyle = `${berry}${(alpha * 1.7).toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(0, -h * 0.46, size * 0.11, 0, Math.PI * 2);
        ctx.fill();
    }

    // 17. Salmon Nigiri Sushi
    drawSushi(ctx, size, orange, cream, alpha) {
        const w = size * 1.15;
        const h = size * 0.65;

        // Rice block
        ctx.fillStyle = `${cream}${(alpha * 1.3).toFixed(3)})`;
        ctx.beginPath();
        if (ctx.roundRect) {
            ctx.roundRect(-w * 0.45, 0, w * 0.9, h * 0.45, 4);
        } else {
            ctx.rect(-w * 0.45, 0, w * 0.9, h * 0.45);
        }
        ctx.fill();

        // Salmon slice
        ctx.fillStyle = `${orange}${alpha.toFixed(3)})`;
        ctx.strokeStyle = `${orange}${(alpha * 1.3).toFixed(3)})`;
        ctx.lineWidth = 1.2;

        ctx.beginPath();
        ctx.moveTo(-w * 0.52, 0);
        ctx.quadraticCurveTo(0, -h * 0.35, w * 0.52, 0);
        ctx.quadraticCurveTo(0, -h * 0.1, -w * 0.52, 0);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Salmon marbling lines
        ctx.strokeStyle = `rgba(255, 255, 255, ${(alpha * 1.5).toFixed(3)})`;
        ctx.lineWidth = 1.0;
        ctx.beginPath();
        ctx.moveTo(-w * 0.25, -h * 0.18);
        ctx.lineTo(-w * 0.15, -h * 0.04);
        ctx.moveTo(w * 0.05, -h * 0.22);
        ctx.lineTo(w * 0.15, -h * 0.05);
        ctx.stroke();
    }

    // 18. Alpine Cheese Wedge
    drawCheese(ctx, size, gold, alpha) {
        const w = size * 0.95;
        const h = size * 0.75;

        ctx.fillStyle = `${gold}${alpha.toFixed(3)})`;
        ctx.strokeStyle = `${gold}${(alpha * 1.3).toFixed(3)})`;
        ctx.lineWidth = 1.2;

        ctx.beginPath();
        ctx.moveTo(-w * 0.48, h * 0.25);
        ctx.lineTo(w * 0.48, -h * 0.35);
        ctx.lineTo(w * 0.48, h * 0.25);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Holes
        ctx.fillStyle = `rgba(0, 0, 0, ${(alpha * 0.35).toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(0, h * 0.05, size * 0.08, 0, Math.PI * 2);
        ctx.arc(w * 0.25, 0, size * 0.06, 0, Math.PI * 2);
        ctx.arc(w * 0.32, h * 0.14, size * 0.05, 0, Math.PI * 2);
        ctx.fill();
    }

    // 19. Fresh Watermelon Slice
    drawWatermelon(ctx, size, color, sage, alpha) {
        const r = size * 0.65;

        // Red flesh
        ctx.fillStyle = `${color}${alpha.toFixed(3)})`;
        ctx.beginPath();
        ctx.moveTo(0, -r * 0.4);
        ctx.lineTo(-r * 0.65, r * 0.4);
        ctx.quadraticCurveTo(0, r * 0.65, r * 0.65, r * 0.4);
        ctx.closePath();
        ctx.fill();

        // Green Rind
        ctx.strokeStyle = `${sage}${(alpha * 1.4).toFixed(3)})`;
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.moveTo(-r * 0.68, r * 0.42);
        ctx.quadraticCurveTo(0, r * 0.72, r * 0.68, r * 0.42);
        ctx.stroke();

        // Seeds
        ctx.fillStyle = `rgba(30, 20, 15, ${(alpha * 1.6).toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(-r * 0.2, r * 0.15, 1.2, 0, Math.PI * 2);
        ctx.arc(r * 0.18, r * 0.18, 1.2, 0, Math.PI * 2);
        ctx.arc(0, -r * 0.08, 1.2, 0, Math.PI * 2);
        ctx.fill();
    }

    // 20. Chef's Cutlery
    drawUtensils(ctx, size, nutmeg, alpha) {
        const l = size * 0.85;

        ctx.strokeStyle = `${nutmeg}${(alpha * 1.35).toFixed(3)})`;
        ctx.lineWidth = 1.3;

        // Knife
        ctx.beginPath();
        ctx.moveTo(-l * 0.45, -l * 0.45);
        ctx.lineTo(l * 0.45, l * 0.45);
        ctx.stroke();

        // Fork
        ctx.beginPath();
        ctx.moveTo(l * 0.45, -l * 0.45);
        ctx.lineTo(-l * 0.45, l * 0.45);
        ctx.stroke();

        // Fork tines
        ctx.beginPath();
        ctx.moveTo(l * 0.45, -l * 0.45);
        ctx.lineTo(l * 0.35, -l * 0.45);
        ctx.moveTo(l * 0.45, -l * 0.45);
        ctx.lineTo(l * 0.45, -l * 0.35);
        ctx.stroke();
    }

    // 21. Dim Sum Gyoza / Dumpling
    drawDumpling(ctx, size, gold, alpha, steamPhase) {
        const w = size * 1.05;
        const h = size * 0.68;

        ctx.fillStyle = `${gold}${alpha.toFixed(3)})`;
        ctx.strokeStyle = `${gold}${(alpha * 1.3).toFixed(3)})`;
        ctx.lineWidth = 1.2;

        ctx.beginPath();
        ctx.moveTo(-w * 0.48, h * 0.2);
        ctx.quadraticCurveTo(-w * 0.2, -h * 0.45, 0, -h * 0.4);
        ctx.quadraticCurveTo(w * 0.2, -h * 0.45, w * 0.48, h * 0.2);
        ctx.quadraticCurveTo(0, h * 0.35, -w * 0.48, h * 0.2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Pleats
        ctx.strokeStyle = `${gold}${(alpha * 1.5).toFixed(3)})`;
        ctx.beginPath();
        ctx.moveTo(-w * 0.22, -h * 0.38);
        ctx.lineTo(-w * 0.15, -h * 0.1);
        ctx.moveTo(0, -h * 0.4);
        ctx.lineTo(0, -h * 0.08);
        ctx.moveTo(w * 0.22, -h * 0.38);
        ctx.lineTo(w * 0.15, -h * 0.1);
        ctx.stroke();

        this.drawSteam(ctx, 0, -h * 0.45, size * 0.38, alpha * 0.8, steamPhase);
    }

    // 22. Gelato Swirl Cone
    drawIceCream(ctx, size, berry, nutmeg, alpha) {
        const w = size * 0.82;
        const h = size * 1.1;

        // Waffle Cone
        ctx.fillStyle = `${nutmeg}${alpha.toFixed(3)})`;
        ctx.strokeStyle = `${nutmeg}${(alpha * 1.3).toFixed(3)})`;
        ctx.lineWidth = 1.2;

        ctx.beginPath();
        ctx.moveTo(-w * 0.35, 0);
        ctx.lineTo(0, h * 0.52);
        ctx.lineTo(w * 0.35, 0);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Crosshatch grid
        ctx.strokeStyle = `${nutmeg}${(alpha * 1.45).toFixed(3)})`;
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(-w * 0.18, h * 0.15);
        ctx.lineTo(w * 0.12, h * 0.32);
        ctx.moveTo(w * 0.18, h * 0.15);
        ctx.lineTo(-w * 0.12, h * 0.32);
        ctx.stroke();

        // Gelato Scoop Swirl
        ctx.fillStyle = `${berry}${(alpha * 1.35).toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(0, -h * 0.18, size * 0.3, 0, Math.PI * 2);
        ctx.fill();
    }

    // 23. Botanical Spritz / Cocktail
    drawCocktail(ctx, size, gold, sage, alpha) {
        const w = size * 0.9;
        const h = size * 1.05;

        ctx.strokeStyle = `${gold}${(alpha * 1.3).toFixed(3)})`;
        ctx.lineWidth = 1.2;

        // V-Bowl
        ctx.beginPath();
        ctx.moveTo(-w * 0.45, -h * 0.35);
        ctx.lineTo(0, 0);
        ctx.lineTo(w * 0.45, -h * 0.35);
        ctx.closePath();
        ctx.stroke();

        // Stem & Foot
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, h * 0.38);
        ctx.moveTo(-w * 0.28, h * 0.38);
        ctx.lineTo(w * 0.28, h * 0.38);
        ctx.stroke();

        // Olive on pick
        ctx.strokeStyle = `${sage}${(alpha * 1.5).toFixed(3)})`;
        ctx.beginPath();
        ctx.moveTo(-w * 0.2, -h * 0.42);
        ctx.lineTo(w * 0.15, -h * 0.08);
        ctx.stroke();

        ctx.fillStyle = `${sage}${(alpha * 1.5).toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(-w * 0.05, -h * 0.24, size * 0.08, 0, Math.PI * 2);
        ctx.fill();
    }

    // Helper: Delicate curly steam animation
    drawSteam(ctx, x, y, length, alpha, phase) {
        const steamAlpha = Math.max(0, alpha * 0.7);
        ctx.strokeStyle = `${this.getPalettes().steam}${steamAlpha.toFixed(3)})`;
        ctx.lineWidth = 1.1;

        ctx.beginPath();
        const p1 = Math.sin(phase) * 4;
        const p2 = Math.cos(phase * 0.8) * 5;

        ctx.moveTo(x, y);
        ctx.bezierCurveTo(x + p1, y - length * 0.35, x - p2, y - length * 0.7, x + p1 * 0.5, y - length);
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
