// Performance Test Configuration
class PerformanceConfig {
    constructor() {
        this.config = {
            // Handshake settings
            handshake: {
                maxLatency: 500, // ms
                concurrentLimit: 10,
                retryDelay: 100, // ms
                timeout: 2000, // ms
                warmupPeriod: 1000, // ms
                cooldownPeriod: 1000 // ms
            },

            // Message processing
            messaging: {
                batchSize: 50, // messages per batch
                targetThroughput: 200, // messages per second
                processingTimeout: 300, // ms
                maxQueueSize: 1000,
                samplingInterval: 100 // ms
            },

            // Resource limits
            resources: {
                maxMemoryUsage: 512 * 1024 * 1024, // 512MB
                maxCPUUsage: 80, // percentage
                gcThreshold: 100 * 1024 * 1024, // 100MB
                maxConnections: 100
            },

            // Network simulation
            network: {
                minLatency: 20, // ms
                maxLatency: 100, // ms
                jitter: 10, // ms
                packetLoss: 0.01, // 1%
                bandwidth: 10 * 1024 * 1024 // 10 MB/s
            },

            // Test execution
            testing: {
                duration: 5000, // ms
                iterations: 1000,
                parallel: 5,
                reportInterval: 1000 // ms
            },

            // Metrics collection
            metrics: {
                enabled: true,
                detailed: true,
                sampleRate: 10, // Hz
                bufferSize: 1000,
                exportInterval: 1000 // ms
            }
        };
    }

    // Update configuration
    update(newConfig) {
        Object.assign(this.config, newConfig);
    }

    // Get optimized config based on system resources
    async getOptimizedConfig() {
        const memory = performance.memory ? performance.memory.jsHeapSizeLimit : 2048 * 1024 * 1024;
        const cores = navigator.hardwareConcurrency || 4;

        return {
            ...this.config,
            resources: {
                ...this.config.resources,
                maxMemoryUsage: Math.min(memory * 0.8, this.config.resources.maxMemoryUsage),
                maxConnections: cores * 25
            },
            testing: {
                ...this.config.testing,
                parallel: Math.max(1, Math.min(cores - 1, this.config.testing.parallel))
            }
        };
    }

    // Validate configuration
    validate() {
        const config = this.config;

        // Handshake validation
        if (config.handshake.maxLatency < 100) {
            throw new Error('Handshake latency threshold too aggressive');
        }
        if (config.handshake.concurrentLimit < 1) {
            throw new Error('Must allow at least one concurrent handshake');
        }

        // Messaging validation
        if (config.messaging.targetThroughput < 1) {
            throw new Error('Target throughput must be positive');
        }
        if (config.messaging.batchSize > config.messaging.maxQueueSize) {
            throw new Error('Batch size cannot exceed queue size');
        }

        // Resource validation
        if (config.resources.maxMemoryUsage < 64 * 1024 * 1024) {
            throw new Error('Minimum 64MB memory required');
        }
        if (config.resources.maxCPUUsage > 95) {
            throw new Error('CPU usage cannot exceed 95%');
        }

        // Network validation
        if (config.network.minLatency > config.network.maxLatency) {
            throw new Error('Min latency cannot exceed max latency');
        }
        if (config.network.packetLoss < 0 || config.network.packetLoss > 1) {
            throw new Error('Packet loss must be between 0 and 1');
        }

        return true;
    }

    // Get performance requirements
    getRequirements() {
        return {
            memory: this.config.resources.maxMemoryUsage,
            cpu: this.config.resources.maxCPUUsage,
            network: this.config.network.bandwidth,
            connections: this.config.resources.maxConnections
        };
    }
}

// Initialize performance configuration
window.performanceConfig = new PerformanceConfig();
