// Enhanced Form Validation for SolarBot Website
document.addEventListener('DOMContentLoaded', function() {
    // Get all forms with validation
    const forms = document.querySelectorAll('form[data-validate]');
    
    forms.forEach(form => {
        // Add novalidate attribute to disable browser's native validation
        form.setAttribute('novalidate', '');
        
        // Add event listener for form submission
        form.addEventListener('submit', function(e) {
            // Prevent default form submission
            e.preventDefault();
            
            // Validate form
            if (validateForm(form)) {
                // If validation passes, handle form submission
                handleFormSubmission(form);
            }
        });
        
        // Add event listeners for real-time validation
        const inputs = form.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            // Validate on blur (when input loses focus)
            input.addEventListener('blur', function() {
                validateInput(this);
            });
            
            // Clear error on input
            input.addEventListener('input', function() {
                const errorElement = this.parentElement.querySelector('.error-message');
                if (errorElement) {
                    errorElement.remove();
                }
                this.classList.remove('invalid');
            });
        });
    });
    
    // Function to validate entire form
    function validateForm(form) {
        let isValid = true;
        const inputs = form.querySelectorAll('input, select, textarea');
        
        inputs.forEach(input => {
            if (!validateInput(input)) {
                isValid = false;
            }
        });
        
        return isValid;
    }
    
    // Function to validate individual input
    function validateInput(input) {
        // Remove existing error message
        const existingError = input.parentElement.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }
        
        // Reset validation state
        input.classList.remove('invalid');
        input.classList.remove('valid');
        
        // Check if input is required and empty
        if (input.hasAttribute('required') && !input.value.trim()) {
            showError(input, 'This field is required');
            return false;
        }
        
        // Validate email format
        if (input.type === 'email' && input.value.trim()) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(input.value.trim())) {
                showError(input, 'Please enter a valid email address');
                return false;
            }
        }
        
        // Validate phone format
        if (input.type === 'tel' && input.value.trim()) {
            const phoneRegex = /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/;
            if (!phoneRegex.test(input.value.trim())) {
                showError(input, 'Please enter a valid phone number');
                return false;
            }
        }
        
        // Validate minimum length
        if (input.hasAttribute('minlength') && input.value.trim()) {
            const minLength = parseInt(input.getAttribute('minlength'));
            if (input.value.trim().length < minLength) {
                showError(input, `Must be at least ${minLength} characters`);
                return false;
            }
        }
        
        // Validate select element
        if (input.tagName === 'SELECT' && input.value === '') {
            showError(input, 'Please select an option');
            return false;
        }
        
        // If all validations pass, mark as valid
        input.classList.add('valid');
        return true;
    }
    
    // Function to show error message
    function showError(input, message) {
        input.classList.add('invalid');
        
        const errorElement = document.createElement('div');
        errorElement.className = 'error-message';
        errorElement.textContent = message;
        
        input.parentElement.appendChild(errorElement);
    }
    
    // Function to handle form submission
    function handleFormSubmission(form) {
        // Get form ID
        const formId = form.id;
        
        // Handle different forms
        if (formId === 'contact-form') {
            handleContactForm(form);
        } else if (formId === 'signup-form') {
            handleSignupForm(form);
        } else if (formId === 'login-form') {
            handleLoginForm(form);
        } else {
            // Generic form handling
            const formData = new FormData(form);
            const formValues = Object.fromEntries(formData.entries());
            
            // Show success message
            showSuccessMessage(form, 'Form submitted successfully!');
            
            // Log form data (for development)
            console.log('Form Data:', formValues);
        }
    }
    
    // Handle contact form submission
    function handleContactForm(form) {
        // Get form values
        const name = form.querySelector('#name').value;
        const email = form.querySelector('#email').value;
        const subject = form.querySelector('#subject').value;
        const message = form.querySelector('#message').value;
        
        // Here you would typically send the form data to your server
        // For now, we'll just show a success message
        
        // Show success message
        const successMessage = `
            <div class="success-message">
                <i class="fas fa-check-circle"></i>
                <h3>Message Sent Successfully!</h3>
                <p>Thank you for contacting us, ${name}. We'll get back to you as soon as possible.</p>
                <button class="btn btn-primary" id="send-another">Send Another Message</button>
            </div>
        `;
        
        // Replace form with success message
        const formContainer = form.parentElement;
        formContainer.innerHTML = successMessage;
        
        // Add event listener to "Send Another Message" button
        document.getElementById('send-another').addEventListener('click', function() {
            location.reload();
        });
    }
    
    // Show success message
    function showSuccessMessage(form, message) {
        // Create success message element
        const successElement = document.createElement('div');
        successElement.className = 'success-message';
        successElement.innerHTML = `
            <i class="fas fa-check-circle"></i>
            <h3>${message}</h3>
            <button class="btn btn-primary" id="reset-form">OK</button>
        `;
        
        // Hide form
        form.style.display = 'none';
        
        // Insert success message after form
        form.parentElement.appendChild(successElement);
        
        // Add event listener to reset button
        document.getElementById('reset-form').addEventListener('click', function() {
            // Remove success message
            successElement.remove();
            
            // Reset and show form
            form.reset();
            form.style.display = 'block';
            
            // Remove all validation classes
            const inputs = form.querySelectorAll('input, select, textarea');
            inputs.forEach(input => {
                input.classList.remove('valid');
                input.classList.remove('invalid');
            });
        });
    }
});
