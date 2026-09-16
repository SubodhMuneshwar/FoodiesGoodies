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

    // Check URL parameters for active tab or status messages
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('mode') === 'register' && wrapper) {
        wrapper.classList.add('active');
    }

    const status = urlParams.get('status');
    const msg = urlParams.get('msg');
    if (status && msg) {
        const decodedMsg = decodeURIComponent(msg);
        if (typeof swal === 'function') {
            swal(status === 'success' ? 'Success!' : 'Notice', decodedMsg, status === 'success' ? 'success' : 'info');
        } else {
            alert(decodedMsg);
        }
    }
});
