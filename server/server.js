// Import routes
const automationRoutes = require('./routes/automationRoutes');
const usageRoutes = require('./routes/usageRoutes');

// Use routes (add this with your other route definitions)
app.use('/api/automation', automationRoutes);
app.use('/api/usage', usageRoutes);
