const { formatNumber, formatPercentage, formatTimestamp } = require('./formatters');

/**
 * Format recent arbitrage opportunities for display
 * @param {Array} opportunities Array of opportunity objects
 * @returns {string} Formatted message
 */
function formatRecentOpportunities(opportunities) {
  if (!opportunities || opportunities.length === 0) {
    return '*Recent Opportunities* 📊\n\nNo opportunities found in the last 24 hours.';
  }

  const message = ['*Recent Opportunities* 📊\n'];
  
  opportunities.forEach((opp, index) => {
    message.push(
      `${index + 1}. *${opp.tokenSymbol}*\n` +
      `   • Profit: *${formatPercentage(opp.profitPercent)}*\n` +
      `   • Route: ${opp.route.path.join(' → ')}\n` +
      `   • Time: ${formatTimestamp(opp.timestamp)}\n`
    );
  });

  return message.join('\n');
}

/**
 * Format recent trades for display
 * @param {Array} trades Array of trade objects
 * @returns {string} Formatted message
 */
function formatRecentTrades(trades) {
  if (!trades || trades.length === 0) {
    return '*Recent Trades* 📈\n\nNo trades executed in the last 24 hours.';
  }

  const message = ['*Recent Trades* 📈\n'];
  
  trades.forEach((trade, index) => {
    const profitColor = trade.profit >= 0 ? '🟢' : '🔴';
    message.push(
      `${index + 1}. *${trade.tokenSymbol}*\n` +
      `   • Profit: ${profitColor} *${formatNumber(trade.profit)} SOL* (${formatPercentage(trade.profitPercent)})\n` +
      `   • Route: ${trade.route.path.join(' → ')}\n` +
      `   • Time: ${formatTimestamp(trade.timestamp)}\n`
    );
  });

  return message.join('\n');
}

/**
 * Format performance summary for display
 * @param {Object} summary Performance summary object
 * @returns {string} Formatted message
 */
function formatPerformanceSummary(summary) {
  const profitColor = summary.totalProfit >= 0 ? '🟢' : '🔴';
  const winRate = (summary.totalTrades > 0) 
    ? (summary.profitableTrades / summary.totalTrades * 100).toFixed(1) 
    : 0;

  return (
    '*Performance Summary* 📊\n\n' +
    `*24 Hour Stats*\n` +
    `• Total Profit: ${profitColor} *${formatNumber(summary.totalProfit)} SOL*\n` +
    `• Total Trades: *${summary.totalTrades}*\n` +
    `• Profitable Trades: *${summary.profitableTrades}* (${winRate}%)\n` +
    `• Average Profit: *${formatPercentage(summary.averageProfitPercent)}*\n` +
    `• Best Trade: *${formatPercentage(summary.bestTradePercent)}*\n\n` +
    `*Volume*\n` +
    `• Total Volume: *${formatNumber(summary.totalVolume)} SOL*\n` +
    `• Average Size: *${formatNumber(summary.averageTradeSize)} SOL*\n\n` +
    `*Opportunities*\n` +
    `• Total Found: *${summary.totalOpportunities}*\n` +
    `• Average Profit: *${formatPercentage(summary.averageOpportunityProfit)}*\n` +
    `• Best Opportunity: *${formatPercentage(summary.bestOpportunityProfit)}*`
  );
}

module.exports = {
  formatRecentOpportunities,
  formatRecentTrades,
  formatPerformanceSummary
};
