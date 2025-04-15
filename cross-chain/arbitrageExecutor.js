const { BridgeManager } = require('./bridges');
const { PriceMonitor } = require('./priceMonitor');
const RiskManager = require('./risk/RiskManager');
const WalletManager = require('./wallet/WalletManager');
const ErrorRecovery = require('./recovery/ErrorRecovery');
const logger = require('../utils/logger');

// Arbitrage configuration
const ARBITRAGE_CONFIG = {
    minProfit: 0.01, // 1% minimum profit
    maxSlippage: 0.005, // 0.5% max slippage
    minAmount: 1000, // Minimum amount to trade
    maxAmount: 100000 // Maximum amount to trade
};

class ArbitrageExecutor {
    constructor(config) {
        this.config = config;
        this.bridgeManager = new BridgeManager();
        this.priceMonitor = new PriceMonitor();
        this.riskManager = new RiskManager();
        this.walletManager = new WalletManager();
        this.errorRecovery = new ErrorRecovery();
        this.activeTrades = new Map();

        // Initialize error recovery strategies
        this.errorRecovery.initializeStrategies();
    }

    // Initialize wallets for all supported chains
    async initializeWallets() {
        try {
            for (const chain of Object.keys(this.config.chains)) {
                const chainConfig = this.config.chains[chain];
                await this.walletManager.initializeWallet(
                    chain,
                    chainConfig.privateKey,
                    {
                        rpcUrl: chainConfig.rpcUrl,
                        backupRpcUrls: chainConfig.backupRpcUrls
                    }
                );
                logger.info(`Initialized wallet for ${chain}`);
            }
        } catch (error) {
            logger.error(`Failed to initialize wallets: ${error.message}`);
            throw error;
        }
    }

    async start() {
        try {
            // Initialize wallets
            await this.initializeWallets();

            // Start price monitoring
            setInterval(async () => {
                try {
                    await this.priceMonitor.updatePrices();
                    const opportunities = this.priceMonitor.getArbitrageOpportunities();
                    
                    for (const opportunity of opportunities) {
                        await this.executeArbitrage(opportunity);
                    }
                } catch (error) {
                    await this.handleExecutionError(error, { type: 'monitoring' });
                }
            }, 30000); // Check every 30 seconds

            // Start wallet health monitoring
            setInterval(async () => {
                try {
                    const balances = await this.walletManager.getAllBalances();
                    logger.info('Current wallet balances:', balances);
                } catch (error) {
                    await this.handleExecutionError(error, { type: 'wallet_monitoring' });
                }
            }, 60000); // Check every minute

        } catch (error) {
            logger.error(`Failed to start arbitrage executor: ${error.message}`);
            throw error;
        }
    }

    async executeArbitrage(opportunity) {
        const { token, from, to, priceDiff } = opportunity;
        const tradeId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        try {
            // Calculate optimal trade amount
            const amount = this.calculateOptimalAmount(priceDiff);
            if (!amount) return;

            // Get wallet and check balance
            const wallet = await this.walletManager.getWallet(from);
            const balance = await wallet.getBalance();
            
            if (balance < amount) {
                throw new Error('insufficient_balance');
            }

            // Calculate bridge fee
            const fee = await this.bridgeManager.calculateBridgeFee(from, to, amount);
            
            // Calculate net profit
            const netProfit = priceDiff - fee;
            if (netProfit < ARBITRAGE_CONFIG.minProfit) {
                return;
            }

            // Execute the trade
            this.activeTrades.set(tradeId, {
                token,
                from,
                to,
                amount,
                fee,
                netProfit,
                status: 'pending'
            });

            // Update risk exposure
            await this.riskManager.updateExposure({
                id: tradeId,
                sourceChain: from,
                targetChain: to,
                token,
                amount,
                bridge: 'wormhole'
            }, true);

            // Execute the bridge transfer
            let txHash;
            if (from === 'solana' && to === 'ethereum') {
                txHash = await this.bridgeManager.transferSolanaToEthereum(token, amount);
            } else if (from === 'solana' && to === 'bsc') {
                txHash = await this.bridgeManager.transferSolanaToBSC(token, amount);
            } else if (from === 'ethereum' && to === 'solana') {
                txHash = await this.bridgeManager.transferEthereumToSolana(token, amount);
            } else if (from === 'bsc' && to === 'solana') {
                txHash = await this.bridgeManager.transferBSCToSolana(token, amount);
            }

            // Track the transaction
            await this.walletManager.trackTransaction(from, txHash, {
                type: 'bridge',
                token,
                amount,
                from,
                to,
                tradeId
            });

            this.activeTrades.get(tradeId).status = 'completed';

            // Update risk exposure after completion
            await this.riskManager.updateExposure({
                id: tradeId,
                sourceChain: from,
                targetChain: to,
                token,
                amount,
                bridge: 'wormhole'
            }, false);
            
            // Log the trade
            this.logTrade(tradeId);

        } catch (error) {
            this.logError(error);
            await this.handleExecutionError(error, {
                type: 'arbitrage',
                from,
                to,
                token,
                amount: opportunity.amount
            });
        }

        // Calculate bridge fee
        const fee = await this.bridgeManager.calculateBridgeFee(from, to, amount);
        
        // Calculate net profit
        const netProfit = priceDiff - fee;
        if (netProfit < ARBITRAGE_CONFIG.minProfit) return;

        // Validate trade against risk parameters
        const isValid = await this.riskManager.validateTrade({
            sourceChain: from,
            targetChain: to,
            token,
            amount,
            expectedProfit: netProfit,
            slippage: ARBITRAGE_CONFIG.maxSlippage,
            poolLiquidity: await this.priceMonitor.getPoolLiquidity(token, from),
            bridge: 'wormhole', // Default bridge, can be made dynamic
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        });

        if (!isValid) {
            logger.warn('Trade rejected by risk manager');
            return;
        }

        // Execute the trade
        try {
            const tradeId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            this.activeTrades.set(tradeId, {
                token,
                from,
                to,
                amount,
                fee,
                netProfit,
                status: 'pending'
            });

            // Update risk exposure
            await this.riskManager.updateExposure({
                id: tradeId,
                sourceChain: from,
                targetChain: to,
                token,
                amount,
                bridge: 'wormhole'
            }, true);

            // Execute the bridge transfer
            let txHash;
            if (from === 'solana' && to === 'ethereum') {
                txHash = await this.bridgeManager.transferSolanaToEthereum(token, amount);
            } else if (from === 'solana' && to === 'bsc') {
                txHash = await this.bridgeManager.transferSolanaToBSC(token, amount);
            } else if (from === 'ethereum' && to === 'solana') {
                txHash = await this.bridgeManager.transferEthereumToSolana(token, amount);
            } else if (from === 'bsc' && to === 'solana') {
                txHash = await this.bridgeManager.transferBSCToSolana(token, amount);
            }

            // Track the transaction
            await this.walletManager.trackTransaction(from, txHash, {
                type: 'bridge',
                token,
                amount,
                from,
                to,
                tradeId
            });

            this.activeTrades.get(tradeId).status = 'completed';

            // Update risk exposure after completion
            await this.riskManager.updateExposure({
                id: tradeId,
                sourceChain: from,
                targetChain: to,
                token,
                amount,
                bridge: 'wormhole'
            }, false);
            
            // Log the trade
            this.logTrade(tradeId);

        } catch (error) {
            this.activeTrades.get(tradeId).status = 'failed';
            this.logError(error);
        }
    }

    calculateOptimalAmount(priceDiff) {
        const baseAmount = ARBITRAGE_CONFIG.minAmount;
        const maxAmount = ARBITRAGE_CONFIG.maxAmount;
        
        // Adjust amount based on price difference
        const multiplier = Math.min(1 + (priceDiff * 100), 5); // Max 5x multiplier
        const amount = baseAmount * multiplier;
        
        return Math.min(amount, maxAmount);
    }

    async handleExecutionError(error, context) {
        try {
            // Attempt to recover from the error
            const recovered = await this.errorRecovery.handleError(error, {
                ...context,
                walletManager: this.walletManager,
                bridgeManager: this.bridgeManager,
                config: this.config
            });

            if (!recovered) {
                logger.error(`Failed to recover from error: ${error.message}`);
                // Implement fallback strategy or alert system
            }

            // Log error statistics
            const errorStats = this.errorRecovery.getErrorStats();
            logger.info('Current error statistics:', errorStats);

        } catch (recoveryError) {
            logger.error(`Error recovery failed: ${recoveryError.message}`);
        }
    }

    async checkBalance(token, chain) {
        try {
            const wallet = await this.walletManager.getWallet(chain);
            return await wallet.getBalance();
        } catch (error) {
            await this.handleExecutionError(error, { type: 'balance_check', chain, token });
            return 0;
        }
    }

    logTrade(tradeId) {
        try {
            const trade = this.activeTrades.get(tradeId);
            logger.info(`Trade ${tradeId} completed:`);
            logger.info(`Token: ${trade.token}`);
            logger.info(`From: ${trade.from}`);
            logger.info(`To: ${trade.to}`);
            logger.info(`Amount: ${trade.amount}`);
            logger.info(`Fee: ${trade.fee}`);
            logger.info(`Net Profit: ${trade.netProfit}`);

            // Log risk metrics
            const metrics = this.riskManager.getExposureMetrics();
            logger.info('Current risk metrics:', metrics);

            // Log wallet balances
            const balances = this.walletManager.getAllBalances();
            logger.info('Updated wallet balances:', balances);

            // Log error statistics
            const errorStats = this.errorRecovery.getErrorStats();
            logger.info('Error statistics:', errorStats);
        } catch (error) {
            logger.error(`Failed to log trade ${tradeId}: ${error.message}`);
        }
    }

    logError(error) {
        logger.error('Arbitrage error:', error);
    }
}

module.exports = ArbitrageExecutor;
