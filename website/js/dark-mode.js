// Dark Mode Toggle for SolarBot Website
document.addEventListener('DOMContentLoaded', function() {
    // Create dark mode toggle button
    const darkModeToggle = document.createElement('div');
    darkModeToggle.className = 'dark-mode-toggle';
    darkModeToggle.innerHTML = '<i class="fas fa-moon"></i>';
    document.body.appendChild(darkModeToggle);

    // Check for saved user preference
    const darkMode = localStorage.getItem('darkMode');
    
    // If dark mode was previously enabled, apply it
    if (darkMode === 'enabled') {
        enableDarkMode();
    }

    // Toggle dark mode on button click
    darkModeToggle.addEventListener('click', () => {
        // Check current dark mode status
        const darkMode = localStorage.getItem('darkMode');
        
        // Toggle dark mode
        if (darkMode !== 'enabled') {
            enableDarkMode();
        } else {
            disableDarkMode();
        }
    });

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
