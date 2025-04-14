/**
 * API Routes for Risk Automation System
 * Endpoints for managing automation rules and triggering evaluations
 */

const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const RuleEvaluator = require('../services/ruleEvaluator');

// Middleware imports - use your existing auth and rate limit middleware
const { authMiddleware } = require('../middleware/auth');
const { rateLimit } = require('../middleware/rateLimit');

// Initialize rule evaluator
const ruleEvaluator = new RuleEvaluator();

// Rate limiting configs based on subscription tier
const getRulesRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: {
    free: 20,
    standard: 50,
    premium: 100
  },
  message: 'Too many requests, please try again later'
});

const evaluateRulesRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: {
    free: 5,
    standard: 10,
    premium: 30
  },
  message: 'Evaluation rate limit exceeded'
});

/**
 * GET /rules
 * Get all automation rules for the authenticated user's wallet
 */
router.get('/rules', authMiddleware, getRulesRateLimit, async (req, res) => {
  try {
    const userId = req.user.id;
    const walletId = req.query.walletId || req.user.defaultWalletId;
    
    // Get rules from database
    const rules = await mongoose.connection.db.collection('automationRules')
      .find({ userId, walletId })
      .toArray();
    
    res.json({ success: true, rules });
  } catch (error) {
    console.error('Error fetching automation rules:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch automation rules' });
  }
});

/**
 * POST /rules
 * Create a new automation rule
 */
router.post('/rules', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const walletId = req.body.walletId || req.user.defaultWalletId;
    const rule = req.body;
    
    // Validate rule structure
    if (!rule.name || !rule.conditions || !rule.actions) {
      return res.status(400).json({
        success: false,
        message: 'Invalid rule format. Name, conditions, and actions are required.'
      });
    }
    
    // Add metadata
    rule.userId = userId;
    rule.walletId = walletId;
    rule.createdAt = new Date().toISOString();
    rule.updatedAt = rule.createdAt;
    rule.lastTriggered = null;
    
    // Ensure rule has an ID
    if (!rule.id) {
      rule.id = 'rule_' + Date.now();
    }
    
    // Insert into database
    const result = await mongoose.connection.db.collection('automationRules').insertOne(rule);
    
    res.json({ success: true, rule: { ...rule, _id: result.insertedId } });
  } catch (error) {
    console.error('Error creating automation rule:', error);
    res.status(500).json({ success: false, message: 'Failed to create automation rule' });
  }
});

/**
 * PUT /rules/:ruleId
 * Update an existing automation rule
 */
router.put('/rules/:ruleId', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const ruleId = req.params.ruleId;
    const updates = req.body;
    
    // Prevent updating critical fields
    delete updates.userId;
    delete updates._id;
    delete updates.id;
    delete updates.createdAt;
    
    // Add update timestamp
    updates.updatedAt = new Date().toISOString();
    
    // Update in database
    const result = await mongoose.connection.db.collection('automationRules').updateOne(
      { id: ruleId, userId },
      { $set: updates }
    );
    
    if (result.matchedCount === 0) {
      return res.status(404).json({ success: false, message: 'Rule not found' });
    }
    
    res.json({ success: true, message: 'Rule updated successfully' });
  } catch (error) {
    console.error('Error updating automation rule:', error);
    res.status(500).json({ success: false, message: 'Failed to update automation rule' });
  }
});

/**
 * DELETE /rules/:ruleId
 * Delete an automation rule
 */
router.delete('/rules/:ruleId', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const ruleId = req.params.ruleId;
    
    // Delete from database
    const result = await mongoose.connection.db.collection('automationRules').deleteOne(
      { id: ruleId, userId }
    );
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, message: 'Rule not found' });
    }
    
    res.json({ success: true, message: 'Rule deleted successfully' });
  } catch (error) {
    console.error('Error deleting automation rule:', error);
    res.status(500).json({ success: false, message: 'Failed to delete automation rule' });
  }
});

/**
 * POST /rules/evaluate
 * Manually trigger rule evaluation for testing
 */
router.post('/rules/evaluate', authMiddleware, evaluateRulesRateLimit, async (req, res) => {
  try {
    const userId = req.user.id;
    const walletId = req.body.walletId || req.user.defaultWalletId;
    
    // Evaluate rules
    const result = await ruleEvaluator.evaluateRulesForUser(userId, walletId);
    
    res.json(result);
  } catch (error) {
    console.error('Error evaluating rules:', error);
    res.status(500).json({ success: false, message: 'Failed to evaluate rules' });
  }
});

/**
 * GET /rules/:ruleId/history
 * Get execution history for a specific rule
 */
router.get('/rules/:ruleId/history', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const ruleId = req.params.ruleId;
    
    // Get execution history from database
    const history = await mongoose.connection.db.collection('ruleExecutions')
      .find({ ruleId, userId })
      .sort({ timestamp: -1 })
      .limit(50)
      .toArray();
    
    res.json({ success: true, history });
  } catch (error) {
    console.error('Error fetching rule execution history:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch rule execution history' });
  }
});

module.exports = router;