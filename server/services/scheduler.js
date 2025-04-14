/**
 * Scheduler for Risk Automation System
 * Runs periodic tasks to evaluate rules and perform maintenance
 */

const cron = require('node-cron');
const mongoose = require('mongoose');
const RuleEvaluator = require('./ruleEvaluator');

const ruleEvaluator = new RuleEvaluator();

function setupScheduledTasks() {
  console.log('Setting up scheduled tasks for risk automation...');
  
  // Run rule evaluation every 5 minutes
  cron.schedule('*/5 * * * *', async () => {
    try {
      console.log('Running scheduled rule evaluation...');
      
      // Get all unique user/wallet combinations with active rules
      const userWalletPairs = await mongoose.connection.db.collection('automationRules')
        .aggregate([
          { $match: { active: true } },
          { $group: { _id: { userId: '$userId', walletId: '$walletId' } } }
        ])
        .toArray();
      
      // Evaluate rules for each user/wallet pair
      for (const pair of userWalletPairs) {
        const { userId, walletId } = pair._id;
        
        try {
          await ruleEvaluator.evaluateRulesForUser(userId, walletId);
        } catch (error) {
          console.error(`Error evaluating rules for user ${userId}, wallet ${walletId}:`, error);
        }
      }
      
      console.log('Scheduled rule evaluation completed');
    } catch (error) {
      console.error('Error in scheduled rule evaluation:', error);
    }
  });
  
  // Clean up old rule execution records daily at midnight
  cron.schedule('0 0 * * *', async () => {
    try {
      console.log('Running rule execution history cleanup...');
      
      // Keep only last 30 days of execution history
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const result = await mongoose.connection.db.collection('ruleExecutions')
        .deleteMany({ timestamp: { $lt: thirtyDaysAgo.toISOString() } });
      
      console.log(`Deleted ${result.deletedCount} old rule execution records`);
    } catch (error) {
      console.error('Error in rule execution history cleanup:', error);
    }
  });
  
  return true;
}

module.exports = {
  setupScheduledTasks
};