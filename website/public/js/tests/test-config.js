// Test Configuration Module
class TestConfig {
    constructor() {
        // Default configuration
        this.config = {
            // Security settings
            security: {
                keyRotationInterval: 5000, // ms
                maxHandshakeAttempts: 20,
                nonceLength: 32,
                timestampTolerance: 5000, // ms
                signatureTimeout: 2000, // ms
                minKeyStrength: 256 // bits
            },

            // Performance thresholds
            performance: {
                maxHandshakeLatency: 1000, // ms
                minMessageThroughput: 50, // messages per second
                maxConcurrentHandshakes: 5,
                cryptoOperationTimeout: 1000, // ms
                messageProcessingTimeout: 500 // ms
            },

            // Network simulation
            network: {
                minLatency: 50, // ms
                maxLatency: 200, // ms
                packetLossRate: 0.1, // 10%
                messageReorderingProb: 0.05, // 5%
                connectionDropProb: 0.01 // 1%
            },

            // Test execution
            testing: {
                retryAttempts: 3,
                testTimeout: 5000, // ms
                mockServerResponseDelay: 100, // ms
                cleanupDelay: 1000, // ms
                verbose: true
            },

            // Protocol settings
            protocol: {
                version: '1.0',
                supportedCiphers: ['AES-GCM'],
                supportedKeyExchange: ['ECDH-P256'],
                supportedSignatures: ['ECDSA-P256'],
                maxMessageSize: 1024 * 1024 // 1MB
            }
        };

        // Create proxy for configuration access
        return new Proxy(this, {
            get: (target, prop) => {
                if (prop === 'update') return target.update.bind(target);
                if (prop === 'reset') return target.reset.bind(target);
                if (prop === 'validate') return target.validate.bind(target);
                if (prop === 'getConfig') return target.getConfig.bind(target);
                return target.config[prop];
            }
        });
    }

    // Update configuration with new values
    update(newConfig) {
        try {
            // Deep merge new config with existing config
            this.deepMerge(this.config, newConfig);
            
            // Validate updated configuration
            this.validate();
            
            // Log update if verbose mode is enabled
            if (this.config.testing.verbose) {
                console.log('Test configuration updated:', this.config);
            }

            return true;
        } catch (error) {
            console.error('Failed to update test configuration:', error);
            return false;
        }
    }

    // Reset configuration to defaults
    reset() {
        this.config = new TestConfig().config;
        return true;
    }

    // Validate configuration values
    validate() {
        // Security validations
        if (this.config.security.keyRotationInterval < 1000) {
            throw new Error('Key rotation interval must be at least 1000ms');
        }
        if (this.config.security.maxHandshakeAttempts < 1) {
            throw new Error('Max handshake attempts must be positive');
        }
        if (this.config.security.nonceLength < 16) {
            throw new Error('Nonce length must be at least 16 bytes');
        }

        // Performance validations
        if (this.config.performance.maxHandshakeLatency < 100) {
            throw new Error('Max handshake latency must be at least 100ms');
        }
        if (this.config.performance.minMessageThroughput < 1) {
            throw new Error('Min message throughput must be positive');
        }
        if (this.config.performance.maxConcurrentHandshakes < 1) {
            throw new Error('Max concurrent handshakes must be positive');
        }

        // Network validations
        if (this.config.network.minLatency < 0) {
            throw new Error('Min latency cannot be negative');
        }
        if (this.config.network.maxLatency < this.config.network.minLatency) {
            throw new Error('Max latency must be greater than min latency');
        }
        if (this.config.network.packetLossRate < 0 || this.config.network.packetLossRate > 1) {
            throw new Error('Packet loss rate must be between 0 and 1');
        }

        // Protocol validations
        if (!this.config.protocol.supportedCiphers.length) {
            throw new Error('At least one cipher must be supported');
        }
        if (!this.config.protocol.supportedKeyExchange.length) {
            throw new Error('At least one key exchange method must be supported');
        }

        return true;
    }

    // Get current configuration
    getConfig() {
        return JSON.parse(JSON.stringify(this.config));
    }

    // Utility method for deep merging objects
    deepMerge(target, source) {
        for (const key in source) {
            if (source[key] instanceof Object && !Array.isArray(source[key])) {
                if (!target[key]) Object.assign(target, { [key]: {} });
                this.deepMerge(target[key], source[key]);
            } else {
                Object.assign(target, { [key]: source[key] });
            }
        }
    }
}

// Initialize configuration
window.testConfig = new TestConfig();

// Export configuration panel initialization
window.initTestConfigPanel = () => {
    const configPanel = document.createElement('div');
    configPanel.className = 'config-panel';
    configPanel.innerHTML = `
        <div class="config-header">
            <h2>Test Configuration</h2>
            <div class="config-controls">
                <button id="saveConfig">Save</button>
                <button id="resetConfig">Reset</button>
            </div>
        </div>
        <div class="config-sections">
            <div class="config-section">
                <h3>Security Settings</h3>
                <div class="config-item">
                    <label>Key Rotation Interval (ms)</label>
                    <input type="number" id="keyRotationInterval" 
                           value="${window.testConfig.security.keyRotationInterval}">
                </div>
                <div class="config-item">
                    <label>Max Handshake Attempts</label>
                    <input type="number" id="maxHandshakeAttempts"
                           value="${window.testConfig.security.maxHandshakeAttempts}">
                </div>
                <div class="config-item">
                    <label>Nonce Length</label>
                    <input type="number" id="nonceLength"
                           value="${window.testConfig.security.nonceLength}">
                </div>
            </div>
            <div class="config-section">
                <h3>Performance Thresholds</h3>
                <div class="config-item">
                    <label>Max Handshake Latency (ms)</label>
                    <input type="number" id="maxHandshakeLatency"
                           value="${window.testConfig.performance.maxHandshakeLatency}">
                </div>
                <div class="config-item">
                    <label>Min Message Throughput (msg/s)</label>
                    <input type="number" id="minMessageThroughput"
                           value="${window.testConfig.performance.minMessageThroughput}">
                </div>
                <div class="config-item">
                    <label>Max Concurrent Handshakes</label>
                    <input type="number" id="maxConcurrentHandshakes"
                           value="${window.testConfig.performance.maxConcurrentHandshakes}">
                </div>
            </div>
            <div class="config-section">
                <h3>Network Simulation</h3>
                <div class="config-item">
                    <label>Min Latency (ms)</label>
                    <input type="number" id="minLatency"
                           value="${window.testConfig.network.minLatency}">
                </div>
                <div class="config-item">
                    <label>Max Latency (ms)</label>
                    <input type="number" id="maxLatency"
                           value="${window.testConfig.network.maxLatency}">
                </div>
                <div class="config-item">
                    <label>Packet Loss Rate</label>
                    <input type="number" id="packetLossRate" step="0.01" min="0" max="1"
                           value="${window.testConfig.network.packetLossRate}">
                </div>
            </div>
        </div>
    `;

    // Insert config panel before test controls
    const testControls = document.querySelector('.test-controls');
    testControls.parentNode.insertBefore(configPanel, testControls);

    // Add styles for config panel
    const style = document.createElement('style');
    style.textContent = `
        .config-panel {
            margin-bottom: 20px;
            padding: 15px;
            background: #f8f9fa;
            border-radius: 4px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }

        .config-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
        }

        .config-header h2 {
            margin: 0;
            color: #333;
        }

        .config-controls button {
            margin-left: 10px;
        }

        .config-sections {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
        }

        .config-section {
            padding: 15px;
            background: white;
            border-radius: 4px;
        }

        .config-section h3 {
            margin: 0 0 15px 0;
            color: #444;
        }

        .config-item {
            margin-bottom: 10px;
        }

        .config-item label {
            display: block;
            margin-bottom: 5px;
            color: #666;
        }

        .config-item input {
            width: 100%;
            padding: 8px;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 14px;
        }

        .config-item input:focus {
            outline: none;
            border-color: #2196f3;
        }
    `;
    document.head.appendChild(style);

    // Add event listeners for configuration controls
    document.getElementById('saveConfig').addEventListener('click', () => {
        const newConfig = {
            security: {
                keyRotationInterval: parseInt(document.getElementById('keyRotationInterval').value),
                maxHandshakeAttempts: parseInt(document.getElementById('maxHandshakeAttempts').value),
                nonceLength: parseInt(document.getElementById('nonceLength').value)
            },
            performance: {
                maxHandshakeLatency: parseInt(document.getElementById('maxHandshakeLatency').value),
                minMessageThroughput: parseInt(document.getElementById('minMessageThroughput').value),
                maxConcurrentHandshakes: parseInt(document.getElementById('maxConcurrentHandshakes').value)
            },
            network: {
                minLatency: parseInt(document.getElementById('minLatency').value),
                maxLatency: parseInt(document.getElementById('maxLatency').value),
                packetLossRate: parseFloat(document.getElementById('packetLossRate').value)
            }
        };

        if (window.testConfig.update(newConfig)) {
            alert('Configuration saved successfully');
        } else {
            alert('Failed to save configuration');
        }
    });

    document.getElementById('resetConfig').addEventListener('click', () => {
        if (window.testConfig.reset()) {
            // Update input values
            for (const [section, values] of Object.entries(window.testConfig.getConfig())) {
                if (typeof values === 'object') {
                    for (const [key, value] of Object.entries(values)) {
                        const input = document.getElementById(key);
                        if (input) input.value = value;
                    }
                }
            }
            alert('Configuration reset to defaults');
        } else {
            alert('Failed to reset configuration');
        }
    });
};
