const { RISK_CONFIG } = require('./riskConfig');
const logger = require('../../utils/logger');

class RiskManager {
    constructor() {
        this.config = RISK_CONFIG;
        this.activeTrades = new Map();
        this.exposureByChain = new Map();
        this.exposureByToken = new Map();
        this.dailyStats = {
            trades: 0,
            volume: 0,
            profit: 0,
            lastReset: Date.now()
        };
        this.hourlyStats = {
            trades: 0,
            lastReset: Date.now()
        };
        this.performanceMetrics = {
            successfulTrades: 0,
            totalTrades: 0,
            successfulBridges: 0,
            totalBridges: 0,
            profits: [],
            drawdowns: []
        };

        // Start periodic tasks
        this.startPeriodicTasks();
    }

    // Start periodic risk management tasks
    startPeriodicTasks() {
        // Reset daily stats
        setInterval(() => {
            const now = Date.now();
            if (now - this.dailyStats.lastReset >= 24 * 60 * 60 * 1000) {
                this.dailyStats = {
                    trades: 0,
                    volume: 0,
                    profit: 0,
                    lastReset: now
                };
            }
        }, 60 * 60 * 1000); // Check every hour

        // Reset hourly stats
        setInterval(() => {
            const now = Date.now();
            if (now - this.hourlyStats.lastReset >= 60 * 60 * 1000) {
                this.hourlyStats = {
                    trades: 0,
                    lastReset: now
                };
            }
        }, 5 * 60 * 1000); // Check every 5 minutes

        // Check for rebalancing needs
        setInterval(() => {
            this.checkRebalancingNeeds();
        }, this.config.positionParameters.rebalancing.frequency * 1000);
    }

    // Validate a potential trade against risk parameters
    async validateTrade(trade) {
        try {
            const {
                sourceChain,
                targetChain,
                token,
                amount,
                expectedProfit,
                slippage,
                poolLiquidity,
                bridge
            } = trade;

            // Check time-based parameters
            if (!this.checkTimeParameters()) {
                logger.warn('Trade rejected: Time parameters check failed');
                return false;
            }

            // Check network parameters
            if (!await this.checkNetworkParameters(sourceChain, targetChain)) {
                logger.warn('Trade rejected: Network parameters check failed');
                return false;
            }

            // Check contract parameters
            if (!await this.checkContractParameters(sourceChain, targetChain)) {
                logger.warn('Trade rejected: Contract parameters check failed');
                return false;
            }

            // Check cross-chain parameters
            if (!this.checkCrossChainParameters(sourceChain, targetChain, amount, bridge)) {
                logger.warn('Trade rejected: Cross-chain parameters check failed');
                return false;
            }

            // Check global risk parameters
            if (!this.checkGlobalExposure(amount)) {
                logger.warn(`Trade rejected: Global exposure limit exceeded`);
                return false;
            }

            // Check chain-specific parameters
            if (!this.checkChainParameters(sourceChain, targetChain, amount)) {
                logger.warn(`Trade rejected: Chain parameters check failed`);
                return false;
            }

            // Check token-specific parameters
            if (!this.checkTokenParameters(token, amount)) {
                logger.warn(`Trade rejected: Token parameters check failed`);
                return false;
            }

            // Check profit threshold
            if (!this.checkProfitThreshold(amount, expectedProfit)) {
                logger.warn(`Trade rejected: Insufficient profit margin`);
                return false;
            }

            // Check slippage
            if (!this.checkSlippage(slippage, sourceChain)) {
                logger.warn(`Trade rejected: Slippage too high`);
                return false;
            }

            // Check liquidity
            if (!this.checkLiquidity(poolLiquidity, sourceChain)) {
                logger.warn(`Trade rejected: Insufficient liquidity`);
                return false;
            }

            return true;
        } catch (error) {
            logger.error(`Error in trade validation: ${error.message}`);
            return false;
        }
    }

    // Check if the trade exceeds global exposure limits
    checkGlobalExposure(tradeAmount) {
        const currentExposure = Array.from(this.exposureByChain.values())
            .reduce((total, amount) => total + amount, 0);
        return (currentExposure + tradeAmount) <= this.config.global.maxTotalExposure;
    }

    // Check chain-specific risk parameters
    checkChainParameters(sourceChain, targetChain, amount) {
        const sourceParams = this.config.chainParameters[sourceChain];
        const targetParams = this.config.chainParameters[targetChain];

        if (!sourceParams || !targetParams) {
            logger.error(`Invalid chain parameters for ${sourceChain} or ${targetChain}`);
            return false;
        }

        // Check position size limits
        if (amount > sourceParams.maxPositionSize || amount > targetParams.maxPositionSize) {
            return false;
        }

        // Check current chain exposure
        const sourceExposure = this.exposureByChain.get(sourceChain) || 0;
        const targetExposure = this.exposureByChain.get(targetChain) || 0;

        return (sourceExposure + amount <= sourceParams.maxPositionSize) &&
               (targetExposure + amount <= targetParams.maxPositionSize);
    }

    // Check token-specific risk parameters
    checkTokenParameters(token, amount) {
        const tokenParams = this.config.tokenParameters[token];
        if (!tokenParams) {
            logger.error(`No risk parameters found for token ${token}`);
            return false;
        }

        const currentExposure = this.exposureByToken.get(token) || 0;
        return (currentExposure + amount) <= tokenParams.maxExposure;
    }

    // Check time-based parameters
    checkTimeParameters() {
        const now = new Date();
        const currentHour = now.getUTCHours();
        const currentMinute = now.getUTCMinutes();
        const currentTime = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;

        // Check trading hours
        if (currentTime < this.config.timeParameters.tradingHours.start ||
            currentTime > this.config.timeParameters.tradingHours.end) {
            return false;
        }

        // Check trade frequency limits
        if (this.dailyStats.trades >= this.config.timeParameters.maxDailyTrades ||
            this.hourlyStats.trades >= this.config.timeParameters.maxHourlyTrades) {
            return false;
        }

        // Check high volatility periods
        for (const period of this.config.timeParameters.highVolatilityPeriods) {
            if (currentTime >= period.start && currentTime <= period.end) {
                // Implement stricter risk parameters during high volatility
                return this.checkVolatilityPeriodRisk();
            }
        }

        return true;
    }

    // Check network parameters
    async checkNetworkParameters(sourceChain, targetChain) {
        const sourceParams = this.config.networkParameters.confirmations[sourceChain];
        const targetParams = this.config.networkParameters.confirmations[targetChain];

        // Check network load
        const sourceLoad = await this.getNetworkLoad(sourceChain);
        const targetLoad = await this.getNetworkLoad(targetChain);

        if (sourceLoad >= this.config.networkParameters.networkLoad.high ||
            targetLoad >= this.config.networkParameters.networkLoad.high) {
            return false;
        }

        return true;
    }

    // Check contract parameters
    async checkContractParameters(sourceChain, targetChain) {
        // Implement contract validation logic
        return true;
    }

    // Check cross-chain parameters
    checkCrossChainParameters(sourceChain, targetChain, amount, bridge) {
        // Check pending transfers
        const pendingTransfers = this.getPendingTransfers(sourceChain);
        if (pendingTransfers >= this.config.crossChainParameters.maxPendingTransfers) {
            return false;
        }

        // Check transfer size limits
        if (amount > this.config.crossChainParameters.maxTransferSize[sourceChain] ||
            amount > this.config.crossChainParameters.maxTransferSize[targetChain]) {
            return false;
        }

        // Check bridge utilization
        const bridgeUtil = this.getBridgeUtilization(bridge);
        if (bridgeUtil >= this.config.crossChainParameters.bridgeUtilization.critical) {
            return false;
        }

        return true;
    }

    // Check if expected profit meets minimum threshold
    checkProfitThreshold(amount, expectedProfit) {
        const profitPercentage = (expectedProfit / amount) * 100;

        // Check against performance targets
        const dailyTarget = this.config.performanceParameters.profitTargets.daily;
        if (this.dailyStats.profit + expectedProfit < dailyTarget * this.dailyStats.volume) {
            return false;
        }

        return profitPercentage >= this.config.global.minProfitThreshold;
    }

    // Check if slippage is within acceptable limits
    checkSlippage(slippage, chain) {
        const maxSlippage = this.config.chainParameters[chain].maxSlippage;
        return slippage <= maxSlippage;
    }

    // Check if pool liquidity is sufficient
    checkLiquidity(poolLiquidity, chain) {
        const minLiquidity = this.config.chainParameters[chain].minLiquidity;
        return poolLiquidity >= minLiquidity;
    }

    // Update exposure tracking when a trade is executed
    async updateExposure(trade, isOpen = true) {
        const { sourceChain, targetChain, token, amount } = trade;
        const exposureChange = isOpen ? amount : -amount;

        // Update chain exposure
        this.updateChainExposure(sourceChain, exposureChange);
        this.updateChainExposure(targetChain, exposureChange);

        // Update token exposure
        this.updateTokenExposure(token, exposureChange);

        // Track active trade
        if (isOpen) {
            this.activeTrades.set(trade.id, trade);
        } else {
            this.activeTrades.delete(trade.id);
        }
    }

    // Update chain-specific exposure
    updateChainExposure(chain, amount) {
        const currentExposure = this.exposureByChain.get(chain) || 0;
        this.exposureByChain.set(chain, currentExposure + amount);
    }

    // Update token-specific exposure
    updateTokenExposure(token, amount) {
        const currentExposure = this.exposureByToken.get(token) || 0;
        this.exposureByToken.set(token, currentExposure + amount);
    }

    // Check if emergency stop loss has been triggered
    checkEmergencyStopLoss(unrealizedLoss) {
        return (unrealizedLoss >= this.config.global.emergencyStopLoss);
    }

    // Get risk score for a specific trade
    getRiskScore(trade) {
        const { sourceChain, targetChain, token, bridge, amount } = trade;
        
        // Base risk factors
        const chainRisk = Math.max(
            this.config.chainParameters[sourceChain].riskScore,
            this.config.chainParameters[targetChain].riskScore
        );
        const tokenRisk = this.config.tokenParameters[token].riskScore;
        const bridgeRisk = this.config.bridgeParameters[bridge].riskScore;

        // Dynamic risk factors
        const sizeRisk = this.calculateSizeRisk(amount);
        const timeRisk = this.calculateTimeRisk();
        const marketRisk = this.calculateMarketRisk(token);
        const networkRisk = this.calculateNetworkRisk(sourceChain, targetChain);

        // Weighted risk score
        const weights = {
            chain: 0.25,
            token: 0.15,
            bridge: 0.2,
            size: 0.15,
            time: 0.1,
            market: 0.1,
            network: 0.05
        };

        return (
            chainRisk * weights.chain +
            tokenRisk * weights.token +
            bridgeRisk * weights.bridge +
            sizeRisk * weights.size +
            timeRisk * weights.time +
            marketRisk * weights.market +
            networkRisk * weights.network
        );
    }

    // Calculate risk based on position size
    calculateSizeRisk(amount) {
        const maxSize = this.config.positionParameters.sizing.maxSize;
        return amount / maxSize;
    }

    // Calculate risk based on time of day
    calculateTimeRisk() {
        const now = new Date();
        const currentHour = now.getUTCHours();
        
        // Higher risk during volatile hours
        for (const period of this.config.timeParameters.highVolatilityPeriods) {
            const periodStart = parseInt(period.start.split(':')[0]);
            const periodEnd = parseInt(period.end.split(':')[0]);
            if (currentHour >= periodStart && currentHour <= periodEnd) {
                return 0.8;
            }
        }
        return 0.3;
    }

    // Calculate market-based risk
    calculateMarketRisk(token) {
        const volatility = this.getMarketVolatility(token);
        const volume = this.getMarketVolume(token);
        
        let risk = 0.5; // Base risk
        
        // Adjust for volatility
        if (volatility >= this.config.marketParameters.volatilityThresholds.extreme) {
            risk += 0.4;
        } else if (volatility >= this.config.marketParameters.volatilityThresholds.high) {
            risk += 0.2;
        }
        
        // Adjust for volume
        if (volume <= this.config.marketParameters.volumeThresholds.low) {
            risk += 0.3;
        } else if (volume <= this.config.marketParameters.volumeThresholds.medium) {
            risk += 0.1;
        }
        
        return Math.min(risk, 1.0);
    }

    // Calculate network-based risk
    calculateNetworkRisk(sourceChain, targetChain) {
        const sourceScore = this.config.crossChainParameters.chainPriorityScores[sourceChain];
        const targetScore = this.config.crossChainParameters.chainPriorityScores[targetChain];
        
        return 1 - ((sourceScore + targetScore) / 2);
    }

    // Get current exposure metrics
    getExposureMetrics() {
        return {
            byChain: Object.fromEntries(this.exposureByChain),
            byToken: Object.fromEntries(this.exposureByToken),
            activeTrades: this.activeTrades.size,
            totalExposure: Array.from(this.exposureByChain.values())
                .reduce((total, amount) => total + amount, 0)
        };
    }
}

module.exports = RiskManager;
