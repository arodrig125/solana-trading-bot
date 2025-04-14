const os = require('os');
const cluster = require('cluster');
const logger = require('./logger');
const alertManager = require('./alerts');

class ScalingManager {
  constructor() {
    this.metrics = {
      cpuUsage: 0,
      memoryUsage: 0,
      activeConnections: 0,
      requestRate: 0,
      errorRate: 0
    };

    this.thresholds = {
      cpu: {
        scaleUp: 70,    // Scale up when CPU > 70%
        scaleDown: 30   // Scale down when CPU < 30%
      },
      memory: {
        scaleUp: 80,    // Scale up when Memory > 80%
        scaleDown: 40   // Scale down when Memory < 40%
      },
      requests: {
        scaleUp: 1000,  // Scale up when requests/min > 1000
        scaleDown: 200  // Scale down when requests/min < 200
      }
    };

    this.config = {
      minInstances: 1,
      maxInstances: os.cpus().length,
      cooldownPeriod: 300000, // 5 minutes between scaling actions
      scaleUpStep: 1,
      scaleDownStep: 1
    };

    this.lastScaleAction = 0;
    this.requestCounts = new Map(); // Track request counts for rate calculation
    this.errorCounts = new Map();   // Track error counts
  }

  async initialize() {
    // Start metrics collection
    this.startMetricsCollection();

    // Initialize cluster if master
    if (cluster.isMaster) {
      logger.info('Initializing scaling manager...');
      
      // Fork initial worker
      this.spawnWorker();

      // Handle worker events
      cluster.on('exit', (worker, code, signal) => {
        logger.warn(`Worker ${worker.id} died. Spawning replacement...`);
        this.spawnWorker();
      });

      // Start auto-scaling checks
      this.startAutoScaling();
    }
  }

  spawnWorker() {
    const worker = cluster.fork();
    
    worker.on('message', (msg) => {
      if (msg.type === 'metrics') {
        this.updateWorkerMetrics(worker.id, msg.data);
      }
    });

    return worker;
  }

  updateWorkerMetrics(workerId, metrics) {
    const now = Date.now();
    
    // Update request counts
    if (metrics.requests) {
      this.requestCounts.set(workerId, {
        count: metrics.requests,
        timestamp: now
      });
    }

    // Update error counts
    if (metrics.errors) {
      this.errorCounts.set(workerId, {
        count: metrics.errors,
        timestamp: now
      });
    }
  }

  async startMetricsCollection() {
    setInterval(async () => {
      try {
        // Collect CPU metrics
        const cpus = os.cpus();
        const cpuUsage = cpus.reduce((acc, cpu) => {
          const total = Object.values(cpu.times).reduce((a, b) => a + b);
          const idle = cpu.times.idle;
          return acc + ((total - idle) / total) * 100;
        }, 0) / cpus.length;

        // Collect memory metrics
        const totalMem = os.totalmem();
        const freeMem = os.freemem();
        const memoryUsage = ((totalMem - freeMem) / totalMem) * 100;

        // Calculate request rate (requests per minute)
        const now = Date.now();
        const requestRate = Array.from(this.requestCounts.values())
          .filter(data => now - data.timestamp < 60000)
          .reduce((acc, data) => acc + data.count, 0);

        // Calculate error rate
        const errorRate = Array.from(this.errorCounts.values())
          .filter(data => now - data.timestamp < 60000)
          .reduce((acc, data) => acc + data.count, 0);

        // Update metrics
        this.metrics = {
          cpuUsage,
          memoryUsage,
          requestRate,
          errorRate,
          activeWorkers: Object.keys(cluster.workers || {}).length
        };

        // Send metrics to master if we're a worker
        if (cluster.isWorker) {
          process.send({
            type: 'metrics',
            data: {
              requests: requestRate,
              errors: errorRate,
              workerId: cluster.worker.id
            }
          });
        }

      } catch (error) {
        logger.error('Error collecting metrics:', error);
        await alertManager.trackError({
          message: `Metrics collection error: ${error.message}`,
          critical: false
        });
      }
    }, 5000); // Collect metrics every 5 seconds
  }

  async startAutoScaling() {
    setInterval(async () => {
      try {
        await this.checkScaling();
      } catch (error) {
        logger.error('Error in auto-scaling check:', error);
        await alertManager.trackError({
          message: `Auto-scaling error: ${error.message}`,
          critical: false
        });
      }
    }, 30000); // Check scaling every 30 seconds
  }

  async checkScaling() {
    const now = Date.now();
    
    // Respect cooldown period
    if (now - this.lastScaleAction < this.config.cooldownPeriod) {
      return;
    }

    const currentWorkers = Object.keys(cluster.workers || {}).length;
    let shouldScale = false;
    let scaleUp = false;

    // Check CPU threshold
    if (this.metrics.cpuUsage > this.thresholds.cpu.scaleUp) {
      shouldScale = true;
      scaleUp = true;
    } else if (this.metrics.cpuUsage < this.thresholds.cpu.scaleDown) {
      shouldScale = true;
      scaleUp = false;
    }

    // Check memory threshold
    if (this.metrics.memoryUsage > this.thresholds.memory.scaleUp) {
      shouldScale = true;
      scaleUp = true;
    } else if (this.metrics.memoryUsage < this.thresholds.memory.scaleDown) {
      shouldScale = true;
      scaleUp = false;
    }

    // Check request rate threshold
    if (this.metrics.requestRate > this.thresholds.requests.scaleUp) {
      shouldScale = true;
      scaleUp = true;
    } else if (this.metrics.requestRate < this.thresholds.requests.scaleDown) {
      shouldScale = true;
      scaleUp = false;
    }

    if (shouldScale) {
      if (scaleUp && currentWorkers < this.config.maxInstances) {
        // Scale up
        const newWorkers = Math.min(
          currentWorkers + this.config.scaleUpStep,
          this.config.maxInstances
        );
        
        logger.info(`Scaling up from ${currentWorkers} to ${newWorkers} workers`);
        
        for (let i = 0; i < newWorkers - currentWorkers; i++) {
          this.spawnWorker();
        }

        await alertManager.sendAlert(
          'Auto-scaling',
          `Scaled up to ${newWorkers} workers due to high load`,
          'info'
        );

      } else if (!scaleUp && currentWorkers > this.config.minInstances) {
        // Scale down
        const newWorkers = Math.max(
          currentWorkers - this.config.scaleDownStep,
          this.config.minInstances
        );
        
        logger.info(`Scaling down from ${currentWorkers} to ${newWorkers} workers`);
        
        // Select workers to terminate
        const workersToTerminate = Object.values(cluster.workers)
          .slice(0, currentWorkers - newWorkers);

        // Gracefully terminate selected workers
        for (const worker of workersToTerminate) {
          worker.send('shutdown');
          setTimeout(() => {
            if (worker.isConnected()) {
              worker.kill();
            }
          }, 5000); // Give worker 5 seconds to clean up
        }

        await alertManager.sendAlert(
          'Auto-scaling',
          `Scaled down to ${newWorkers} workers due to low load`,
          'info'
        );
      }

      this.lastScaleAction = now;
    }
  }

  setThresholds(newThresholds) {
    this.thresholds = {
      ...this.thresholds,
      ...newThresholds
    };
  }

  setConfig(newConfig) {
    this.config = {
      ...this.config,
      ...newConfig
    };
  }

  getMetrics() {
    return {
      ...this.metrics,
      timestamp: Date.now()
    };
  }
}

module.exports = new ScalingManager();
