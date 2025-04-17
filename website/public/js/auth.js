// SolarBot Authentication and Subscription Management

// Mock user database (in a real implementation, this would be stored on a server)
let users = JSON.parse(localStorage.getItem('solarbot_users')) || [];

// Subscription plans
const subscriptionPlans = {
    starter: {
        name: 'STARTER',
        price: 29,
        yearlyPrice: 279,
        savings: 69,
        trialDays: 7,
        features: [
            'Simulation mode only',
            'Basic arbitrage detection',
            'Telegram notifications',
            '5 token pairs',
            'Daily summary reports',
            'Basic dashboard access',
            'Community support',
            '2-minute scan interval',
            '100 daily scans'
        ]
    },
    pro: {
        name: 'PRO',
        price: 79,
        yearlyPrice: 759,
        savings: 189,
        trialDays: 0,
        features: [
            'Everything in STARTER tier',
            'Live trading mode',
            'Simple and triangular arbitrage',
            '20 token pairs',
            'Customizable profit thresholds',
            'Detailed analytics',
            'Email support',
            '1-minute scan interval',
            '500 daily scans'
        ]
    },
    elite: {
        name: 'ELITE',
        price: 199,
        yearlyPrice: 1899,
        savings: 489,
        trialDays: 0,
        features: [
            'Everything in PRO tier',
            'Multi-wallet support',
            'Advanced risk management',
            'API access',
            '50 token pairs',
            'Multi-hop arbitrage',
            'Priority support',
            '30-second scan interval',
            '2000 daily scans'
        ]
    },
    institutional: {
        name: 'INSTITUTIONAL',
        price: 999,
        yearlyPrice: 9590,
        savings: 2398,
        trialDays: 0,
        features: [
            'Everything in ELITE tier',
            'Dedicated VPS',
            'Custom development',
            'Multiple exchange support',
            'Advanced reporting',
            'Direct developer access',
            'Unlimited token pairs',
            '10-second scan interval',
            'Flash-loan arbitrage'
        ]
    }
};

// User registration function
function registerUser(email, password, name, plan) {
    // Registration is disabled for soft launch
    return {
        success: false,
        message: 'Registration is currently closed.'
    };
}

// User login function
function loginUser(email, password) {
    // Find user by email
    const user = users.find(user => user.email === email);

    // Check if user exists and password is correct
    if (!user || user.password !== hashPassword(password)) {
        return {
            success: false,
            message: 'Invalid email or password'
        };
    }

    // Update last login
    user.lastLogin = new Date().toISOString();
    saveUsers();

    return {
        success: true,
        message: 'Login successful',
        user: {
            id: user.id,
            email: user.email,
            name: user.name,
            plan: user.plan,
            subscriptionStatus: user.subscriptionStatus,
            subscriptionEnd: user.subscriptionEnd
        }
    };
}

// Check if user is logged in
function isLoggedIn() {
    const currentUser = JSON.parse(localStorage.getItem('solarbot_current_user'));
    return !!currentUser;
}

// Get current user
function getCurrentUser() {
    return JSON.parse(localStorage.getItem('solarbot_current_user'));
}

// Logout user
function logoutUser() {
    localStorage.removeItem('solarbot_current_user');
    return {
        success: true,
        message: 'Logout successful'
    };
}

// Update user subscription
function updateSubscription(userId, newPlan) {
    // Find user by ID
    const user = users.find(user => user.id === userId);

    if (!user) {
        return {
            success: false,
            message: 'User not found'
        };
    }

    // Update subscription details
    user.plan = newPlan;
    user.subscriptionStatus = 'active';
    user.subscriptionStart = new Date().toISOString();
    user.subscriptionEnd = calculateSubscriptionEnd(new Date(), 30); // 30 days subscription

    saveUsers();

    // Update current user in local storage if it's the same user
    const currentUser = JSON.parse(localStorage.getItem('solarbot_current_user'));
    if (currentUser && currentUser.id === userId) {
        currentUser.plan = newPlan;
        currentUser.subscriptionStatus = 'active';
        currentUser.subscriptionEnd = user.subscriptionEnd;
        localStorage.setItem('solarbot_current_user', JSON.stringify(currentUser));
    }

    return {
        success: true,
        message: 'Subscription updated successfully',
        user: {
            id: user.id,
            email: user.email,
            name: user.name,
            plan: user.plan,
            subscriptionStatus: user.subscriptionStatus,
            subscriptionEnd: user.subscriptionEnd
        }
    };
}

// Cancel subscription
function cancelSubscription(userId) {
    // Find user by ID
    const user = users.find(user => user.id === userId);

    if (!user) {
        return {
            success: false,
            message: 'User not found'
        };
    }

    // Update subscription status
    user.subscriptionStatus = 'cancelled';
    saveUsers();

    // Update current user in local storage if it's the same user
    const currentUser = JSON.parse(localStorage.getItem('solarbot_current_user'));
    if (currentUser && currentUser.id === userId) {
        currentUser.subscriptionStatus = 'cancelled';
        localStorage.setItem('solarbot_current_user', JSON.stringify(currentUser));
    }

    return {
        success: true,
        message: 'Subscription cancelled successfully'
    };
}

// Helper functions
function generateUserId() {
    return 'user_' + Math.random().toString(36).substr(2, 9);
}

function hashPassword(password) {
    // In a real app, use a proper password hashing library
    // This is just a simple hash for demonstration purposes
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
        const char = password.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString();
}

function calculateSubscriptionEnd(startDate, days) {
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + days);
    return endDate.toISOString();
}

function saveUsers() {
    localStorage.setItem('solarbot_users', JSON.stringify(users));
}

// Export functions for use in other scripts
window.SolarBotAuth = {
    registerUser,
    loginUser,
    isLoggedIn,
    getCurrentUser,
    logoutUser,
    updateSubscription,
    cancelSubscription,
    subscriptionPlans
};
