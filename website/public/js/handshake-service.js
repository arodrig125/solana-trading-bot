// WebSocket Handshake Service
class HandshakeService {
    constructor() {
        this.handshakeState = null;
        this.serverPublicKey = null;
        this.sharedSecret = null;
        this.handshakeTimeout = 10000; // 10 seconds
        this.retryAttempts = 0;
        this.maxRetries = 3;
    }

    async initiateHandshake(ws) {
        try {
            // Generate ephemeral key pair for handshake
            const clientKeyPair = await window.crypto.subtle.generateKey(
                {
                    name: 'ECDH',
                    namedCurve: 'P-256'
                },
                true,
                ['deriveKey', 'deriveBits']
            );

            // Export public key for sending to server
            const clientPublicKeyRaw = await window.crypto.subtle.exportKey(
                'raw',
                clientKeyPair.publicKey
            );

            // Create handshake init message
            const initMessage = {
                type: 'handshake_init',
                clientPublicKey: this.arrayBufferToBase64(clientPublicKeyRaw),
                timestamp: Date.now(),
                clientId: crypto.randomUUID(),
                supportedProtocols: ['v1'],
                supportedCiphers: ['AES-GCM'],
                supportedKeyExchange: ['ECDH-P256']
            };

            // Store handshake state
            this.handshakeState = {
                clientId: initMessage.clientId,
                keyPair: clientKeyPair,
                timestamp: initMessage.timestamp
            };

            // Send init message
            ws.send(JSON.stringify(initMessage));

            // Wait for server response
            return await this.waitForHandshakeResponse(ws);
        } catch (error) {
            console.error('Handshake initiation failed:', error);
            throw new Error('Failed to initiate handshake');
        }
    }

    async handleHandshakeResponse(ws, response) {
        try {
            if (!this.handshakeState) {
                throw new Error('No active handshake');
            }

            if (response.clientId !== this.handshakeState.clientId) {
                throw new Error('Invalid client ID in handshake response');
            }

            // Verify timestamp to prevent replay attacks
            const responseAge = Date.now() - response.timestamp;
            if (responseAge < 0 || responseAge > this.handshakeTimeout) {
                throw new Error('Invalid handshake timestamp');
            }

            // Import server's public key
            const serverPublicKeyRaw = this.base64ToArrayBuffer(response.serverPublicKey);
            this.serverPublicKey = await window.crypto.subtle.importKey(
                'raw',
                serverPublicKeyRaw,
                {
                    name: 'ECDH',
                    namedCurve: 'P-256'
                },
                true,
                []
            );

            // Derive shared secret
            this.sharedSecret = await window.crypto.subtle.deriveBits(
                {
                    name: 'ECDH',
                    public: this.serverPublicKey
                },
                this.handshakeState.keyPair.privateKey,
                256
            );

            // Generate session key from shared secret
            const sessionKey = await window.crypto.subtle.importKey(
                'raw',
                this.sharedSecret,
                {
                    name: 'HKDF'
                },
                false,
                ['deriveBits', 'deriveKey']
            );

            // Derive final encryption key
            const encryptionKey = await window.crypto.subtle.deriveKey(
                {
                    name: 'HKDF',
                    hash: 'SHA-256',
                    salt: new Uint8Array(16),
                    info: new Uint8Array(0)
                },
                sessionKey,
                {
                    name: 'AES-GCM',
                    length: 256
                },
                true,
                ['encrypt', 'decrypt']
            );

            // Send handshake confirmation
            const confirmationMessage = {
                type: 'handshake_confirm',
                clientId: this.handshakeState.clientId,
                timestamp: Date.now(),
                confirmationHash: await this.generateConfirmationHash(this.sharedSecret)
            };

            ws.send(JSON.stringify(confirmationMessage));

            // Update security service with new session key
            await window.securityService.updateSessionKey(encryptionKey);

            return true;
        } catch (error) {
            console.error('Handshake response handling failed:', error);
            if (this.retryAttempts < this.maxRetries) {
                this.retryAttempts++;
                return await this.initiateHandshake(ws);
            }
            throw new Error('Handshake failed after maximum retries');
        }
    }

    async waitForHandshakeResponse(ws) {
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('Handshake timeout'));
            }, this.handshakeTimeout);

            const handleResponse = async (event) => {
                try {
                    const response = JSON.parse(event.data);
                    if (response.type === 'handshake_response') {
                        ws.removeEventListener('message', handleResponse);
                        clearTimeout(timeout);
                        const success = await this.handleHandshakeResponse(ws, response);
                        resolve(success);
                    }
                } catch (error) {
                    reject(error);
                }
            };

            ws.addEventListener('message', handleResponse);
        });
    }

    async generateConfirmationHash(secret) {
        const encoder = new TextEncoder();
        const data = encoder.encode(
            `${this.handshakeState.clientId}:${this.handshakeState.timestamp}`
        );
        
        const hash = await window.crypto.subtle.digest('SHA-256', 
            new Uint8Array([...new Uint8Array(secret), ...data])
        );

        return this.arrayBufferToBase64(hash);
    }

    // Utility Methods
    arrayBufferToBase64(buffer) {
        const bytes = new Uint8Array(buffer);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
    }

    base64ToArrayBuffer(base64) {
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        return bytes.buffer;
    }

    // Reset handshake state
    reset() {
        this.handshakeState = null;
        this.serverPublicKey = null;
        this.sharedSecret = null;
        this.retryAttempts = 0;
    }
}

// Initialize when document is ready
document.addEventListener('DOMContentLoaded', () => {
    window.handshakeService = new HandshakeService();
});
