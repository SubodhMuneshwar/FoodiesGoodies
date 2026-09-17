/**
 * FoodiesGoodies Notifications Hub Engine (js/notifications.js)
 * Manages unread badge counts, drop-down notification center, and request actions.
 */

const Notifications = {
    badgeEl: null,
    drawerEl: null,

    async init() {
        this.createBellIcon();
        await this.checkUnread();
    },

    createBellIcon() {
        const nav = document.querySelector('.navbar');
        if (!nav || nav.querySelector('.notif-nav-btn')) return;

        const notifBtn = document.createElement('button');
        notifBtn.type = 'button';
        notifBtn.className = 'notif-nav-btn';
        notifBtn.setAttribute('aria-label', 'Notifications');
        notifBtn.title = 'Kitchen Notifications';
        notifBtn.innerHTML = `
            <span class="bell-wrap" style="position:relative; display:inline-flex; align-items:center;">
                <ion-icon name="notifications-outline" style="font-size:22px; color:var(--text-primary);"></ion-icon>
                <span class="notif-badge" style="display:none; position:absolute; top:-6px; right:-8px; background:#ef4444; color:#fff; font-size:10px; font-weight:800; padding:2px 6px; border-radius:10px; min-width:16px; text-align:center;">0</span>
            </span>
        `;
        notifBtn.style.cssText = 'background:transparent; border:none; cursor:pointer; padding:6px 10px; display:inline-flex; align-items:center;';

        const loginBtn = nav.querySelector('.nav-login-btn');
        if (loginBtn) {
            nav.insertBefore(notifBtn, loginBtn);
        } else {
            nav.appendChild(notifBtn);
        }

        this.badgeEl = notifBtn.querySelector('.notif-badge');
        notifBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleDrawer();
        });
    },

    async checkUnread() {
        try {
            const res = await fetch('../api/notifications.php?unread_only=1');
            if (res.ok) {
                const data = await res.json();
                if (data.success && data.data) {
                    this.updateBadge(data.data.unread_count || 0);
                }
            }
        } catch (e) {
            // Local fallback count
            this.updateBadge(2);
        }
    },

    updateBadge(count) {
        if (!this.badgeEl) return;
        if (count > 0) {
            this.badgeEl.textContent = count > 99 ? '99+' : count;
            this.badgeEl.style.display = 'inline-block';
        } else {
            this.badgeEl.style.display = 'none';
        }
    },

    async toggleDrawer() {
        let drawer = document.getElementById('notif-dropdown-drawer');
        if (!drawer) {
            drawer = document.createElement('div');
            drawer.id = 'notif-dropdown-drawer';
            drawer.style.cssText = `
                position: fixed;
                top: calc(var(--header-height) + 8px);
                right: 24px;
                width: 360px;
                max-width: 90vw;
                background: rgba(18, 18, 24, 0.98);
                border: 1px solid var(--card-border);
                border-radius: var(--radius-md);
                backdrop-filter: blur(20px);
                box-shadow: 0 16px 40px rgba(0,0,0,0.8), 0 0 20px rgba(210,168,28,0.25);
                z-index: 10002;
                padding: 18px;
                display: flex;
                flex-direction: column;
                gap: 12px;
                animation: fadeInUp 0.3s ease;
            `;
            document.body.appendChild(drawer);

            // Close on outside click
            document.addEventListener('click', (ev) => {
                if (drawer && !drawer.contains(ev.target) && !ev.target.closest('.notif-nav-btn')) {
                    drawer.remove();
                }
            });
        } else {
            drawer.remove();
            return;
        }

        // Fetch notifications
        drawer.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:10px;">
                <h4 style="color:var(--primary-gold); font-size:1rem; font-weight:800; margin:0; display:flex; align-items:center; gap:6px;">
                    <span>🔔</span> Kitchen Notifications
                </h4>
                <button type="button" id="btn-mark-all-read" style="background:transparent; border:none; color:var(--text-dim); font-size:0.75rem; cursor:pointer; font-weight:600;">Mark all read</button>
            </div>
            <div id="notif-items-list" style="display:flex; flex-direction:column; gap:10px; max-height:340px; overflow-y:auto; padding-right:4px;">
                <div style="text-align:center; padding:20px; color:var(--text-dim);">Loading notifications...</div>
            </div>
        `;

        try {
            const res = await fetch('../api/notifications.php');
            const data = await res.json();
            const notifs = (data.success && data.data && data.data.notifications) ? data.data.notifications : [
                {
                    from_user: 'Chef Gabriella Russo',
                    from_avatar: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?auto=format&fit=crop&w=150&q=80',
                    message: 'tasted and loved your Pan-Seared Salmon! 😋❤️',
                    time_ago: '15 mins ago'
                },
                {
                    from_user: 'Chef Aisha Patel',
                    from_avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80',
                    message: 'joined your Kitchen Crew as a Sous Chef! 🍳',
                    time_ago: '2 hours ago'
                }
            ];

            const listEl = drawer.querySelector('#notif-items-list');
            listEl.innerHTML = notifs.map(n => `
                <div style="display:flex; gap:10px; align-items:flex-start; padding:8px; background:rgba(255,255,255,0.04); border-radius:var(--radius-sm);">
                    <img src="${n.from_avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'}" style="width:34px; height:34px; border-radius:50%; object-fit:cover; border:1px solid var(--primary-gold); flex-shrink:0;">
                    <div style="display:flex; flex-direction:column; font-size:0.85rem; line-height:1.4;">
                        <span style="color:#ffffff;"><strong>${n.from_user}</strong> ${n.message}</span>
                        <span style="color:var(--text-dim); font-size:0.75rem; margin-top:2px;">${n.time_ago || 'recently'}</span>
                    </div>
                </div>
            `).join('');

            drawer.querySelector('#btn-mark-all-read').addEventListener('click', () => {
                this.updateBadge(0);
                fetch('../api/notifications.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'mark_read' })
                }).catch(() => {});
                drawer.remove();
            });
        } catch (e) {
            console.error('Notification error:', e);
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    Notifications.init();
});
