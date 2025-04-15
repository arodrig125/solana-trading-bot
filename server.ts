import express, { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import os from 'os';
import cluster from 'cluster';
import path from 'path';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { cleanEnv, str, num, bool, url } from 'envalid';
import * as Sentry from '@sentry/node';
import { apiLimiter } from './middleware/rateLimiter';
import securityHeaders from './middleware/securityHeaders';
import { sentryRequestHandler, sentryErrorHandler } from './middleware/sentryHandlers';
import { swaggerUi, swaggerSpec } from './swagger';
import { setupScheduledTasks } from './server/services/scheduler';
import { sendMessage } from './utils/telegram';

// --- Environment Variable Validation ---
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

const ADMIN_CHAT_ID = process.env.ADMIN_CHAT_ID;
const port = process.env.PORT ? Number(process.env.PORT) : 3001;

function notifyAdmin(error: Error) {
  if (ADMIN_CHAT_ID) {
    sendMessage(null, ADMIN_CHAT_ID, `❗️Critical Error:\n${error.message || error}\n${error.stack || ''}`);
  }
}

process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  notifyAdmin(err);
});

process.on('unhandledRejection', (reason: any, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  notifyAdmin(reason instanceof Error ? reason : new Error(String(reason)));
});

Sentry.init({ dsn: process.env.SENTRY_DSN });

const app = express();

// Sentry request handler (must be first middleware)
app.use(sentryRequestHandler);

// Middleware setup
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(securityHeaders);

// Serve Swagger UI at /api-docs
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// --- API Rate Limiting Middleware ---
// Apply to API and admin routes
app.use('/api/', apiLimiter);
app.use('/admin/api/', apiLimiter);

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || '', {
    useNewUrlParser: true,
    useUnifiedTopology: true
} as mongoose.ConnectOptions).then(() => {
    console.log('Connected to MongoDB');
    setupScheduledTasks();
}).catch(err => {
    console.error('MongoDB connection error:', err);
});

// API Routes
app.use('/api/users', require('./routes/users'));
app.use('/api/automation', require('./server/routes/automationRoutes'));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/admin/api', require('./routes/admin'));

// Admin login endpoint
app.post('/admin/login', async (req: Request, res: Response) => {
    const { username, password } = req.body;
    if (username !== process.env.ADMIN_USERNAME) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }
    try {
        const validPassword = await bcrypt.compare(password, process.env.ADMIN_PASSWORD_HASH!);
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        const token = jwt.sign(
            { username, role: 'admin' },
            process.env.JWT_SECRET!,
            { expiresIn: '24h' }
        );
        res.json({ token });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Health check endpoint
app.get('/', (req: Request, res: Response) => {
  res.send('Solana Arbitrage Bot is running!');
});

// Sentry test endpoints
app.get('/sentry-test', (req: Request, res: Response) => {
  throw new Error('Sentry integration test error');
});
app.get('/sentry-test-undefined', (req: Request, res: Response) => {
  // @ts-ignore
  myUndefinedFunction(); // This will throw a ReferenceError
});

// Status endpoint
app.get('/status', (req: Request, res: Response) => {
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

// Metrics endpoint
app.get('/metrics', (req: Request, res: Response) => {
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

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Not Found' });
});

// Sentry error handler
app.use(sentryErrorHandler);

// Global Express error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  // @ts-ignore
  const logger = require('./utils/logger');
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

// Start the server
const server = app.listen(port, () => {
  if (cluster.worker) {
    console.log(`Worker ${cluster.worker.id} listening on port ${port}`);
  } else {
    console.log(`Server listening on port ${port}`);
  }
});

// Track server connections (optional, can be implemented as needed)
// server.on('connection', (connection) => { ... });

// Import and run the bot if this is the primary worker or in standalone mode
if (!cluster.isWorker || (cluster.worker && cluster.worker.id === 1)) {
  require('./index');
}
