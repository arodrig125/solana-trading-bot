// Handshake Protocol Test Suite
class HandshakeTest {
    constructor() {
        this.testResults = [];
        this.mockWs = null;
        this.testTimeout = 5000; // 5 seconds
    }

    async runTests() {
        console.group('Running Handshake Protocol Tests');
        
        try {
            await this.setupMockWebSocket();
            
            // Run test cases
            await this.testHandshakeInitiation();
            await this.testHandshakeResponse();
            await this.testHandshakeConfirmation();
            await this.testKeyExchange();
            await this.testReplayProtection();
            await this.testTimeoutHandling();
            await this.testRetryMechanism();
            await this.testProtocolNegotiation();
            await this.testErrorHandling();
            await this.testStateCleanup();

            this.displayResults();
        } catch (error) {
            console.error('Test suite failed:', error);
        } finally {
            console.groupEnd();
        }
    }

    // Test Setup
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

    // Test Cases
    async testHandshakeInitiation() {
        console.log('Testing handshake initiation...');
        try {
            const handshake = new HandshakeService();
            await handshake.initiateHandshake(this.mockWs);

            const initMessage = this.mockWs.sent[0];
            this.assertTest(
                'Handshake Initiation',
                initMessage.type === 'handshake_init' &&
                initMessage.clientPublicKey &&
                initMessage.timestamp &&
                initMessage.clientId &&
                Array.isArray(initMessage.supportedProtocols) &&
                Array.isArray(initMessage.supportedCiphers)
            );
        } catch (error) {
            this.assertTest('Handshake Initiation', false, error.message);
        }
    }

    async testHandshakeResponse() {
        console.log('Testing handshake response handling...');
        try {
            const handshake = new HandshakeService();
            const initPromise = handshake.initiateHandshake(this.mockWs);
            
            // Get the init message
            const initMessage = this.mockWs.sent[this.mockWs.sent.length - 1];
            
            // Simulate server response
            const mockResponse = {
                type: 'handshake_response',
                clientId: initMessage.clientId,
                timestamp: Date.now(),
                serverPublicKey: await this.generateMockServerKey(),
                selectedProtocol: 'v1',
                selectedCipher: 'AES-GCM'
            };

            // Trigger the response
            this.mockWs.trigger('message', mockResponse);
            
            const result = await initPromise;
            this.assertTest('Handshake Response', result === true);
        } catch (error) {
            this.assertTest('Handshake Response', false, error.message);
        }
    }

    async testHandshakeConfirmation() {
        console.log('Testing handshake confirmation...');
        try {
            const handshake = new HandshakeService();
            const initPromise = handshake.initiateHandshake(this.mockWs);
            
            // Simulate successful handshake response
            const mockResponse = {
                type: 'handshake_response',
                clientId: this.mockWs.sent[0].clientId,
                timestamp: Date.now(),
                serverPublicKey: await this.generateMockServerKey()
            };

            this.mockWs.trigger('message', mockResponse);
            await initPromise;

            // Check confirmation message
            const confirmMessage = this.mockWs.sent[this.mockWs.sent.length - 1];
            this.assertTest(
                'Handshake Confirmation',
                confirmMessage.type === 'handshake_confirm' &&
                confirmMessage.clientId &&
                confirmMessage.confirmationHash
            );
        } catch (error) {
            this.assertTest('Handshake Confirmation', false, error.message);
        }
    }

    async testKeyExchange() {
        console.log('Testing key exchange...');
        try {
            const handshake = new HandshakeService();
            const initPromise = handshake.initiateHandshake(this.mockWs);
            
            // Simulate successful handshake
            const mockResponse = {
                type: 'handshake_response',
                clientId: this.mockWs.sent[0].clientId,
                timestamp: Date.now(),
                serverPublicKey: await this.generateMockServerKey()
            };

            this.mockWs.trigger('message', mockResponse);
            await initPromise;

            this.assertTest(
                'Key Exchange',
                handshake.sharedSecret !== null &&
                handshake.serverPublicKey !== null
            );
        } catch (error) {
            this.assertTest('Key Exchange', false, error.message);
        }
    }

    async testReplayProtection() {
        console.log('Testing replay protection...');
        try {
            const handshake = new HandshakeService();
            const initPromise = handshake.initiateHandshake(this.mockWs);
            
            // Get initial response
            const mockResponse = {
                type: 'handshake_response',
                clientId: this.mockWs.sent[0].clientId,
                timestamp: Date.now() - 60000, // 1 minute old
                serverPublicKey: await this.generateMockServerKey()
            };

            // Attempt replay attack
            this.mockWs.trigger('message', mockResponse);
            
            try {
                await initPromise;
                this.assertTest('Replay Protection', false);
            } catch (error) {
                this.assertTest(
                    'Replay Protection',
                    error.message.includes('Invalid handshake timestamp')
                );
            }
        } catch (error) {
            this.assertTest('Replay Protection', false, error.message);
        }
    }

    async testTimeoutHandling() {
        console.log('Testing timeout handling...');
        try {
            const handshake = new HandshakeService();
            const timeoutPromise = handshake.initiateHandshake(this.mockWs);
            
            try {
                await timeoutPromise;
                this.assertTest('Timeout Handling', false);
            } catch (error) {
                this.assertTest(
                    'Timeout Handling',
                    error.message.includes('Handshake timeout')
                );
            }
        } catch (error) {
            this.assertTest('Timeout Handling', false, error.message);
        }
    }

    async testRetryMechanism() {
        console.log('Testing retry mechanism...');
        try {
            const handshake = new HandshakeService();
            const retryPromise = handshake.initiateHandshake(this.mockWs);
            
            // Simulate failed attempts
            for (let i = 0; i < handshake.maxRetries; i++) {
                this.mockWs.trigger('message', { type: 'error' });
            }

            try {
                await retryPromise;
                this.assertTest('Retry Mechanism', false);
            } catch (error) {
                this.assertTest(
                    'Retry Mechanism',
                    error.message.includes('maximum retries')
                );
            }
        } catch (error) {
            this.assertTest('Retry Mechanism', false, error.message);
        }
    }

    async testProtocolNegotiation() {
        console.log('Testing protocol negotiation...');
        try {
            const handshake = new HandshakeService();
            const initPromise = handshake.initiateHandshake(this.mockWs);
            
            const initMessage = this.mockWs.sent[0];
            const mockResponse = {
                type: 'handshake_response',
                clientId: initMessage.clientId,
                timestamp: Date.now(),
                serverPublicKey: await this.generateMockServerKey(),
                selectedProtocol: initMessage.supportedProtocols[0],
                selectedCipher: initMessage.supportedCiphers[0]
            };

            this.mockWs.trigger('message', mockResponse);
            await initPromise;

            this.assertTest(
                'Protocol Negotiation',
                mockResponse.selectedProtocol === 'v1' &&
                mockResponse.selectedCipher === 'AES-GCM'
            );
        } catch (error) {
            this.assertTest('Protocol Negotiation', false, error.message);
        }
    }

    async testErrorHandling() {
        console.log('Testing error handling...');
        try {
            const handshake = new HandshakeService();
            const errorPromise = handshake.initiateHandshake(this.mockWs);
            
            // Simulate invalid response
            const invalidResponse = {
                type: 'handshake_response',
                clientId: 'invalid-id',
                timestamp: Date.now(),
                serverPublicKey: 'invalid-key'
            };

            this.mockWs.trigger('message', invalidResponse);
            
            try {
                await errorPromise;
                this.assertTest('Error Handling', false);
            } catch (error) {
                this.assertTest(
                    'Error Handling',
                    error.message.includes('Invalid client ID')
                );
            }
        } catch (error) {
            this.assertTest('Error Handling', false, error.message);
        }
    }

    async testStateCleanup() {
        console.log('Testing state cleanup...');
        try {
            const handshake = new HandshakeService();
            await handshake.initiateHandshake(this.mockWs);
            
            handshake.reset();
            
            this.assertTest(
                'State Cleanup',
                handshake.handshakeState === null &&
                handshake.serverPublicKey === null &&
                handshake.sharedSecret === null &&
                handshake.retryAttempts === 0
            );
        } catch (error) {
            this.assertTest('State Cleanup', false, error.message);
        }
    }

    // Test Utilities
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
        console.group('Test Results');
        
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

        console.log('\nSummary:');
        console.log(`Total Tests: ${this.testResults.length}`);
        console.log(`Passed: ${passed}`);
        console.log(`Failed: ${failed}`);
        console.log(`Success Rate: ${Math.round((passed / this.testResults.length) * 100)}%`);

        console.groupEnd();
    }
}
