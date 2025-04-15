// Test Runner Script
class TestRunner {
    constructor() {
        this.groupDescriptions = {
            'Basic Handshake': 'Tests core handshake functionality including initialization, response handling, confirmation, and key exchange.',
            'Security': 'Validates security features like message tampering detection, key rotation, brute force protection, and replay prevention.',
            'Performance': 'Measures handshake latency, message throughput, and concurrent connection handling capabilities.',
            'Edge Cases': 'Tests system behavior under unusual conditions like network partitions, message reordering, and protocol errors.',
            'Cleanup': 'Ensures proper cleanup of resources and state after test execution.'
        };
        this.testGroups = {
            'Basic Handshake': [],
            'Security': [],
            'Performance': [],
            'Edge Cases': [],
            'Cleanup': []
        };
        this.metrics = {
            handshakeTimes: [],
            messageCount: 0,
            activeConnections: 0,
            errors: 0,
            startTime: 0,
            networkLatencies: []
        };

        // Start metrics update interval
        setInterval(() => this.updateMetrics(), 1000);
        this.startTime = null;
        this.endTime = null;
        this.currentTest = null;
        this.testQueue = [];
        this.results = {
            passed: 0,
            failed: 0,
            total: 0,
            errors: []
        };
    }

    updateMetrics() {
        if (!this.metrics.startTime) return;

        // Update handshake time
        const avgHandshakeTime = this.metrics.handshakeTimes.length ?
            this.metrics.handshakeTimes.reduce((a, b) => a + b) / this.metrics.handshakeTimes.length :
            0;
        document.getElementById('avgHandshakeTime').textContent = 
            `${avgHandshakeTime.toFixed(2)}ms`;

        // Update message throughput
        const elapsedSeconds = (performance.now() - this.metrics.startTime) / 1000;
        const throughput = this.metrics.messageCount / elapsedSeconds;
        document.getElementById('messageThroughput').textContent = 
            `${throughput.toFixed(2)} msg/s`;

        // Update active connections
        document.getElementById('activeConnections').textContent = 
            this.metrics.activeConnections.toString();

        // Update memory usage
        const memory = performance.memory ? 
            (performance.memory.usedJSHeapSize / (1024 * 1024)).toFixed(2) + ' MB' :
            'N/A';
        document.getElementById('memoryUsage').textContent = memory;

        // Update network latency
        const avgLatency = this.metrics.networkLatencies.length ?
            this.metrics.networkLatencies.reduce((a, b) => a + b) / this.metrics.networkLatencies.length :
            0;
        document.getElementById('networkLatency').textContent = 
            `${avgLatency.toFixed(2)}ms`;

        // Update error rate
        const errorRate = (this.metrics.errors / this.results.total * 100) || 0;
        document.getElementById('errorRate').textContent = 
            `${errorRate.toFixed(1)}%`;
    }

    async runTestGroup(groupName) {
        console.group(`Running Test Group: ${groupName}`);
        this.startTime = performance.now();
        this.metrics.startTime = this.startTime;
        
        try {
            await this.setupTestEnvironment();
            
            // Clear previous results for this group
            this.testQueue = this.testGroups[groupName] || [];
            this.results = {
                passed: 0,
                failed: 0,
                total: this.testQueue.length,
                errors: []
            };

            // Clear UI
            document.getElementById('testResults').innerHTML = '';
            document.getElementById('testLog').innerHTML = '';
            document.getElementById('progressFill').style.width = '0%';

            // Run tests
            await this.processTestQueue();

        } catch (error) {
            console.error('Test group failed:', error);
            this.results.errors.push({
                phase: 'Test Group',
                error: error.message
            });
        } finally {
            this.endTime = performance.now();
            this.printResults();
            console.groupEnd();
        }
    }

    async runAllTests() {
        this.startTime = performance.now();
        this.metrics.startTime = this.startTime;
        console.group('Starting Test Suite');
        console.log('Initializing test environment...');

        try {
            // Initialize test environment
            await this.setupTestEnvironment();

            // Queue all tests
            this.queueTests();

            // Run tests sequentially
            await this.processTestQueue();

        } catch (error) {
            console.error('Test suite failed:', error);
            this.results.errors.push({
                phase: 'Test Suite',
                error: error.message
            });
        } finally {
            this.endTime = performance.now();
            this.printResults();
            console.groupEnd();
        }
    }

    async setupTestEnvironment() {
        // Initialize services
        window.securityService = new SecurityService();
        window.handshakeService = new HandshakeService();
        window.handshakeTest = new HandshakeTest();

        // Wait for crypto initialization
        await new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('Crypto initialization timeout'));
            }, 5000);

            const checkInit = () => {
                if (window.securityService.keyPair && window.securityService.sessionKey) {
                    clearTimeout(timeout);
                    resolve();
                } else {
                    setTimeout(checkInit, 100);
                }
            };
            checkInit();
        });

        console.log('Test environment ready');
    }

    queueTests() {
        // Basic handshake tests
        this.addTestGroup('Basic Handshake Tests', () => {
            this.addTest('Handshake Initialization', () => 
                window.handshakeTest.testHandshakeInitiation());
            
            this.addTest('Handshake Response', () => 
                window.handshakeTest.testHandshakeResponse());
            
            this.addTest('Handshake Confirmation', () => 
                window.handshakeTest.testHandshakeConfirmation());
            
            this.addTest('Key Exchange', () => 
                window.handshakeTest.testKeyExchange());
        });

        // Security tests
        this.addTestGroup('Security Tests', () => {
            this.addTest('Message Tampering Detection', () =>
                window.advancedHandshakeTest.testMessageTampering());
            
            this.addTest('Key Rotation', () =>
                window.advancedHandshakeTest.testKeyRotation());
            
            this.addTest('Brute Force Protection', () =>
                window.advancedHandshakeTest.testBruteForceProtection());
            
            this.addTest('Nonce Uniqueness', () =>
                window.advancedHandshakeTest.testNonceUniqueness());
            
            this.addTest('Replay Protection', () => 
                window.handshakeTest.testReplayProtection());
        });

        // Performance tests
        this.addTestGroup('Performance Tests', () => {
            this.addTest('Handshake Latency', () =>
                window.advancedHandshakeTest.testHandshakeLatency());
            
            this.addTest('Concurrent Handshakes', () =>
                window.advancedHandshakeTest.testConcurrentHandshakes());
            
            this.addTest('Message Throughput', () =>
                window.advancedHandshakeTest.testMessageThroughput());
        });

        // Edge cases
        this.addTestGroup('Edge Cases', () => {
            this.addTest('Network Partition', () =>
                window.advancedHandshakeTest.testNetworkPartition());
            
            this.addTest('Message Reordering', () =>
                window.advancedHandshakeTest.testMessageReordering());
            
            this.addTest('Incomplete Handshake', () =>
                window.advancedHandshakeTest.testIncompleteHandshake());
            
            this.addTest('Protocol Negotiation', () => 
                window.handshakeTest.testProtocolNegotiation());
            
            this.addTest('Error Handling', () => 
                window.handshakeTest.testErrorHandling());
        });

        // Cleanup tests
        this.addTestGroup('Cleanup Tests', () => {
            this.addTest('State Cleanup', () => 
                window.handshakeTest.testStateCleanup());
        });
        // Core handshake tests
        this.addTest('Handshake Initialization', () => 
            window.handshakeTest.testHandshakeInitiation());
        
        this.addTest('Handshake Response', () => 
            window.handshakeTest.testHandshakeResponse());
        
        this.addTest('Handshake Confirmation', () => 
            window.handshakeTest.testHandshakeConfirmation());
        
        this.addTest('Key Exchange', () => 
            window.handshakeTest.testKeyExchange());

        // Security tests
        this.addTest('Replay Protection', () => 
            window.handshakeTest.testReplayProtection());
        
        this.addTest('Timeout Handling', () => 
            window.handshakeTest.testTimeoutHandling());
        
        this.addTest('Retry Mechanism', () => 
            window.handshakeTest.testRetryMechanism());

        // Protocol tests
        this.addTest('Protocol Negotiation', () => 
            window.handshakeTest.testProtocolNegotiation());
        
        this.addTest('Error Handling', () => 
            window.handshakeTest.testErrorHandling());
        
        this.addTest('State Cleanup', () => 
            window.handshakeTest.testStateCleanup());
    }

    addTestGroup(groupName, groupFn) {
        if (!this.testGroups[groupName]) {
            this.testGroups[groupName] = [];
        }
        console.group(`Test Group: ${groupName}`);
        groupFn();
        console.groupEnd();
    }

    addTest(name, testFn) {
        // Add to current group if in a group context
        const currentGroup = Object.keys(this.testGroups).find(group => 
            console.group.toString().includes(`Test Group: ${group}`)
        );
        
        if (currentGroup) {
            this.testGroups[currentGroup].push({ name, fn: testFn });
        }
        this.testQueue.push({
            name,
            fn: testFn
        });
        this.results.total++;
    }

    recordMetric(type, value) {
        switch (type) {
            case 'handshakeTime':
                this.metrics.handshakeTimes.push(value);
                break;
            case 'message':
                this.metrics.messageCount++;
                break;
            case 'connection':
                this.metrics.activeConnections += value; // +1 or -1
                break;
            case 'error':
                this.metrics.errors++;
                break;
            case 'latency':
                this.metrics.networkLatencies.push(value);
                break;
        }
    }

    async processTestQueue() {
        for (const test of this.testQueue) {
            this.currentTest = test.name;
            console.group(`Running test: ${test.name}`);
            
            try {
                await test.fn();
                console.log(`✅ ${test.name} passed`);
                this.results.passed++;
                this.updateUI('passed', test.name);
            } catch (error) {
                console.error(`❌ ${test.name} failed:`, error);
                this.recordMetric('error', 1);
                this.results.failed++;
                this.results.errors.push({
                    test: test.name,
                    error: error.message
                });
                this.updateUI('failed', test.name, error.message);
            }

            console.groupEnd();
        }
    }

    updateUI(status, testName, error = null) {
        const resultDiv = document.createElement('div');
        resultDiv.className = `test-case ${status}`;
        
        const nameDiv = document.createElement('div');
        nameDiv.className = 'test-name';
        nameDiv.textContent = testName;
        resultDiv.appendChild(nameDiv);

        if (error) {
            const errorDiv = document.createElement('div');
            errorDiv.className = 'test-error';
            errorDiv.textContent = error;
            resultDiv.appendChild(errorDiv);
        }

        document.getElementById('testResults').appendChild(resultDiv);

        // Update progress
        const progress = (this.results.passed + this.results.failed) / this.results.total * 100;
        document.getElementById('progressFill').style.width = `${progress}%`;

        // Update summary
        document.getElementById('totalTests').textContent = this.results.total;
        document.getElementById('passedTests').textContent = this.results.passed;
        document.getElementById('failedTests').textContent = this.results.failed;
        document.getElementById('successRate').textContent = 
            `${Math.round((this.results.passed / this.results.total) * 100)}%`;
    }

    printResults() {
        const duration = ((this.endTime - this.startTime) / 1000).toFixed(2);
        
        console.group('Test Results Summary');
        console.log(`Total Tests: ${this.results.total}`);
        console.log(`Passed: ${this.results.passed}`);
        console.log(`Failed: ${this.results.failed}`);
        console.log(`Success Rate: ${Math.round((this.results.passed / this.results.total) * 100)}%`);
        console.log(`Duration: ${duration}s`);

        if (this.results.errors.length > 0) {
            console.group('Errors');
            this.results.errors.forEach(error => {
                console.error(`${error.test || error.phase}:`, error.error);
            });
            console.groupEnd();
        }

        console.groupEnd();
    }
}

// Initialize when document is ready
document.addEventListener('DOMContentLoaded', () => {
    // Initialize test config panel
    window.initTestConfigPanel();

    // Initialize connection monitor
    window.connectionMonitor.initialize();

    // Initialize test group descriptions
    const groupSelect = document.getElementById('testGroup');
    const groupDescription = document.getElementById('groupDescription');

    groupSelect.addEventListener('change', (event) => {
        const selectedGroup = event.target.value;
        if (selectedGroup === 'all') {
            groupDescription.textContent = 'Run all test groups sequentially';
        } else {
            groupDescription.textContent = window.testRunner.groupDescriptions[selectedGroup] || 
                'Select a test group to see its description';
        }
    });

    // Initialize run button handler
    // Initialize test runner
    window.testRunner = new TestRunner();
    
    // Add run button event listener
    document.getElementById('runTests').addEventListener('click', async () => {
        const selectedGroup = groupSelect.value;
        const runButton = document.getElementById('runTests');
        
        // Clear previous results
        document.getElementById('testResults').innerHTML = '';
        document.getElementById('testLog').innerHTML = '';
        document.getElementById('progressFill').style.width = '0%';
        
        // Disable run button during test execution
        runButton.disabled = true;
        runButton.textContent = 'Running Tests...';

        try {
            if (selectedGroup === 'all') {
                await window.testRunner.runAllTests();
            } else {
                await window.testRunner.runTestGroup(selectedGroup);
            }
        } finally {
            runButton.disabled = false;
            runButton.textContent = 'Run Tests';
        }
    });
});
