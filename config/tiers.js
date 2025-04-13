/**
 * SolarBot Subscription Tiers Configuration
 * This file defines the features and limitations for each subscription tier
 */

const TIERS = {
  // Free tier - Basic features for learning and testing
  FREE: {
    name: 'Basic',
    maxPairs: 3,
    scanInterval: 120000, // 2 minutes
    arbitrageTypes: ['exchange'], // Only exchange arbitrage
    maxWallets: 1,
    simulationOnly: true, // No live trading
    maxConcurrentRequests: 1,
    maxDailyScans: 500,
    supportLevel: 'community',
    features: {
      telegramBot: true,
      webDashboard: true,
      notifications: {
        telegram: true,
        email: false,
        push: false
      },
      riskManagement: {
        circuitBreaker: false,
        positionSizing: false,
        gasOptimization: false
      },
      analytics: {
        basic: true,
        advanced: false,
        export: false
      }
    }
  },
  
  // Standard tier - For individual traders
  STANDARD: {
    name: 'Pro',
    maxPairs: 10,
    scanInterval: 60000, // 1 minute
    arbitrageTypes: ['exchange', 'triangular'],
    maxWallets: 1,
    simulationOnly: false, // Live trading enabled
    maxConcurrentRequests: 2,
    maxDailyScans: 1500,
    supportLevel: 'email',
    features: {
      telegramBot: true,
      webDashboard: true,
      notifications: {
        telegram: true,
        email: true,
        push: false
      },
      riskManagement: {
        circuitBreaker: true,
        positionSizing: true,
        gasOptimization: true
      },
      analytics: {
        basic: true,
        advanced: false,
        export: true
      }
    }
  },
  
  // Professional tier - For serious traders
  PROFESSIONAL: {
    name: 'Elite',
    maxPairs: Infinity, // Unlimited
    scanInterval: 30000, // 30 seconds
    arbitrageTypes: ['exchange', 'triangular', 'dynamic'],
    maxWallets: 3,
    simulationOnly: false,
    maxConcurrentRequests: 5,
    maxDailyScans: 5000,
    supportLevel: 'priority',
    features: {
      telegramBot: true,
      webDashboard: true,
      notifications: {
        telegram: true,
        email: true,
        push: true
      },
      riskManagement: {
        circuitBreaker: true,
        positionSizing: true,
        gasOptimization: true
      },
      analytics: {
        basic: true,
        advanced: true,
        export: true
      }
    }
  },
  
  // Enterprise tier - For institutions
  ENTERPRISE: {
    name: 'Institutional',
    maxPairs: Infinity,
    scanInterval: 10000, // 10 seconds
    arbitrageTypes: ['exchange', 'triangular', 'dynamic', 'custom'],
    maxWallets: Infinity, // Unlimited wallets
    simulationOnly: false,
    maxConcurrentRequests: 10,
    maxDailyScans: Infinity,
    supportLevel: 'dedicated',
    features: {
      telegramBot: true,
      webDashboard: true,
      notifications: {
        telegram: true,
        email: true,
        push: true
      },
      riskManagement: {
        circuitBreaker: true,
        positionSizing: true,
        gasOptimization: true,
        customRiskProfiles: true
      },
      analytics: {
        basic: true,
        advanced: true,
        export: true,
        customReports: true
      },
      whiteLabel: true,
      customIntegrations: true,
      dedicatedRpc: true
    }
  }
};

// Default tier for new users
const DEFAULT_TIER = 'FREE';

// Function to get tier configuration
function getTierConfig(tierName) {
  const tier = TIERS[tierName];
  if (!tier) {
    throw new Error(`Invalid tier: ${tierName}`);
  }
  return tier;
}

// Function to check if a feature is available for a tier
function hasFeature(tierName, featurePath) {
  const tier = getTierConfig(tierName);
  
  // Parse feature path (e.g., "notifications.email")
  const pathParts = featurePath.split('.');
  let current = tier.features;
  
  // Navigate through the feature path
  for (const part of pathParts) {
    if (current === undefined || current === null) {
      return false;
    }
    current = current[part];
  }
  
  return !!current;
}

// Function to get tier limit
function getTierLimit(tierName, limitName) {
  const tier = getTierConfig(tierName);
  return tier[limitName];
}

module.exports = {
  TIERS,
  DEFAULT_TIER,
  getTierConfig,
  hasFeature,
  getTierLimit
};
