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
        const header = document.querySelector('header.header') || document.querySelector('header');
        if (!header || document.querySelector('.notif-nav-btn')) return;

        const isPagesDir = window.location.pathname.includes('/pages/');
        const notifUrl = isPagesDir ? 'notifications.html' : 'pages/notifications.html';

        const notifBtn = document.createElement('a');
        notifBtn.href = notifUrl;
        notifBtn.className = 'notif-nav-btn';
        notifBtn.setAttribute('aria-label', 'Kitchen Notifications');
        notifBtn.title = 'Kitchen Notifications';
        notifBtn.innerHTML = `
            <span class="bell-wrap" style="position:relative; display:inline-flex; align-items:center; justify-content:center;">
                <ion-icon name="notifications-outline"></ion-icon>
                <span class="notif-badge" style="display:none;">0</span>
            </span>
        `;

        const actionsWrap = header.querySelector('.header-actions-wrap');
        if (actionsWrap) {
            const themeBtn = actionsWrap.querySelector('.theme-toggle-btn');
            if (themeBtn) {
                actionsWrap.insertBefore(notifBtn, themeBtn);
            } else {
                actionsWrap.prepend(notifBtn);
            }
        } else {
            const nav = header.querySelector('.navbar');
            if (nav) nav.appendChild(notifBtn);
        }

        this.badgeEl = notifBtn.querySelector('.notif-badge');
    },

    // No notifications backend exists — display local demo count.
    async checkUnread() {
        // Show a static demo badge count (notifications are local-demo only)
        this.updateBadge(2);
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

        // No notifications backend — render demo notifications directly
        const notifs = [
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

        const escapeHTML = (str) => {
            if (!str) return '';
            return String(str)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#39;');
        };

        const listEl = drawer.querySelector('#notif-items-list');
        listEl.innerHTML = notifs.map(n => `
            <div style="display:flex; gap:10px; align-items:flex-start; padding:8px; background:rgba(255,255,255,0.04); border-radius:var(--radius-sm);">
                <img src="${n.from_avatar}" style="width:34px; height:34px; border-radius:50%; object-fit:cover; border:1px solid var(--primary-gold); flex-shrink:0;">
                <div style="display:flex; flex-direction:column; font-size:0.85rem; line-height:1.4;">
                    <span style="color:#ffffff;"><strong>${escapeHTML(n.from_user)}</strong> ${escapeHTML(n.message)}</span>
                    <span style="color:var(--text-dim); font-size:0.75rem; margin-top:2px;">${escapeHTML(n.time_ago || 'recently')}</span>
                </div>
            </div>
        `).join('');

        drawer.querySelector('#btn-mark-all-read').addEventListener('click', () => {
            this.updateBadge(0);
            drawer.remove();
        });
    }
};

document.addEventListener('DOMContentLoaded', () => {
    Notifications.init();
});
