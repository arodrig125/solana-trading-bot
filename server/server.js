// Import routes
const automationRoutes = require('./routes/automationRoutes');

// Use routes (add this with your other route definitions)
app.use('/api/automation', automationRoutes);
