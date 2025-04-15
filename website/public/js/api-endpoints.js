// API Endpoints Configuration
const API_CONFIG = {
    baseUrl: '/api/v1',
    endpoints: {
        // Opportunity endpoints
        opportunities: {
            base: '/opportunities',
            methods: {
                list: { method: 'GET', path: '/' },
                details: { method: 'GET', path: '/:id' },
                stats: { method: 'GET', path: '/stats' }
            }
        },

        // Network flow endpoints
        networkFlow: {
            base: '/network-flow',
            methods: {
                current: { method: 'GET', path: '/' },
                history: { method: 'GET', path: '/history' },
                chain: { method: 'GET', path: '/chain/:chainId' }
            }
        },

        // Profit analysis endpoints
        profits: {
            base: '/profits',
            methods: {
                summary: { method: 'GET', path: '/' },
                breakdown: { method: 'GET', path: '/:chain/breakdown' },
                trends: { method: 'GET', path: '/trends' }
            }
        },

        // Performance endpoints
        performance: {
            base: '/performance',
            methods: {
                overview: { method: 'GET', path: '/' },
                metrics: { method: 'GET', path: '/metrics' },
                details: { method: 'GET', path: '/:category' }
            }
        },

        // Volume analysis endpoints
        volume: {
            base: '/volume',
            methods: {
                current: { method: 'GET', path: '/' },
                profile: { method: 'GET', path: '/profile/:level' },
                history: { method: 'GET', path: '/history' }
            }
        },

        // System metrics endpoints
        metrics: {
            base: '/metrics',
            methods: {
                system: { method: 'GET', path: '/system' },
                trading: { method: 'GET', path: '/trading' },
                gas: { method: 'GET', path: '/gas' }
            }
        },

        // Wallet endpoints
        wallets: {
            base: '/wallets',
            methods: {
                list: { method: 'GET', path: '/' },
                balance: { method: 'GET', path: '/:address/balance' },
                transactions: { method: 'GET', path: '/:address/transactions' }
            }
        },

        // Bridge endpoints
        bridges: {
            base: '/bridges',
            methods: {
                status: { method: 'GET', path: '/status' },
                fees: { method: 'GET', path: '/fees' },
                transfers: { method: 'GET', path: '/transfers' }
            }
        }
    },

    // Response structure templates
    responseTemplates: {
        opportunities: {
            id: String,
            timestamp: Date,
            chain: String,
            size: Number,
            profit: Number,
            risk: Number,
            status: String
        },
        networkFlow: {
            nodes: Array,
            edges: Array,
            timestamp: Date,
            metrics: Object
        },
        profits: {
            total: Number,
            byChain: Object,
            byToken: Object,
            timeline: Array
        },
        performance: {
            success_rate: Number,
            execution_time: Number,
            gas_efficiency: Number,
            metrics: Object
        },
        volume: {
            total: Number,
            byChain: Object,
            timeline: Array,
            profile: Object
        }
    },

    // Error codes and messages
    errorCodes: {
        RATE_LIMIT_EXCEEDED: 'Too many requests',
        INVALID_PARAMETERS: 'Invalid request parameters',
        UNAUTHORIZED: 'Authentication required',
        FORBIDDEN: 'Access denied',
        NOT_FOUND: 'Resource not found',
        INTERNAL_ERROR: 'Internal server error'
    },

    // Rate limiting configuration
    rateLimits: {
        standard: {
            requests: 100,
            period: 60 // seconds
        },
        premium: {
            requests: 1000,
            period: 60
        }
    },

    // Authentication configuration
    auth: {
        tokenHeader: 'Authorization',
        tokenPrefix: 'Bearer',
        refreshEndpoint: '/auth/refresh'
    },

    // Websocket configuration
    websocket: {
        endpoint: '/ws',
        reconnectInterval: 5000,
        maxReconnectAttempts: 5
    }
};

// Export configuration
window.API_CONFIG = API_CONFIG;
