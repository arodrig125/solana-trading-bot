const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

// Add a health check endpoint
app.get('/', (req, res) => {
  res.send('Solana Arbitrage Bot is running!');
});

// Add a status endpoint
app.get('/status', (req, res) => {
  res.json({
    status: 'running',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

// Import and run the bot
require('./index');
