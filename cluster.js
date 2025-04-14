const cluster = require('cluster');
const logger = require('./utils/logger');
const scalingManager = require('./utils/scaling-manager');
const alertManager = require('./utils/alerts');

// Handle uncaught exceptions
process.on('uncaughtException', async (error) => {
  logger.error('Uncaught exception in cluster manager:', error);
  await alertManager.trackError({
    message: `Cluster manager error: ${error.message}`,
    critical: true
  });
});

// Handle unhandled promise rejections
process.on('unhandledRejection', async (reason) => {
  logger.error('Unhandled rejection in cluster manager:', reason);
  await alertManager.trackError({
    message: `Cluster manager promise rejection: ${reason}`,
    critical: true
  });
});

async function startClusterManager() {
  try {
    logger.info('Starting cluster manager...');

    // Initialize the scaling manager
    await scalingManager.initialize();

    // Handle process signals for graceful shutdown
    process.on('SIGTERM', async () => {
      logger.info('Received SIGTERM. Starting graceful shutdown...');
      
      // Alert about shutdown
      await alertManager.sendAlert(
        'Cluster Shutdown',
        'Initiating graceful shutdown of all workers',
        'warning'
      );

      // Notify all workers to stop accepting new requests
      for (const worker of Object.values(cluster.workers)) {
        worker.send('shutdown');
      }

      // Give workers time to finish processing
      setTimeout(() => {
        logger.info('Terminating remaining workers...');
        for (const worker of Object.values(cluster.workers)) {
          if (worker.isConnected()) {
            worker.kill();
          }
        }
        process.exit(0);
      }, 10000); // Wait 10 seconds before force termination
    });

    // Log cluster events
    cluster.on('fork', (worker) => {
      logger.info(`Worker ${worker.id} started`);
    });

    cluster.on('exit', async (worker, code, signal) => {
      const exitType = signal ? `signal ${signal}` : `code ${code}`;
      logger.warn(`Worker ${worker.id} died (${exitType}). Handling worker exit...`);
      
      await alertManager.sendAlert(
        'Worker Exit',
        `Worker ${worker.id} exited with ${exitType}`,
        code === 0 ? 'info' : 'warning'
      );
    });

    cluster.on('disconnect', (worker) => {
      logger.warn(`Worker ${worker.id} disconnected`);
    });

    // Start periodic status reporting
    setInterval(async () => {
      const metrics = scalingManager.getMetrics();
      logger.info('Cluster status:', {
        workers: Object.keys(cluster.workers || {}).length,
        cpu: `${metrics.cpuUsage.toFixed(1)}%`,
        memory: `${metrics.memoryUsage.toFixed(1)}%`,
        requests: `${metrics.requestRate}/min`
      });
    }, 60000); // Log status every minute

    logger.info('Cluster manager initialized successfully');

  } catch (error) {
    logger.error('Failed to start cluster manager:', error);
    await alertManager.trackError({
      message: `Failed to start cluster manager: ${error.message}`,
      critical: true
    });
    process.exit(1);
  }
}

// Start the cluster manager
startClusterManager();
