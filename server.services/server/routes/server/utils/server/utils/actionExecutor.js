// Basic Express server setup
const express = require('express');
const app = express();
const PORT = 5000;  // Using port 5000

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Default route
app.get('/', (req, res) => {
  res.send('Solana Trading Bot API is running');
});

// Mock rules endpoint
app.get('/api/automation/rules', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Risk automation API is working',
    rules: [
      {
        id: '1',
        name: 'Sample Rule',
        description: 'This is a sample rule for testing',
        conditions: [{type: 'balance', operator: '<', value: 100}],
        actions: [{type: 'notify', params: {message: 'Low balance alert'}}],
        active: true
      }
    ]
  });
});

// Start server - explicitly binding to all interfaces
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});