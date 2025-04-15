const logger = require('../../utils/logger');

class ErrorRecovery {
    constructor() {
        this.errors = new Map();
        this.recoveryStrategies = new Map();
        this.errorCounts = new Map();
        this.recoveryAttempts = new Map();
        this.maxRetries = 3;
    }

    // Initialize recovery strategies
    initializeStrategies() {
        // Transaction-related errors
        this.addRecoveryStrategy('transaction_timeout', async (context) => {
            const { chain, txHash, walletManager } = context;
            logger.info(`Attempting to recover from transaction timeout: ${txHash}`);
            
            // Speed up transaction with higher gas fee
            const pendingTx = await walletManager.getPendingTransactions(chain)
                .find(tx => tx.hash === txHash);
            
            if (pendingTx) {
                await walletManager.handleFailedTransaction(chain, txHash, pendingTx);
            }
        });

        // RPC node errors
        this.addRecoveryStrategy('rpc_error', async (context) => {
            const { chain, config } = context;
            logger.info(`Attempting to recover from RPC error for ${chain}`);
            
            // Switch to backup RPC node
            if (config.backupRpcUrls && config.backupRpcUrls[chain]) {
                config.rpcUrl = config.backupRpcUrls[chain];
                await context.walletManager.initializeWallet(chain, context.privateKey, config);
            }
        });

        // Insufficient balance errors
        this.addRecoveryStrategy('insufficient_balance', async (context) => {
            const { chain, requiredAmount, walletManager } = context;
            logger.info(`Attempting to recover from insufficient balance on ${chain}`);
            
            // Check other wallets or request funds transfer
            const balances = await walletManager.getAllBalances();
            for (const [otherChain, balance] of Object.entries(balances)) {
                if (otherChain !== chain && balance.amount > requiredAmount) {
                    // Implement cross-chain transfer logic
                    logger.info(`Found sufficient balance on ${otherChain}, initiating transfer`);
                    break;
                }
            }
        });

        // Bridge-related errors
        this.addRecoveryStrategy('bridge_error', async (context) => {
            const { chain, bridgeManager, txHash } = context;
            logger.info(`Attempting to recover from bridge error for ${chain}`);
            
            // Check transaction status on both chains
            const status = await bridgeManager.checkTransferStatus(txHash);
            if (status === 'stuck') {
                await bridgeManager.retryBridgeTransfer(txHash);
            }
        });

        // Network congestion errors
        this.addRecoveryStrategy('network_congestion', async (context) => {
            const { chain } = context;
            logger.info(`Handling network congestion on ${chain}`);
            
            // Implement exponential backoff
            const attempts = this.getRecoveryAttempts(chain);
            const delay = Math.min(1000 * Math.pow(2, attempts), 30000); // Max 30 seconds
            await new Promise(resolve => setTimeout(resolve, delay));
        });

        // Slippage errors
        this.addRecoveryStrategy('slippage_error', async (context) => {
            const { trade, slippage } = context;
            logger.info(`Handling slippage error for trade`);
            
            // Adjust slippage tolerance
            const newSlippage = Math.min(slippage * 1.5, 5.0); // Max 5% slippage
            return { ...trade, slippage: newSlippage };
        });
    }

    // Add a new recovery strategy
    addRecoveryStrategy(errorType, strategy) {
        this.recoveryStrategies.set(errorType, strategy);
    }

    // Handle an error
    async handleError(error, context) {
        try {
            const errorType = this.classifyError(error);
            logger.error(`Handling error of type ${errorType}: ${error.message}`);

            // Update error counts
            this.incrementErrorCount(errorType);

            // Check if we should attempt recovery
            if (this.shouldAttemptRecovery(errorType)) {
                // Get and execute recovery strategy
                const strategy = this.recoveryStrategies.get(errorType);
                if (strategy) {
                    this.incrementRecoveryAttempts(errorType);
                    await strategy(context);
                    logger.info(`Recovery attempt successful for ${errorType}`);
                    return true;
                }
            }

            // If we reach here, recovery failed or no strategy exists
            logger.warn(`No recovery strategy found for ${errorType}`);
            return false;

        } catch (recoveryError) {
            logger.error(`Recovery failed: ${recoveryError.message}`);
            return false;
        }
    }

    // Classify an error
    classifyError(error) {
        // Transaction timeout
        if (error.message.includes('timeout') || error.message.includes('took too long')) {
            return 'transaction_timeout';
        }
        
        // RPC errors
        if (error.message.includes('RPC') || error.message.includes('connection failed')) {
            return 'rpc_error';
        }
        
        // Insufficient balance
        if (error.message.includes('insufficient') || error.message.includes('balance too low')) {
            return 'insufficient_balance';
        }
        
        // Bridge errors
        if (error.message.includes('bridge') || error.message.includes('transfer failed')) {
            return 'bridge_error';
        }
        
        // Network congestion
        if (error.message.includes('congestion') || error.message.includes('gas required exceeds')) {
            return 'network_congestion';
        }
        
        // Slippage errors
        if (error.message.includes('slippage') || error.message.includes('price impact too high')) {
            return 'slippage_error';
        }

        return 'unknown_error';
    }

    // Increment error count for a specific error type
    incrementErrorCount(errorType) {
        const count = this.errorCounts.get(errorType) || 0;
        this.errorCounts.set(errorType, count + 1);
    }

    // Increment recovery attempts for a specific error type
    incrementRecoveryAttempts(errorType) {
        const attempts = this.recoveryAttempts.get(errorType) || 0;
        this.recoveryAttempts.set(errorType, attempts + 1);
    }

    // Get number of recovery attempts for a specific error type
    getRecoveryAttempts(errorType) {
        return this.recoveryAttempts.get(errorType) || 0;
    }

    // Determine if we should attempt recovery
    shouldAttemptRecovery(errorType) {
        const attempts = this.getRecoveryAttempts(errorType);
        return attempts < this.maxRetries;
    }

    // Get error statistics
    getErrorStats() {
        const stats = {
            totalErrors: 0,
            byType: {},
            recoveryAttempts: {},
            successRate: {}
        };

        for (const [errorType, count] of this.errorCounts.entries()) {
            stats.totalErrors += count;
            stats.byType[errorType] = count;
            stats.recoveryAttempts[errorType] = this.getRecoveryAttempts(errorType);
            stats.successRate[errorType] = this.calculateSuccessRate(errorType);
        }

        return stats;
    }

    // Calculate success rate for a specific error type
    calculateSuccessRate(errorType) {
        const errors = this.errorCounts.get(errorType) || 0;
        const attempts = this.recoveryAttempts.get(errorType) || 0;
        
        if (errors === 0) return 100;
        return ((attempts - errors) / attempts) * 100;
    }

    // Reset error counts and recovery attempts
    reset() {
        this.errorCounts.clear();
        this.recoveryAttempts.clear();
    }
}

module.exports = ErrorRecovery;
