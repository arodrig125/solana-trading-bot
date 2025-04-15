/**
 * API Usage Analytics Endpoint
 * Returns API usage stats for the dashboard analytics
 */

const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { authMiddleware } = require('../middleware/auth');

// Example: Store API usage in a collection called 'apiUsageStats'.
// Each document: { endpoint: String, count: Number, errors: Number, rateLimitViolations: Number }

router.get('/stats', authMiddleware, async (req, res) => {
  try {
    // Aggregate usage stats for all endpoints (could filter by user if needed)
    const stats = await mongoose.connection.db.collection('apiUsageStats').find({}).toArray();
    // Aggregate into arrays for the frontend
    const endpoints = stats.map(s => s.endpoint);
    const counts = stats.map(s => s.count);
    const errors = stats.map(s => s.errors || 0);
    const rateLimits = stats.map(s => s.rateLimitViolations || 0);
    res.json({ endpoints, counts, errors, rateLimits });
  } catch (error) {
    console.error('Error fetching API usage stats:', error);
    res.status(500).json({ message: 'Failed to fetch API usage stats' });
  }
});

module.exports = router;
