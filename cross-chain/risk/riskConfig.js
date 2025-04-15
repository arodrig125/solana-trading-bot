const RISK_CONFIG = {
    // Time-based risk parameters
    timeParameters: {
        maxTradeInterval: 5000, // Maximum ms between trades
        minTradeInterval: 1000, // Minimum ms between trades
        maxDailyTrades: 100, // Maximum trades per day
        maxHourlyTrades: 10, // Maximum trades per hour
        tradingHours: {
            start: '09:30', // Market open (UTC)
            end: '16:00'   // Market close (UTC)
        },
        highVolatilityPeriods: [
            { start: '14:30', end: '15:00' }, // Common high volatility period
            { start: '09:30', end: '10:00' }  // Market open volatility
        ]
    },

    // Market condition parameters
    marketParameters: {
        volatilityThresholds: {
            low: 0.5,     // 0.5% price movement
            medium: 1.0,   // 1% price movement
            high: 2.0,     // 2% price movement
            extreme: 5.0   // 5% price movement
        },
        volumeThresholds: {
            low: 10000,    // Minimum daily volume in USD
            medium: 50000,
            high: 100000
        },
        liquidityRatios: {
            min: 2.0,      // Minimum ratio of pool liquidity to trade size
            safe: 5.0,     // Safe ratio for normal operations
            optimal: 10.0  // Optimal ratio for best execution
        },
        priceImpact: {
            max: 0.5,      // Maximum allowed price impact %
            warning: 0.3   // Warning threshold for price impact
        }
    },

    // Network-specific parameters
    networkParameters: {
        gasMultipliers: {
            slow: 0.8,
            standard: 1.0,
            fast: 1.2,
            urgent: 1.5
        },
        confirmations: {
            solana: { fast: 1, safe: 32 },
            ethereum: { fast: 1, safe: 12 },
            polygon: { fast: 64, safe: 128 },
            bsc: { fast: 5, safe: 15 },
            avalanche: { fast: 1, safe: 12 }
        },
        networkLoad: {
            low: 0.3,      // Network utilization thresholds
            medium: 0.6,
            high: 0.8
        },
        maxRetries: 3,     // Maximum transaction retry attempts
        minNodeCount: 3    // Minimum healthy nodes required
    },

    // Smart contract risk parameters
    contractParameters: {
        maxApprovalAmount: '115792089237316195423570985008687907853269984665640564039457584007913129639935', // uint256 max
        approvalTimeLimit: 24 * 60 * 60, // 24 hours in seconds
        maxPendingApprovals: 5,
        contractAgeMinimum: 30 * 24 * 60 * 60, // 30 days in seconds
        requiredAudits: ['CertiK', 'OpenZeppelin', 'Trail of Bits'],
        minTVL: 1000000 // Minimum TVL in USD
    },
    // Global risk parameters
    global: {
        maxTotalExposure: 100000, // Maximum total value across all chains in USD
        minProfitThreshold: 0.5, // Minimum profit percentage required for trade execution
        maxSlippage: 1.0, // Maximum allowed slippage percentage
        emergencyStopLoss: 5.0, // Emergency stop loss percentage
        maxConcurrentTrades: 5, // Maximum number of concurrent trades
        minLiquidity: 50000, // Minimum pool liquidity in USD
    },

    // Chain-specific risk parameters
    chainParameters: {
        solana: {
            maxPositionSize: 10000, // Maximum position size in USD
            minLiquidity: 25000,
            maxSlippage: 0.5,
            gasBuffer: 0.02, // Additional gas buffer for Solana
            minConfirmations: 2,
            riskScore: 1 // Lower score means lower risk
        },
        ethereum: {
            maxPositionSize: 15000,
            minLiquidity: 50000,
            maxSlippage: 0.8,
            gasBuffer: 0.1,
            minConfirmations: 12,
            riskScore: 2
        },
        bsc: {
            maxPositionSize: 8000,
            minLiquidity: 30000,
            maxSlippage: 1.0,
            gasBuffer: 0.05,
            minConfirmations: 15,
            riskScore: 3
        },
        polygon: {
            maxPositionSize: 7000,
            minLiquidity: 20000,
            maxSlippage: 0.7,
            gasBuffer: 0.03,
            minConfirmations: 128,
            riskScore: 2
        },
        avalanche: {
            maxPositionSize: 6000,
            minLiquidity: 15000,
            maxSlippage: 0.8,
            gasBuffer: 0.04,
            minConfirmations: 12,
            riskScore: 2
        },
        fantom: {
            maxPositionSize: 5000,
            minLiquidity: 10000,
            maxSlippage: 1.2,
            gasBuffer: 0.03,
            minConfirmations: 5,
            riskScore: 3
        }
    },

    // Token-specific risk parameters
    tokenParameters: {
        USDC: {
            maxExposure: 50000,
            riskScore: 1,
            minLiquidity: 10000
        },
        USDT: {
            maxExposure: 40000,
            riskScore: 1,
            minLiquidity: 10000
        },
        ETH: {
            maxExposure: 30000,
            riskScore: 2,
            minLiquidity: 20000
        },
        BTC: {
            maxExposure: 25000,
            riskScore: 2,
            minLiquidity: 25000
        }
    },

    // Cross-chain risk parameters
    crossChainParameters: {
        maxPendingTransfers: 3,     // Maximum pending transfers per chain
        transferDelayThresholds: {   // Maximum acceptable delays in seconds
            warning: 300,            // 5 minutes
            critical: 900            // 15 minutes
        },
        chainPriorityScores: {      // Chain reliability scores (0-1)
            solana: 0.9,
            ethereum: 0.95,
            polygon: 0.85,
            bsc: 0.8,
            avalanche: 0.85
        },
        requiredLiquidityRatio: 3,   // Required liquidity ratio for cross-chain
        maxTransferSize: {           // Maximum transfer size by chain (USD)
            solana: 50000,
            ethereum: 100000,
            polygon: 30000,
            bsc: 40000,
            avalanche: 35000
        },
        bridgeUtilization: {         // Bridge capacity utilization thresholds
            warning: 0.7,            // 70% utilization
            critical: 0.9            // 90% utilization
        },
        minDestinationBalance: {     // Minimum balance required on destination
            solana: 0.1,
            ethereum: 0.05,
            polygon: 1,
            bsc: 0.1,
            avalanche: 0.1
        }
    },

    // Bridge-specific risk parameters
    bridgeParameters: {
        wormhole: {
            maxTransactionSize: 20000,
            riskScore: 1,
            minConfirmations: {
                solana: 2,
                ethereum: 12,
                bsc: 15
            }
        },
        multichain: {
            maxTransactionSize: 15000,
            riskScore: 2,
            minConfirmations: {
                solana: 3,
                ethereum: 15,
                bsc: 20
            }
        }
    },

    // Position management parameters
    positionParameters: {
        sizing: {
            minSize: 100,      // Minimum position size in USD
            maxSize: 50000,    // Maximum position size in USD
            incrementSize: 100 // Position size increments
        },
        exposure: {
            maxPerToken: 0.2,    // Maximum exposure per token (20% of total)
            maxPerChain: 0.3,    // Maximum exposure per chain (30% of total)
            maxPerBridge: 0.25   // Maximum exposure per bridge (25% of total)
        },
        diversification: {
            minTokens: 3,        // Minimum number of tokens to trade
            minChains: 2,        // Minimum number of chains to use
            maxConcentration: 0.4 // Maximum concentration in one asset
        },
        rebalancing: {
            threshold: 0.1,      // 10% deviation triggers rebalancing
            frequency: 24 * 3600, // Rebalance check interval (24 hours)
            maxDaily: 3          // Maximum daily rebalances
        }
    },

    // Performance monitoring parameters
    performanceParameters: {
        profitTargets: {
            daily: 0.01,    // 1% daily profit target
            weekly: 0.05,   // 5% weekly profit target
            monthly: 0.15   // 15% monthly profit target
        },
        drawdownLimits: {
            warning: 0.05,   // 5% drawdown warning
            critical: 0.10,  // 10% drawdown critical
            maximum: 0.15    // 15% maximum drawdown
        },
        successRates: {
            minTradeSuccess: 0.8,     // 80% minimum trade success rate
            minBridgeSuccess: 0.95,    // 95% minimum bridge success rate
            minExecutionSpeed: 0.9     // 90% minimum execution speed success
        },
        metrics: {
            sharpeRatio: 2.0,         // Minimum Sharpe ratio
            profitFactor: 1.5,         // Minimum profit factor
            recoveryFactor: 2.0        // Minimum recovery factor
        }
    }
};

module.exports = {
    RISK_CONFIG
};
