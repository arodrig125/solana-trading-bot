// Dark Mode Toggle for SolarBot Website
document.addEventListener('DOMContentLoaded', function() {
    // Create dark mode toggle button if it doesn't exist
    if (!document.querySelector('.dark-mode-toggle')) {
        const darkModeToggle = document.createElement('div');
        darkModeToggle.className = 'dark-mode-toggle';
        darkModeToggle.innerHTML = '<i class="fas fa-moon"></i>';
        darkModeToggle.setAttribute('aria-label', 'Toggle dark mode');
        darkModeToggle.setAttribute('role', 'button');
        darkModeToggle.setAttribute('tabindex', '0');
        document.body.appendChild(darkModeToggle);

        // Toggle dark mode on button click
        darkModeToggle.addEventListener('click', toggleDarkMode);

        // Add keyboard support
        darkModeToggle.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                toggleDarkMode();
            }
        });
    }

    // Check for saved user preference or system preference
    const darkMode = localStorage.getItem('darkMode');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    // Apply dark mode based on preference
    if (darkMode === 'enabled' || (!darkMode && systemPrefersDark)) {
        enableDarkMode();
    } else {
        disableDarkMode();
    }

    // Function to toggle dark mode
    function toggleDarkMode() {
        // Check current dark mode status
        const darkMode = localStorage.getItem('darkMode');

        // Toggle dark mode
        if (darkMode !== 'enabled') {
            enableDarkMode();
        } else {
            disableDarkMode();
        }
    }

    // Function to enable dark mode
    function enableDarkMode() {
        // Add class to body
        document.body.classList.add('dark-mode');
        // Update button icon
        darkModeToggle.innerHTML = '<i class="fas fa-sun"></i>';
        // Save user preference
        localStorage.setItem('darkMode', 'enabled');
    }

    // Function to disable dark mode
    function disableDarkMode() {
        // Remove class from body
        document.body.classList.remove('dark-mode');
        // Update button icon
        darkModeToggle.innerHTML = '<i class="fas fa-moon"></i>';
        // Save user preference
        localStorage.setItem('darkMode', null);
    }

    // Check system preference
    const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');

    // Apply dark mode based on system preference if no saved preference
    if (darkMode === null && prefersDarkScheme.matches) {
        enableDarkMode();
    }

    // Listen for changes in system preference
    prefersDarkScheme.addEventListener('change', (e) => {
        // Only apply if user hasn't manually set a preference
        if (localStorage.getItem('darkMode') === null) {
            if (e.matches) {
                enableDarkMode();
            } else {
                disableDarkMode();
            }
        }
    });
});
