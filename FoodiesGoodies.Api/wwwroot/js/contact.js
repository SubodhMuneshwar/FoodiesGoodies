/**
 * FoodiesGoodies Contact Form Handler
 * Validates inquiries and securely posts to the backend API without exposing credentials.
 */

document.addEventListener('DOMContentLoaded', () => {
    const contactForm = document.querySelector('#contactForm');
    if (!contactForm) return;

    const submitBtn = contactForm.querySelector('.submit-btn');

    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const nameInput = document.querySelector('#name');
        const emailInput = document.querySelector('#email');
        const subjectInput = document.querySelector('#subject');
        const messageInput = document.querySelector('#message');

        const name = nameInput ? nameInput.value.trim() : '';
        const email = emailInput ? emailInput.value.trim() : '';
        const subject = subjectInput ? subjectInput.value.trim() : '';
        const message = messageInput ? messageInput.value.trim() : '';

        // Validation
        if (!name || name.length < 2) {
            showAlert('Validation Error', 'Please enter your full name.', 'warning');
            if (nameInput) nameInput.focus();
            return;
        }

        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email || !emailPattern.test(email)) {
            showAlert('Validation Error', 'Please enter a valid email address.', 'warning');
            if (emailInput) emailInput.focus();
            return;
        }

        if (!subject || subject.length < 2) {
            showAlert('Validation Error', 'Please enter a message subject.', 'warning');
            if (subjectInput) subjectInput.focus();
            return;
        }

        if (!message || message.length < 5) {
            showAlert('Validation Error', 'Please enter a message of at least 5 characters.', 'warning');
            if (messageInput) messageInput.focus();
            return;
        }

        // Disable button & indicate loading
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Sending Message...';
        }
        if (window.FoodiesLoader) {
            window.FoodiesLoader.show('Sending your message to our kitchen team...');
        }

        try {
            const response = await fetch('/api/contact', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ name, email, subject, message })
            });

            const data = await response.json().catch(() => ({}));

            if (response.ok && data && data.success) {
                showAlert('Message Sent!', data.message || 'Thank you for reaching out! We will reply shortly.', 'success');
                contactForm.reset();
            } else {
                showAlert('Submission Notice', (data && data.message) ? data.message : 'Unable to submit your message. Please try again.', 'error');
            }
        } catch (error) {
            console.error('Contact form submission error:', error);
            showAlert('Notice', 'Unable to send message right now. Please try again or email us directly.', 'warning');
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Send Message';
            }
            if (window.FoodiesLoader) {
                window.FoodiesLoader.hide();
            }
        }
    });

    function showAlert(title, message, iconType) {
        if (typeof Swal === 'function' && Swal.fire) {
            Swal.fire({ title, text: message, icon: iconType });
        } else if (typeof swal === 'function') {
            swal(title, message, iconType);
        } else {
            alert(`${title}: ${message}`);
        }
    }
});
