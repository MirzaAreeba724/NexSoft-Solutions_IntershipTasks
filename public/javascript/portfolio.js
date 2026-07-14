// Mobile Menu Toggle
const hamburger = document.querySelector('.hamburger');
const navLinks = document.querySelector('.nav-links');

if (hamburger) {
    hamburger.addEventListener('click', () => {
        navLinks.classList.toggle('active');
    });
}

// Close menu when a link is clicked
if (navLinks) {
    navLinks.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            navLinks.classList.remove('active');
        });
    });
}

// Contact Form Handler
const contactForm = document.getElementById('contactForm');
const formMessage = document.getElementById('formMessage');

if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = {
            name: document.getElementById('name').value.trim(),
            email: document.getElementById('email').value.trim(),
            message: document.getElementById('message').value.trim()
        };

        // Validate
        if (!formData.name || !formData.email || !formData.message) {
            formMessage.textContent = '❌ Please fill in all fields.';
            formMessage.classList.remove('success');
            formMessage.classList.add('error');
            formMessage.style.display = 'block';
            return;
        }

        try {
            // Send to backend
            const response = await fetch('/contact/send-message', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            const result = await response.json();

            if (result.success) {
                formMessage.textContent = '✅ ' + result.message;
                formMessage.classList.remove('error');
                formMessage.classList.add('success');
                formMessage.style.display = 'block';

                // Reset form
                contactForm.reset();

                // Hide message after 5 seconds
                setTimeout(() => {
                    formMessage.style.display = 'none';
                }, 5000);
            } else {
                formMessage.textContent = '❌ ' + result.message;
                formMessage.classList.remove('success');
                formMessage.classList.add('error');
                formMessage.style.display = 'block';
            }
        } catch (error) {
            console.error('Error:', error);
            formMessage.textContent = '❌ Network error. Please try again.';
            formMessage.classList.remove('success');
            formMessage.classList.add('error');
            formMessage.style.display = 'block';
        }
    });
}
