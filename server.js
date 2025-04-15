// --- Environment Variable Validation ---
const { cleanEnv, str, num, bool, url } = require('envalid');

cleanEnv(process.env, {
  TELEGRAM_BOT_TOKEN: str(),
  TELEGRAM_CHAT_ID: str(),
  PRIVATE_KEY: str(),
  SHEET_ID: str(),
  SIMULATION: bool({ default: false }),
  RPC_ENDPOINT: url(),
  MONGODB_URI: str(),
  ADMIN_USERNAME: str(),
  ROLE: str(),
  ADMIN_PASSWORD_HASH: str(),
  JWT_SECRET: str(),
  SENTRY_DSN: str(),
  PORT: num({ default: 3001 }),
  ADMIN_CHAT_ID: str({ default: '' })
});

// Global error handlers for stability
const { sendMessage } = require('./utils/telegram');
const ADMIN_CHAT_ID = process.env.ADMIN_CHAT_ID;

function notifyAdmin(error) {
  if (ADMIN_CHAT_ID) {
    sendMessage(null, ADMIN_CHAT_ID, `❗️Critical Error:\n${error.message || error}\n${error.stack || ''}`);
  }
}

process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  notifyAdmin(err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  notifyAdmin(reason instanceof Error ? reason : new Error(String(reason)));
});

const Sentry = require('@sentry/node');
Sentry.init({ dsn: process.env.SENTRY_DSN });

const express = require('express');
const mongoose = require('mongoose');
const app = express();
const os = require('os');
const cluster = require('cluster');
const path = require('path');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const port = process.env.PORT || 3001;

// --- Modularized Middleware ---
const { apiLimiter } = require('./middleware/rateLimiter');
const securityHeaders = require('./middleware/securityHeaders');
const { sentryRequestHandler, sentryErrorHandler } = require('./middleware/sentryHandlers');

// --- Swagger/OpenAPI Docs ---
const { swaggerUi, swaggerSpec } = require('./swagger');

// Import scheduler
const { setupScheduledTasks } = require('./server/services/scheduler');

// Sentry request handler (must be first middleware)
app.use(sentryRequestHandler);

// Middleware setup
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(securityHeaders);

// Serve Swagger UI at /api-docs
// Visit http://localhost:3001/api-docs for interactive API docs
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// --- API Rate Limiting Middleware ---
// Apply to API and admin routes
app.use('/api/', apiLimiter);
app.use('/admin/api/', apiLimiter);

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://solarbot.99tdptt.mongodb.net/solarbot', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('Connected to MongoDB');
    // Initialize scheduler after DB connection (add this line)
    setupScheduledTasks();
}).catch(err => {
    console.error('MongoDB connection error:', err);
});

// API Routes
app.use('/api/users', require('./routes/users'));
// Add automation routes
app.use('/api/automation', require('./server/routes/automationRoutes'));

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// Admin routes
app.use('/admin/api', require('./routes/admin'));

// Admin login endpoint
app.post('/admin/login', async (req, res) => {
    const { username, password } = req.body;

    if (username !== ADMIN_USERNAME) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }

    try {
        const validPassword = await bcrypt.compare(password, ADMIN_PASSWORD_HASH);
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { username, role: 'admin' },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({ token });
    } catch (error) {
        res.status(500).json({ error: 'Login failed' });
    }
});

// Track active connections and requests
let connections = new Set();
let requestCount = 0;
let errorCount = 0;
let isShuttingDown = false;

// Middleware to track connections
app.use((req, res, next) => {
  // Don't accept new requests if shutting down
  if (isShuttingDown) {
    res.status(503).send('Server is shutting down');
    return;
  }

  const connection = { id: Date.now() };
  connections.add(connection);

  requestCount++;
  res.on('finish', () => {
    if (res.statusCode >= 400) {
      errorCount++;
    }
  });

  res.on('close', () => {
    connections.delete(connection);
  });

  next();
});

// Report metrics to master process
function reportMetrics() {
  if (cluster.isWorker) {
    process.send({
      type: 'metrics',
      data: {
        workerId: cluster.worker.id,
        requests: requestCount,
        errors: errorCount,
        connections: connections.size
      }
    });
    // Reset counters after reporting
    requestCount = 0;
    errorCount = 0;
  }
}

// Report metrics every 5 seconds
setInterval(reportMetrics, 5000);

// Basic security middleware
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// Add a robust health check endpoint
app.get('/health', async (req, res) => {
  const mongoState = mongoose.connection.readyState;
  let mongoStatus = 'unknown';
  if (mongoState === 1) mongoStatus = 'connected';
  else if (mongoState === 2) mongoStatus = 'connecting';
  else if (mongoState === 0) mongoStatus = 'disconnected';
  else if (mongoState === 3) mongoStatus = 'disconnecting';

  res.json({
    status: 'ok',
    mongo: mongoStatus,
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Add a health check endpoint
app.get('/', (req, res) => {
  res.send('Solana Arbitrage Bot is running!');
});

// Sentry test endpoint
app.get('/sentry-test', (req, res) => {
  throw new Error('Sentry integration test error');
});

// Sentry undefined function test endpoint
app.get('/sentry-test-undefined', (req, res) => {
  myUndefinedFunction(); // This will throw a ReferenceError
});

// Add a comprehensive status endpoint
app.get('/status', (req, res) => {
  const uptime = process.uptime();
  const memory = process.memoryUsage();
  const cpuUsage = process.cpuUsage();
  
  res.json({
    status: 'running',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: uptime,
    system: {
      platform: process.platform,
      nodeVersion: process.version,
      cpuCores: os.cpus().length,
      totalMemory: os.totalmem(),
      freeMemory: os.freemem()
    },
    process: {
      pid: process.pid,
      memory: {
        heapUsed: Math.round(memory.heapUsed / 1024 / 1024) + 'MB',
        heapTotal: Math.round(memory.heapTotal / 1024 / 1024) + 'MB',
        rss: Math.round(memory.rss / 1024 / 1024) + 'MB'
      },
      cpu: {
        user: cpuUsage.user,
        system: cpuUsage.system
      }
    }
  });
});

// Add metrics endpoint
app.get('/metrics', (req, res) => {
  // Simple Prometheus-style metrics
  const metrics = [
    `# HELP process_uptime_seconds The number of seconds the process has been running`,
    `# TYPE process_uptime_seconds gauge`,
    `process_uptime_seconds ${process.uptime()}`,
    `# HELP process_heap_bytes Node.js heap size in bytes`,
    `# TYPE process_heap_bytes gauge`,
    `process_heap_bytes ${process.memoryUsage().heapUsed}`,
  ].join('\n');
  
  res.setHeader('Content-Type', 'text/plain');
  res.send(metrics);
});

// Handle shutdown signal from master
process.on('message', async (msg) => {
  if (msg === 'shutdown') {
    console.log(`Worker ${cluster.worker.id} received shutdown signal`);
    await gracefulShutdown();
  }
});

// Graceful shutdown handler
async function gracefulShutdown() {
  isShuttingDown = true;
  console.log(`Worker ${cluster.worker.id} starting graceful shutdown...`);

  // Stop accepting new connections
  server.close(() => {
    console.log(`Worker ${cluster.worker.id} closed all connections`);
    process.exit(0);
  });

  // Force shutdown after timeout
  setTimeout(() => {
    console.log(`Worker ${cluster.worker.id} could not close connections in time, forcing shutdown`);
    process.exit(1);
  }, 30000);
}

// Start the server
const server = app.listen(port, () => {
  // If you want to debug req.user, use an Express middleware, not here.
  console.log(`Worker ${cluster.worker.id} listening on port ${port}`);
});

// Track server connections
server.on('connection', (connection) => {
  // Remove socket from tracking on close
  connection.on('close', () => {
    connections.delete(connection);
  });
});

// Import and run the bot if this is the primary worker or in standalone mode
if (!cluster.isWorker || cluster.worker.id === 1) {
  require('./index');
}

// 404 handler (for unmatched routes)
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

// Sentry error handler (must be before any other error middleware)
app.use(sentryErrorHandler);

// Global Express error handler (must be last)
app.use((err, req, res, next) => {
  logger.error({
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    body: req.body,
    user: req.user,
    time: new Date().toISOString()
  });
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message
  });
});
