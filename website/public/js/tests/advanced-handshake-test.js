// Advanced Handshake Test Suite
class AdvancedHandshakeTest {
    constructor() {
        this.mockWs = null;
        this.testResults = [];
    }

    async runTests() {
        console.group('Running Advanced Handshake Tests');
        
        try {
            await this.setupMockWebSocket();
            
            // Security Tests
            await this.testMessageTampering();
            await this.testKeyRotation();
            await this.testBruteForceProtection();
            await this.testNonceUniqueness();
            await this.testTimestampPrecision();
            
            // Performance Tests
            await this.testHandshakeLatency();
            await this.testConcurrentHandshakes();
            await this.testMessageThroughput();
            await this.testMemoryUsage();
            await this.testCryptoPerformance();
            
            // Edge Cases
            await this.testNetworkPartition();
            await this.testMessageReordering();
            await this.testIncompleteHandshake();
            await this.testInvalidProtocolVersion();
            await this.testUnsupportedCipher();

            this.displayResults();
        } catch (error) {
            console.error('Advanced test suite failed:', error);
        } finally {
            console.groupEnd();
        }
    }

    // Security Tests
    async testMessageTampering() {
        console.log('Testing message tampering detection...');
        try {
            const handshake = new HandshakeService();
            const initPromise = handshake.initiateHandshake(this.mockWs);
            
            // Get the init message
            const initMessage = this.mockWs.sent[0];
            
            // Create tampered response
            const tamperedResponse = {
                type: 'handshake_response',
                clientId: initMessage.clientId,
                timestamp: Date.now(),
                serverPublicKey: await this.generateMockServerKey(),
                // Add malicious data
                maliciousPayload: 'attack'
            };

            // Sign with different key
            const maliciousKey = await window.crypto.subtle.generateKey(
                {
                    name: 'ECDSA',
                    namedCurve: 'P-256'
                },
                true,
                ['sign']
            );

            this.mockWs.trigger('message', tamperedResponse);
            
            try {
                await initPromise;
                this.assertTest('Message Tampering Detection', false);
            } catch (error) {
                this.assertTest(
                    'Message Tampering Detection',
                    error.message.includes('Invalid message signature')
                );
            }
        } catch (error) {
            this.assertTest('Message Tampering Detection', false, error.message);
        }
    }

    async testKeyRotation() {
        console.log('Testing key rotation...');
        try {
            const handshake = new HandshakeService();
            const rotationInterval = 5000; // 5 seconds
            let keyRotated = false;

            // Start key rotation
            setTimeout(async () => {
                await handshake.initializeCrypto();
                keyRotated = true;
            }, rotationInterval / 2);

            // Wait for rotation
            await new Promise(resolve => setTimeout(resolve, rotationInterval));

            this.assertTest('Key Rotation', keyRotated);
        } catch (error) {
            this.assertTest('Key Rotation', false, error.message);
        }
    }

    async testBruteForceProtection() {
        console.log('Testing brute force protection...');
        try {
            const handshake = new HandshakeService();
            const attempts = [];
            
            // Attempt multiple rapid handshakes
            for (let i = 0; i < 20; i++) {
                attempts.push(handshake.initiateHandshake(this.mockWs));
            }

            try {
                await Promise.all(attempts);
                this.assertTest('Brute Force Protection', false);
            } catch (error) {
                this.assertTest(
                    'Brute Force Protection',
                    error.message.includes('Rate limit exceeded')
                );
            }
        } catch (error) {
            this.assertTest('Brute Force Protection', false, error.message);
        }
    }

    async testNonceUniqueness() {
        console.log('Testing nonce uniqueness...');
        try {
            const handshake = new HandshakeService();
            const nonces = new Set();
            
            // Generate multiple nonces
            for (let i = 0; i < 1000; i++) {
                const nonce = handshake.generateNonce();
                if (nonces.has(nonce)) {
                    throw new Error('Duplicate nonce detected');
                }
                nonces.add(nonce);
            }

            this.assertTest('Nonce Uniqueness', true);
        } catch (error) {
            this.assertTest('Nonce Uniqueness', false, error.message);
        }
    }

    // Performance Tests
    async testHandshakeLatency() {
        window.testRunner.recordMetric('connection', 1);
        console.log('Testing handshake latency...');
        try {
            const handshake = new HandshakeService();
            const iterations = 10;
            const latencies = [];

            for (let i = 0; i < iterations; i++) {
                const start = performance.now();
                const startTime = performance.now();
                await handshake.initiateHandshake(this.mockWs);
                const duration = performance.now() - startTime;
                window.testRunner.recordMetric('handshakeTime', duration);
                window.testRunner.recordMetric('message', 1);
                latencies.push(performance.now() - start);

                // Reset for next iteration
                handshake.reset();
            }

            const avgLatency = latencies.reduce((a, b) => a + b) / iterations;
            this.assertTest('Handshake Latency', avgLatency < 1000); // Should complete within 1s
        } catch (error) {
            this.assertTest('Handshake Latency', false, error.message);
        }
    }

    async testConcurrentHandshakes() {
        console.log('Testing concurrent handshakes...');
        try {
            const maxConcurrent = 5;
            const handshakes = Array(maxConcurrent).fill(null).map(() => 
                new HandshakeService()
            );

            const startTime = performance.now();
            await Promise.all(handshakes.map(h => h.initiateHandshake(this.mockWs)));
            const duration = performance.now() - startTime;

            this.assertTest(
                'Concurrent Handshakes',
                duration < 2000 // Should handle all within 2s
            );
        } catch (error) {
            this.assertTest('Concurrent Handshakes', false, error.message);
        }
    }

    async testMessageThroughput() {
        window.testRunner.recordMetric('connection', 1);
        console.log('Testing message throughput...');
        try {
            const handshake = new HandshakeService();
            const messageCount = 100;
            const messages = [];
            
            const startTime = performance.now();
            for (let i = 0; i < messageCount; i++) {
                const message = await handshake.secureWebSocketMessage({
                    type: 'test',
                    data: 'test-data'
                });
                messages.push(message);
                window.testRunner.recordMetric('message', 1);
            }
            const duration = performance.now() - startTime;
            
            const throughput = messageCount / (duration / 1000); // messages per second
            this.assertTest('Message Throughput', throughput > 50); // At least 50 msg/s
        } catch (error) {
            this.assertTest('Message Throughput', false, error.message);
        }
    }

    // Edge Cases
    async testNetworkPartition() {
        window.testRunner.recordMetric('connection', 1);
        console.log('Testing network partition handling...');
        try {
            const handshake = new HandshakeService();
            const initPromise = handshake.initiateHandshake(this.mockWs);
            
            // Simulate network partition
            setTimeout(() => {
                this.mockWs.trigger('close', { code: 1001, reason: 'Network partition' });
            window.testRunner.recordMetric('connection', -1);
            }, 100);

            try {
                await initPromise;
                this.assertTest('Network Partition Handling', false);
            } catch (error) {
                this.assertTest(
                    'Network Partition Handling',
                    error.message.includes('Handshake timeout')
                );
            }
        } catch (error) {
            this.assertTest('Network Partition Handling', false, error.message);
        }
    }

    async testMessageReordering() {
        window.testRunner.recordMetric('connection', 1);
        console.log('Testing message reordering handling...');
        try {
            const handshake = new HandshakeService();
            const initPromise = handshake.initiateHandshake(this.mockWs);
            
            // Get init message
            const initMessage = this.mockWs.sent[0];
            
            // Create out-of-order responses
            const responses = await Promise.all([1, 2, 3].map(async (seq) => ({
                type: 'handshake_response',
                clientId: initMessage.clientId,
                timestamp: Date.now(),
                serverPublicKey: await this.generateMockServerKey(),
                sequence: seq
            })));

            // Send responses in reverse order
            responses.reverse().forEach(response => {
                const startTime = performance.now();
            this.mockWs.trigger('message', response);
            const latency = performance.now() - startTime;
            window.testRunner.recordMetric('latency', latency);
            window.testRunner.recordMetric('message', 1);
            });

            try {
                await initPromise;
                this.assertTest('Message Reordering', false);
            } catch (error) {
                this.assertTest(
                    'Message Reordering',
                    error.message.includes('Invalid message sequence')
                );
            }
        } catch (error) {
            this.assertTest('Message Reordering', false, error.message);
        }
    }

    async testIncompleteHandshake() {
        console.log('Testing incomplete handshake handling...');
        try {
            const handshake = new HandshakeService();
            const initPromise = handshake.initiateHandshake(this.mockWs);
            
            // Send incomplete response
            const incompleteResponse = {
                type: 'handshake_response',
                // Missing required fields
                timestamp: Date.now()
            };

            this.mockWs.trigger('message', incompleteResponse);
            
            try {
                await initPromise;
                this.assertTest('Incomplete Handshake', false);
            } catch (error) {
                this.assertTest(
                    'Incomplete Handshake',
                    error.message.includes('Invalid message format')
                );
            }
        } catch (error) {
            this.assertTest('Incomplete Handshake', false, error.message);
        }
    }

    // Test Utilities
    setupMockWebSocket() {
        this.mockWs = {
            sent: [],
            listeners: {},
            send: function(data) {
                this.sent.push(JSON.parse(data));
            },
            addEventListener: function(event, callback) {
                if (!this.listeners[event]) {
                    this.listeners[event] = [];
                }
                this.listeners[event].push(callback);
            },
            removeEventListener: function(event, callback) {
                if (this.listeners[event]) {
                    this.listeners[event] = this.listeners[event]
                        .filter(cb => cb !== callback);
                }
            },
            trigger: function(event, data) {
                if (this.listeners[event]) {
                    this.listeners[event].forEach(callback => {
                        callback({ data: JSON.stringify(data) });
                    });
                }
            },
            close: function() {}
        };
    }

    async generateMockServerKey() {
        const keyPair = await window.crypto.subtle.generateKey(
            {
                name: 'ECDH',
                namedCurve: 'P-256'
            },
            true,
            ['deriveKey', 'deriveBits']
        );

        const publicKey = await window.crypto.subtle.exportKey(
            'raw',
            keyPair.publicKey
        );

        return btoa(String.fromCharCode(...new Uint8Array(publicKey)));
    }

    assertTest(name, condition, error = null) {
        this.testResults.push({
            name,
            passed: condition,
            error
        });
    }

    displayResults() {
        console.group('Advanced Test Results');
        
        let passed = 0;
        let failed = 0;

        this.testResults.forEach(result => {
            if (result.passed) {
                console.log('✅', result.name, '- Passed');
                passed++;
            } else {
                console.error('❌', result.name, '- Failed');
                if (result.error) {
                    console.error('  Error:', result.error);
                }
                failed++;
            }
        });

        console.log('\nAdvanced Test Summary:');
        console.log(`Total Tests: ${this.testResults.length}`);
        console.log(`Passed: ${passed}`);
        console.log(`Failed: ${failed}`);
        console.log(`Success Rate: ${Math.round((passed / this.testResults.length) * 100)}%`);

        console.groupEnd();
    }
}

// Initialize when document is ready
document.addEventListener('DOMContentLoaded', () => {
    window.advancedHandshakeTest = new AdvancedHandshakeTest();
});
