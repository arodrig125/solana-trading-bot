const assert = require('assert');
const timeAnalytics = require('../utils/timeAnalytics');
const logger = require('../utils/logger');

async function testTimeAnalytics() {
  logger.info('🧪 Testing time-based analytics...');

  // Test period key generation
  const now = Date.now();
  const periodKeys = timeAnalytics.getPeriodKeys(now);
  assert(periodKeys.hourly, 'Should generate hourly key');
  assert(periodKeys.daily, 'Should generate daily key');
  assert(periodKeys.weekly, 'Should generate weekly key');
  assert(periodKeys.monthly, 'Should generate monthly key');
  
  logger.info('Period keys:', periodKeys);

  // Test opportunity recording
  const testOpportunity = {
    id: 'test-opp-1',
    tokenSymbol: 'SOL/USDC',
    profitPercent: 1.5,
    route: { path: ['Orca', 'Raydium'] },
    recordedAt: new Date().toISOString()
  };
  
  const oppRecorded = timeAnalytics.recordOpportunity(testOpportunity);
  assert(oppRecorded, 'Should record opportunity');

  // Test trade recording with multiple trades
  const trades = [
    {
      id: 'test-trade-1',
      tokenSymbol: 'SOL/USDC',
      profit: 0.5,
      profitPercent: 2.1,
      volume: 100,
      route: { path: ['Orca', 'Raydium'] },
      duration: 1500,  // 1.5 seconds
      latency: 200,    // 200ms
      success: true,
      recordedAt: new Date().toISOString()
    },
    {
      id: 'test-trade-2',
      tokenSymbol: 'SOL/USDC',
      profit: -0.2,
      profitPercent: -0.8,
      volume: 100,
      route: { path: ['Orca', 'Raydium'] },
      duration: 2000,  // 2 seconds
      latency: 300,    // 300ms
      success: false,
      recordedAt: new Date().toISOString()
    },
    {
      id: 'test-trade-3',
      tokenSymbol: 'SOL/USDC',
      profit: 0.8,
      profitPercent: 3.2,
      volume: 100,
      route: { path: ['Orca', 'Raydium'] },
      duration: 1000,  // 1 second
      latency: 150,    // 150ms
      success: true,
      recordedAt: new Date().toISOString()
    }
  ];
  
  // Record all trades
  trades.forEach(trade => {
    const recorded = timeAnalytics.recordTrade(trade);
    assert(recorded, `Should record trade ${trade.id}`);
  });

  // Test metrics retrieval
  const hourlyMetrics = timeAnalytics.getPerformanceMetrics(
    timeAnalytics.TIME_PERIODS.HOURLY,
    periodKeys.hourly
  );
  
  assert(hourlyMetrics, 'Should retrieve hourly metrics');
  assert.equal(hourlyMetrics.opportunities, 1, 'Should have 1 opportunity');
  assert.equal(hourlyMetrics.trades, 3, 'Should have 3 trades');
  assert.equal(hourlyMetrics.successfulTrades, 2, 'Should have 2 successful trades');
  assert.equal(hourlyMetrics.failedTrades, 1, 'Should have 1 failed trade');
  
  // Verify advanced metrics
  assert(hourlyMetrics.winRate > 0, 'Should have win rate');
  assert(hourlyMetrics.profitFactor > 0, 'Should have profit factor');
  assert(hourlyMetrics.sharpeRatio !== undefined, 'Should have Sharpe ratio');
  assert(hourlyMetrics.avgTradeProfit > 0, 'Should have average trade profit');
  assert(hourlyMetrics.avgTradeDuration > 0, 'Should have average trade duration');
  
  // Verify risk metrics
  assert(hourlyMetrics.riskMetrics.maxDrawdown >= 0, 'Should have max drawdown');
  assert(hourlyMetrics.riskMetrics.volatility >= 0, 'Should have volatility');
  assert(hourlyMetrics.riskMetrics.valueAtRisk >= 0, 'Should have Value at Risk');
  
  // Verify token metrics
  const tokenStats = hourlyMetrics.tokens['SOL/USDC'];
  assert(tokenStats.successRate > 0, 'Should have token success rate');
  assert(tokenStats.avgProfit > 0, 'Should have token average profit');
  
  // Verify DEX metrics
  const orcaStats = hourlyMetrics.dexes['Orca'];
  assert(orcaStats.latency > 0, 'Should have DEX latency');
  assert(orcaStats.successRate > 0, 'Should have DEX success rate');
  
  logger.info('Hourly metrics:', JSON.stringify(hourlyMetrics, null, 2));

  // Test best performers
  const bestTokens = timeAnalytics.getBestPerformingTokens(
    timeAnalytics.TIME_PERIODS.HOURLY,
    periodKeys.hourly
  );
  
  assert(bestTokens.length > 0, 'Should have best performing tokens');
  assert.equal(bestTokens[0].token, 'SOL/USDC', 'SOL/USDC should be best token');
  
  logger.info('Best performing tokens:', bestTokens);

  const bestDEXes = timeAnalytics.getBestPerformingDEXes(
    timeAnalytics.TIME_PERIODS.HOURLY,
    periodKeys.hourly
  );
  
  assert(bestDEXes.length > 0, 'Should have best performing DEXes');
  assert(bestDEXes.some(d => d.dex === 'Orca'), 'Orca should be in best DEXes');
  assert(bestDEXes.some(d => d.dex === 'Raydium'), 'Raydium should be in best DEXes');
  
  logger.info('Best performing DEXes:', bestDEXes);

  // Test data cleanup
  timeAnalytics.cleanupOldData();
  const metricsAfterCleanup = timeAnalytics.getPerformanceMetrics(
    timeAnalytics.TIME_PERIODS.HOURLY,
    periodKeys.hourly
  );
  
  assert(metricsAfterCleanup, 'Recent metrics should exist after cleanup');
  
  logger.info('✅ Time analytics tests passed');
}

// Run tests
testTimeAnalytics()
  .then(() => {
    logger.info('All tests completed successfully');
    process.exit(0);
  })
  .catch(error => {
    logger.error('❌ Error testing time analytics:', error);
    process.exit(1);
  });
