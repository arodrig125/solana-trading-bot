// Live Chat Widget Integration for SolarBot Website
document.addEventListener('DOMContentLoaded', function() {
    // Initialize Tawk.to widget
    initTawkToWidget();

    // Add custom chat button
    addCustomChatButton();
});

// Initialize Tawk.to widget
function initTawkToWidget() {
    // Tawk.to widget code with your actual Tawk.to widget code
    var Tawk_API = Tawk_API || {};
    var Tawk_LoadStart = new Date();

    (function() {
        var s1 = document.createElement("script");
        var s0 = document.getElementsByTagName("script")[0];
        s1.async = true;
        s1.src = 'https://embed.tawk.to/67fafa60aa6e5419080f5e98/1iom642as';
        s1.charset = 'UTF-8';
        s1.setAttribute('crossorigin', '*');
        s0.parentNode.insertBefore(s1, s0);
    })();

    // Customize Tawk.to widget behavior
    if (typeof Tawk_API !== 'undefined') {
        // Set visitor information if user is logged in
        if (isUserLoggedIn()) {
            Tawk_API.onLoad = function() {
                const userInfo = getUserInfo();
                if (userInfo) {
                    Tawk_API.setAttributes({
                        name: userInfo.name,
                        email: userInfo.email,
                        plan: userInfo.plan || 'Not subscribed'
                    }, function(error) {
                        // Handle error if needed
                    });
                }
            };
        }

        // Track chat events
        Tawk_API.onChatStarted = function() {
            trackEvent('chat_started');
        };

        Tawk_API.onChatEnded = function() {
            trackEvent('chat_ended');
        };

        // Hide widget on certain pages
        const hideChatOnPages = ['/login.html', '/signup.html', '/privacy.html', '/terms.html'];
        const currentPath = window.location.pathname;

        if (hideChatOnPages.some(page => currentPath.endsWith(page))) {
            Tawk_API.hideWidget();
        }
    }
}

// Add custom chat button
function addCustomChatButton() {
    // Create custom chat button element
    const chatButton = document.createElement('div');
    chatButton.className = 'custom-chat-button';
    chatButton.innerHTML = `
        <div class="chat-button-icon">
            <i class="fas fa-comment-dots"></i>
        </div>
        <div class="chat-button-text">Chat with us</div>
    `;

    // Add to document
    document.body.appendChild(chatButton);

    // Add event listener
    chatButton.addEventListener('click', function() {
        if (typeof Tawk_API !== 'undefined') {
            Tawk_API.maximize();
        }
    });

    // Show/hide text on hover
    chatButton.addEventListener('mouseenter', function() {
        this.classList.add('expanded');
    });

    chatButton.addEventListener('mouseleave', function() {
        this.classList.remove('expanded');
    });
}

// Helper function to check if user is logged in
function isUserLoggedIn() {
    // This is a placeholder - implement actual login check
    return localStorage.getItem('user') !== null;
}

// Helper function to get user info
function getUserInfo() {
    // This is a placeholder - implement actual user info retrieval
    const userJson = localStorage.getItem('user');
    return userJson ? JSON.parse(userJson) : null;
}

// Helper function to track events
function trackEvent(eventName, eventData = {}) {
    // This is a placeholder - implement actual event tracking
    if (typeof gtag !== 'undefined') {
        gtag('event', eventName, eventData);
    }

    console.log('Event tracked:', eventName, eventData);
}
