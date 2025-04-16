const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    password: {
        type: String,
        required: true
    },
    wallets: [{
        type: String,
        trim: true
    }],
    twoFactorEnabled: {
        type: Boolean,
        default: false
    },
    twoFactorSecret: {
        type: String,
        default: ''
    },
    apiKeys: [
        {
            key: {
                type: String,
                required: true
            },
            label: {
                type: String,
                default: ''
            },
            createdAt: {
                type: Date,
                default: Date.now
            },
            lastUsed: {
                type: Date
            }
        }
    ],
    role: {
        type: String,
        enum: ['admin', 'trader', 'analyst', 'viewer', 'support', 'code_reviewer'],
        default: 'viewer'
    },
    tradingLimit: {
        type: Number,
        default: 0 // 0 means no limit
    },
    riskLevel: {
        type: String,
        enum: ['conservative', 'moderate', 'aggressive'],
        default: 'conservative'
    },
    apiAccess: {
        enabled: { type: Boolean, default: false },
        rateLimit: { type: Number, default: 100 }, // requests per minute
        allowedEndpoints: [{ type: String }]
    },
    permissions: [{
        type: String,
        enum: [
            // Admin permissions
            'manage_users',
            'manage_roles',
            'manage_settings',
            'view_all_trades',
            'manage_api_keys',
            // Trading permissions
            'execute_trades',
            'set_trade_limits',
            'manage_wallets',
            'cancel_trades',
            // Analysis permissions
            'view_analytics',
            'export_data',
            'configure_alerts',
            'view_performance',
            // Support permissions
            'view_logs',
            'manage_alerts',
            'reset_passwords',
            // Code Reviewer permissions
            'view_code',
            'run_tests',
            'view_logs',
            'submit_fixes',
            'view_error_reports',
            // Basic permissions
            'view_dashboard',
            'view_own_trades',
            'view_own_wallet'
        ]
    }],
    active: {
        type: Boolean,
        default: true
    },
    lastLogin: {
        type: Date
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

// Set default permissions based on role
userSchema.pre('save', function(next) {
    if (this.isModified('role')) {
        switch (this.role) {
            case 'admin':
                this.permissions = [
                    'manage_users', 'manage_roles', 'manage_settings',
                    'view_all_trades', 'manage_api_keys', 'execute_trades',
                    'set_trade_limits', 'manage_wallets', 'cancel_trades',
                    'view_analytics', 'export_data', 'configure_alerts',
                    'view_performance', 'view_logs', 'manage_alerts',
                    'reset_passwords', 'view_dashboard', 'view_own_trades',
                    'view_own_wallet'
                ];
                this.apiAccess = {
                    enabled: true,
                    rateLimit: 1000,
                    allowedEndpoints: ['*']
                };
                break;
            case 'trader':
                this.permissions = [
                    'execute_trades', 'view_own_trades', 'view_own_wallet',
                    'cancel_trades', 'view_analytics', 'view_performance',
                    'view_dashboard', 'configure_alerts'
                ];
                this.apiAccess = {
                    enabled: true,
                    rateLimit: 300,
                    allowedEndpoints: ['/api/trades', '/api/wallet', '/api/analytics']
                };
                break;
            case 'analyst':
                this.permissions = [
                    'view_analytics', 'export_data', 'view_performance',
                    'view_dashboard', 'view_all_trades', 'configure_alerts'
                ];
                this.apiAccess = {
                    enabled: true,
                    rateLimit: 500,
                    allowedEndpoints: ['/api/analytics', '/api/export']
                };
                break;
            case 'support':
                this.permissions = [
                    'view_logs', 'manage_alerts', 'reset_passwords',
                    'view_dashboard', 'view_all_trades'
                ];
                this.apiAccess = {
                    enabled: true,
                    rateLimit: 200,
                    allowedEndpoints: ['/api/support', '/api/logs']
                };
                break;
            case 'code_reviewer':
                this.permissions = [
                    'view_code',
                    'run_tests',
                    'view_logs',
                    'submit_fixes',
                    'view_error_reports',
                    'view_dashboard'
                ];
                this.apiAccess = {
                    enabled: true,
                    rateLimit: 200,
                    allowedEndpoints: [
                        '/api/code',
                        '/api/tests',
                        '/api/logs',
                        '/api/errors'
                    ]
                };
                // Code reviewers can't see trading data
                this.dataMask = {
                    hideWalletAddresses: true,
                    hideTradeAmounts: true,
                    hideUserData: true,
                    hideSensitiveConfigs: true
                };
                break;
            case 'viewer':
                this.permissions = [
                    'view_dashboard', 'view_own_trades', 'view_own_wallet',
                    'view_performance'
                ];
                this.apiAccess = {
                    enabled: true,
                    rateLimit: 100,
                    allowedEndpoints: ['/api/dashboard', '/api/performance']
                };
                break;
        }
    }
    next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

// Check if user has specific permission
userSchema.methods.hasPermission = function(permission) {
    return this.permissions.includes(permission);
};

const User = mongoose.model('User', userSchema);

module.exports = User;
