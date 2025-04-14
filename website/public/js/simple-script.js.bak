document.addEventListener('DOMContentLoaded', function() {
    // Mobile Menu Toggle
    const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
    const navLinks = document.querySelector('nav ul');
    const authButtons = document.querySelector('.auth-buttons');

    if (mobileMenuToggle) {
        mobileMenuToggle.addEventListener('click', function() {
            this.classList.toggle('active');
            
            // Create mobile menu if it doesn't exist
            if (!document.querySelector('.mobile-menu')) {
                const mobileMenu = document.createElement('div');
                mobileMenu.className = 'mobile-menu';
                
                // Clone navigation links
                const navClone = navLinks.cloneNode(true);
                mobileMenu.appendChild(navClone);
                
                // Clone auth buttons
                const authClone = authButtons.cloneNode(true);
                mobileMenu.appendChild(authClone);
                
                // Add to header
                document.querySelector('header').appendChild(mobileMenu);
            }
            
            // Toggle mobile menu visibility
            const mobileMenu = document.querySelector('.mobile-menu');
            mobileMenu.classList.toggle('active');
        });
    }

    // FAQ Accordion
    const faqItems = document.querySelectorAll('.faq-item');
    
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        
        question.addEventListener('click', () => {
            const isActive = item.classList.contains('active');
            
            // Close all FAQ items
            faqItems.forEach(faqItem => {
                faqItem.classList.remove('active');
            });
            
            // Open clicked item if it wasn't already open
            if (!isActive) {
                item.classList.add('active');
            }
        });
    });

    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                window.scrollTo({
                    top: targetElement.offsetTop - 80,
                    behavior: 'smooth'
                });
                
                // Close mobile menu if open
                const mobileMenu = document.querySelector('.mobile-menu');
                if (mobileMenu && mobileMenu.classList.contains('active')) {
                    mobileMenuToggle.click();
                }
            }
        });
    });

    // Contact Form Submission
    const contactForm = document.getElementById('contact-form');
    
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get form values
            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const message = document.getElementById('message').value;
            
            // Here you would typically send the form data to your server
            // For now, we'll just show a success message
            
            // Create success message
            const formContainer = contactForm.parentElement;
            const successMessage = document.createElement('div');
            successMessage.className = 'success-message';
            successMessage.innerHTML = `
                <h3>Message Sent!</h3>
                <p>Thank you for contacting us, ${name}. We'll get back to you as soon as possible.</p>
                <button class="btn btn-primary" id="send-another">Send Another Message</button>
            `;
            
            // Hide form and show success message
            contactForm.style.display = 'none';
            formContainer.appendChild(successMessage);
            
            // Add event listener to "Send Another Message" button
            document.getElementById('send-another').addEventListener('click', function() {
                contactForm.reset();
                contactForm.style.display = 'block';
                successMessage.remove();
            });
        });
    }

    // Add active class to FAQ items on page load if URL has hash
    if (window.location.hash && window.location.hash.startsWith('#faq-')) {
        const faqId = window.location.hash.substring(1);
        const faqItem = document.getElementById(faqId);
        
        if (faqItem && faqItem.classList.contains('faq-item')) {
            faqItem.classList.add('active');
            
            // Scroll to the FAQ item
            setTimeout(() => {
                window.scrollTo({
                    top: faqItem.offsetTop - 100,
                    behavior: 'smooth'
                });
            }, 100);
        }
    }
});
