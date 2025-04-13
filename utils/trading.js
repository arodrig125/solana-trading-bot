/**
 * Trading Module - Handles trade execution with risk management
 */
const logger = require('./logger');
const tierManager = require('./tier-manager');
const riskManager = require('./riskManager');
const { getWalletBalance, getWalletInfo } = require('./wallet');
const { executeTrade } = require('./jupiter');
const { recordTrade, updatePerformance } = require('./analytics');

/**
 * Process an arbitrage opportunity with risk management
 * @param {string} userId - User ID
 * @param {Object} opportunity - Arbitrage opportunity
 * @param {Object} settings - Bot settings
 * @param {Object} connection - Solana connection
 * @param {Object} wallet - User wallet
 * @returns {Object} - Trade result
 */
async function processOpportunity(userId, opportunity, settings, connection, wallet) {
  try {
    // Check tier access for live trading
    if (tierManager.isSimulationOnly(userId) && !settings.simulation) {
      logger.warn(`User ${userId} attempted live trading but only has simulation access`);
      return {
        success: false,
        message: 'Your current tier only supports simulation mode',
        simulation: true
      };
    }

    // Get wallet balance
    const walletBalance = await getWalletBalance(connection, wallet.publicKey);

    // Apply risk management checks
    const riskCheck = riskManager.shouldExecuteTrade(userId, opportunity);

    if (!riskCheck.execute) {
      logger.info(`Risk check failed for user ${userId}: ${riskCheck.reason}`);
      return {
        success: false,
        message: `Risk management prevented trade: ${riskCheck.reason}`,
        simulation: settings.simulation
      };
    }

    // Calculate optimal position size
    const positionSize = await riskManager.calculatePositionSize(
      userId,
      walletBalance,
      opportunity
    );

    // Execute the trade with the calculated position size
    const tradeResult = await executeTrade(
      connection,
      wallet,
      opportunity,
      positionSize,
      settings.simulation
    );

    // Record the trade
    if (tradeResult.success) {
      await recordTrade({
        userId,
        opportunity,
        amount: positionSize,
        initialValue: positionSize,
        result: tradeResult,
        simulation: settings.simulation,
        timestamp: Date.now()
      });

      // Update performance metrics
      await updatePerformance(userId, opportunity, tradeResult);
    }

    return tradeResult;
  } catch (error) {
    logger.errorMessage('Error processing opportunity:', error);
    return {
      success: false,
      message: `Error: ${error.message}`,
      simulation: settings.simulation
    };
  }
}

/**
 * Check active trades for stop-loss and take-profit conditions
 * @param {string} userId - User ID
 * @param {Array} activeTrades - List of active trades
 * @param {Object} connection - Solana connection
 * @param {Object} wallet - User wallet
 * @returns {Array} - Updated active trades
 */
async function monitorActiveTrades(userId, activeTrades, connection, wallet) {
  const updatedTrades = [];

  for (const trade of activeTrades) {
    try {
      // Get current value of the position
      const currentValue = await getCurrentTradeValue(trade, connection);

      // Check stop-loss condition
      if (riskManager.checkStopLoss(userId, trade, currentValue)) {
        // Close the position
        const closeResult = await closeTrade(trade, connection, wallet);

        if (closeResult.success) {
          logger.info(`Stop-loss triggered for trade ${trade.id}`);
          // Trade closed, don't add to updated trades
        } else {
          // Failed to close, keep monitoring
          updatedTrades.push(trade);
        }
      }
      // Check take-profit condition
      else if (riskManager.checkTakeProfit(userId, trade, currentValue)) {
        // Close the position
        const closeResult = await closeTrade(trade, connection, wallet);

        if (closeResult.success) {
          logger.info(`Take-profit triggered for trade ${trade.id}`);
          // Trade closed, don't add to updated trades
        } else {
          // Failed to close, keep monitoring
          updatedTrades.push(trade);
        }
      }
      // No conditions met, keep monitoring
      else {
        updatedTrades.push(trade);
      }
    } catch (error) {
      logger.errorMessage(`Error monitoring trade ${trade.id}:`, error);
      // Keep monitoring despite error
      updatedTrades.push(trade);
    }
  }

  return updatedTrades;
}

/**
 * Get current value of a trade
 * @param {Object} trade - Trade object
 * @param {Object} connection - Solana connection
 * @returns {number} - Current value
 */
async function getCurrentTradeValue(trade, connection) {
  // This is a placeholder - in a real implementation, you would
  // query the current market value of the tokens held in this trade
  return trade.initialValue; // For now, just return the initial value
}

/**
 * Close a trade (sell tokens)
 * @param {Object} trade - Trade object
 * @param {Object} connection - Solana connection
 * @param {Object} wallet - User wallet
 * @returns {Object} - Close result
 */
async function closeTrade(trade, connection, wallet) {
  // This is a placeholder - in a real implementation, you would
  // execute a trade to close the position
  return { success: true }; // For now, just return success
}

/**
 * Adjust scan interval based on user tier
 * @param {string} userId - User ID
 * @param {Object} settings - Bot settings
 * @returns {Object} - Updated settings
 */
function adjustScanInterval(userId, settings) {
  const scanInterval = tierManager.getUserScanInterval(userId);

  if (settings.scanning.interval < scanInterval) {
    settings.scanning.interval = scanInterval;
    logger.info(`Adjusted scan interval to ${scanInterval}ms based on user tier`);
  }

  return settings;
}

module.exports = {
  processOpportunity,
  monitorActiveTrades,
  adjustScanInterval
};
