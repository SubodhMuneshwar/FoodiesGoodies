/**
 * FoodiesGoodies Social Interactions Engine (js/social.js)
 * Implements food-themed interactions:
 * - Fork / Add to Kitchen (Follow)
 * - Taste It (Like reaction)
 * - Flavor Notes (Comments)
 * - Pin to Kitchen Board (Save / Bookmark)
 * - Pass the Recipe Card (Share modal)
 * - Flavor Rating (1-5 Star ratings)
 */

const Social = {
    // 1. TASTE IT (Like Recipe)
    // Social features are local-demo (no social backend). localStorage is the source of truth.
    async taste(recipeId, btnEl) {
        let isTasteActive = false;
        let count = 0;

        let yums = JSON.parse(localStorage.getItem('foodies_user_yums') || '[]');
        let recipes = JSON.parse(localStorage.getItem('foodies_community_recipes') || '[]');
        const rec = recipes.find(r => r.id === recipeId);

        if (yums.includes(recipeId)) {
            yums = yums.filter(id => id !== recipeId);
            if (rec) rec.yumsCount = Math.max(0, (rec.yumsCount || 1) - 1);
            isTasteActive = false;
        } else {
            yums.push(recipeId);
            if (rec) rec.yumsCount = (rec.yumsCount || 0) + 1;
            isTasteActive = true;
        }
        count = rec ? rec.yumsCount : 1;
        localStorage.setItem('foodies_user_yums', JSON.stringify(yums));
        localStorage.setItem('foodies_community_recipes', JSON.stringify(recipes));

        // Update button UI if provided
        if (btnEl) {
            btnEl.classList.toggle('active-taste', isTasteActive);
            btnEl.classList.toggle('active-yum', isTasteActive);
            const countEl = btnEl.querySelector('.yum-counter') || btnEl.querySelector('.taste-count');
            if (countEl) countEl.textContent = count;
            const icon = btnEl.querySelector('.taste-icon');
            if (icon) icon.textContent = isTasteActive ? '❤️' : '😋';
        }

        return { isTasteActive, count };
    },

    // 2. PIN TO KITCHEN BOARD (Bookmark)
    // Local-demo only — no social backend exists.
    async pin(recipeId, btnEl) {
        let isPinned = false;

        let saved = JSON.parse(localStorage.getItem('foodies_user_saved') || '[]');
        if (saved.includes(recipeId)) {
            saved = saved.filter(id => id !== recipeId);
            isPinned = false;
        } else {
            saved.push(recipeId);
            isPinned = true;
        }
        localStorage.setItem('foodies_user_saved', JSON.stringify(saved));

        if (btnEl) {
            btnEl.classList.toggle('active-pinned', isPinned);
            btnEl.classList.toggle('active-saved', isPinned);
            const icon = btnEl.querySelector('ion-icon');
            if (icon) {
                icon.setAttribute('name', isPinned ? 'bookmark' : 'bookmark-outline');
            }
            btnEl.title = isPinned ? 'Remove from Kitchen Board' : 'Pin to Kitchen Board';
        }

        if (typeof swal === 'function') {
            swal(isPinned ? 'Pinned!' : 'Unpinned', isPinned ? 'Saved to your Kitchen Board!' : 'Removed from your Kitchen Board.', 'info');
        }

        return isPinned;
    },

    // 3. FORK THIS CHEF (Follow / Unfollow)
    // Local-demo only — no social backend exists.
    async fork(chefId, btnEl) {
        let isForked = false;
        let sousChefsCount = 0;

        let follows = JSON.parse(localStorage.getItem('foodies_user_follows') || '[]');
        if (follows.includes(chefId)) {
            follows = follows.filter(id => id !== chefId);
            isForked = false;
        } else {
            follows.push(chefId);
            isForked = true;
        }
        localStorage.setItem('foodies_user_follows', JSON.stringify(follows));

        if (btnEl) {
            btnEl.classList.toggle('following', isForked);
            btnEl.classList.toggle('forked', isForked);
            btnEl.textContent = isForked ? 'In Your Kitchen ✓' : '+ Fork This Chef';
        }

        // Trigger dynamic event for page listeners
        document.dispatchEvent(new CustomEvent('foodie:forkChanged', { detail: { chefId, isForked, sousChefsCount } }));
        return { isForked, sousChefsCount };
    },

    // 4. ADD FLAVOR NOTE (Comment)
    // Local-demo only — no social backend exists.
    async addFlavorNote(recipeId, noteText) {
        if (!noteText || !noteText.trim()) return null;

        // Return a local note object using the current Auth user for display
        const user = (window.Auth && Auth.getCurrentUser()) || { username: 'You', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80' };
        return {
            id: 'note_' + Date.now(),
            username: user.username,
            profile_pic: user.avatar,
            comment_text: noteText,
            time_ago: 'just now'
        };
    },

    // 5. PASS THE RECIPE CARD (Share)
    share(title, url) {
        const shareUrl = url || window.location.href;
        if (navigator.clipboard) {
            navigator.clipboard.writeText(shareUrl).then(() => {
                if (typeof swal === 'function') {
                    swal('Recipe Card Copied! 💌', 'Recipe link copied to clipboard. Pass it to a fellow foodie!', 'success');
                } else {
                    alert('Recipe link copied to clipboard: ' + shareUrl);
                }
            });
        } else {
            prompt('Copy this Recipe Card link:', shareUrl);
        }
    }
};

window.Social = Social;
