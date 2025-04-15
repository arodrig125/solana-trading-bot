class APIClient {
    constructor() {
        this.baseUrl = '';
        this.apiKey = '';
        this.token = null;
        this.endpoints = {
            auth: '/api/auth',
            wallet: '/api/wallet',
            trading: '/api/trading',
            metrics: '/api/metrics'
        };
    }

    initialize() {
        this.createAPIPanel();
        this.loadSavedConfig();
    }

    createAPIPanel() {
        const panel = document.createElement('div');
        panel.className = 'api-client';
        panel.innerHTML = `
            <div class="api-header">
                <h3>API Integration</h3>
                <div class="api-status">
                    <span class="status-indicator"></span>
                    <span id="apiStatus">Not Connected</span>
                </div>
            </div>
            <div class="api-config">
                <div class="config-group">
                    <label>API Endpoint</label>
                    <div class="input-group">
                        <input type="text" id="apiEndpoint" placeholder="https://api.example.com">
                        <button id="testConnection" class="secondary">Test</button>
                    </div>
                </div>
                <div class="config-group">
                    <label>API Key</label>
                    <div class="input-group">
                        <input type="password" id="apiKey" placeholder="Enter your API key">
                        <button id="saveConfig" class="primary">Save</button>
                    </div>
                </div>
            </div>
            <div class="api-test-panel">
                <h4>API Test Panel</h4>
                <div class="test-groups">
                    <div class="test-group">
                        <h5>Authentication</h5>
                        <button id="testAuth" class="secondary" disabled>Test Auth</button>
                    </div>
                    <div class="test-group">
                        <h5>Wallet Management</h5>
                        <button id="testWalletBalance" class="secondary" disabled>Check Balance</button>
                        <button id="testWalletHistory" class="secondary" disabled>Transaction History</button>
                    </div>
                    <div class="test-group">
                        <h5>Trading Operations</h5>
                        <button id="testMarketData" class="secondary" disabled>Market Data</button>
                        <button id="testSimulatedTrade" class="secondary" disabled>Simulated Trade</button>
                    </div>
                </div>
                <div id="apiTestResults" class="test-results"></div>
            </div>
        `;

        // Add styles
        const style = document.createElement('style');
        style.textContent = `
            .api-client {
                background: #f8f9fa;
                border-radius: 4px;
                padding: 15px;
                margin: 15px 0;
                box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            }

            .api-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 15px;
            }

            .api-header h3 {
                margin: 0;
                color: #333;
            }

            .api-status {
                display: flex;
                align-items: center;
                gap: 8px;
            }

            .status-indicator {
                width: 10px;
                height: 10px;
                border-radius: 50%;
                background: #dc3545;
            }

            .status-indicator.connected {
                background: #28a745;
            }

            .api-config {
                background: white;
                padding: 15px;
                border-radius: 4px;
                margin-bottom: 15px;
            }

            .config-group {
                margin-bottom: 15px;
            }

            .config-group:last-child {
                margin-bottom: 0;
            }

            .config-group label {
                display: block;
                margin-bottom: 5px;
                color: #666;
                font-size: 14px;
            }

            .input-group {
                display: flex;
                gap: 10px;
            }

            .input-group input {
                flex: 1;
                padding: 8px;
                border: 1px solid #ddd;
                border-radius: 4px;
                font-size: 14px;
            }

            .api-test-panel {
                background: white;
                padding: 15px;
                border-radius: 4px;
            }

            .api-test-panel h4 {
                margin: 0 0 15px 0;
                color: #333;
            }

            .test-groups {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 20px;
                margin-bottom: 15px;
            }

            .test-group {
                padding: 15px;
                background: #f8f9fa;
                border-radius: 4px;
            }

            .test-group h5 {
                margin: 0 0 10px 0;
                color: #444;
            }

            .test-group button {
                display: block;
                width: 100%;
                margin-bottom: 8px;
            }

            .test-group button:last-child {
                margin-bottom: 0;
            }

            .test-results {
                margin-top: 15px;
                padding: 15px;
                background: #f8f9fa;
                border-radius: 4px;
                max-height: 300px;
                overflow-y: auto;
            }

            .test-result {
                padding: 10px;
                margin-bottom: 10px;
                border-radius: 4px;
                font-family: monospace;
                font-size: 14px;
            }

            .test-result:last-child {
                margin-bottom: 0;
            }

            .test-result.success {
                background: #d4edda;
                color: #155724;
            }

            .test-result.error {
                background: #f8d7da;
                color: #721c24;
            }

            .test-result.info {
                background: #cce5ff;
                color: #004085;
            }
        `;
        document.head.appendChild(style);

        // Insert panel before test controls
        const testControls = document.querySelector('.test-controls');
        testControls.parentNode.insertBefore(panel, testControls);

        this.attachEventListeners();
    }

    attachEventListeners() {
        // Save configuration
        document.getElementById('saveConfig').addEventListener('click', () => {
            this.saveConfig();
        });

        // Test connection
        document.getElementById('testConnection').addEventListener('click', () => {
            this.testConnection();
        });

        // API test buttons
        document.getElementById('testAuth').addEventListener('click', () => {
            this.testAuthentication();
        });

        document.getElementById('testWalletBalance').addEventListener('click', () => {
            this.testWalletBalance();
        });

        document.getElementById('testWalletHistory').addEventListener('click', () => {
            this.testWalletHistory();
        });

        document.getElementById('testMarketData').addEventListener('click', () => {
            this.testMarketData();
        });

        document.getElementById('testSimulatedTrade').addEventListener('click', () => {
            this.testSimulatedTrade();
        });
    }

    async saveConfig() {
        const endpoint = document.getElementById('apiEndpoint').value;
        const apiKey = document.getElementById('apiKey').value;

        if (!endpoint || !apiKey) {
            this.addTestResult('Please provide both API endpoint and API key', 'error');
            return;
        }

        this.baseUrl = endpoint;
        this.apiKey = apiKey;

        try {
            localStorage.setItem('apiConfig', JSON.stringify({
                endpoint,
                apiKey
            }));

            this.addTestResult('Configuration saved successfully', 'success');
            this.enableTestButtons();
        } catch (error) {
            this.addTestResult('Failed to save configuration: ' + error.message, 'error');
        }
    }

    loadSavedConfig() {
        try {
            const config = JSON.parse(localStorage.getItem('apiConfig'));
            if (config) {
                document.getElementById('apiEndpoint').value = config.endpoint;
                document.getElementById('apiKey').value = config.apiKey;
                this.baseUrl = config.endpoint;
                this.apiKey = config.apiKey;
                this.enableTestButtons();
            }
        } catch (error) {
            console.error('Failed to load API configuration:', error);
        }
    }

    enableTestButtons() {
        const buttons = [
            'testAuth',
            'testWalletBalance',
            'testWalletHistory',
            'testMarketData',
            'testSimulatedTrade'
        ];

        buttons.forEach(id => {
            document.getElementById(id).disabled = false;
        });
    }

    async testConnection() {
        const endpoint = document.getElementById('apiEndpoint').value;
        if (!endpoint) {
            this.addTestResult('Please provide an API endpoint', 'error');
            return;
        }

        try {
            const response = await fetch(endpoint + '/health');
            if (response.ok) {
                this.updateConnectionStatus(true);
                this.addTestResult('Connection successful', 'success');
            } else {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
        } catch (error) {
            this.updateConnectionStatus(false);
            this.addTestResult('Connection failed: ' + error.message, 'error');
        }
    }

    updateConnectionStatus(connected) {
        const indicator = document.querySelector('.status-indicator');
        const status = document.getElementById('apiStatus');

        if (connected) {
            indicator.classList.add('connected');
            status.textContent = 'Connected';
        } else {
            indicator.classList.remove('connected');
            status.textContent = 'Not Connected';
        }
    }

    async testAuthentication() {
        try {
            const response = await this.authenticatedRequest(this.endpoints.auth, {
                method: 'POST',
                body: JSON.stringify({
                    apiKey: this.apiKey
                })
            });

            if (response.ok) {
                const data = await response.json();
                this.token = data.token;
                this.addTestResult('Authentication successful', 'success');
            } else {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
        } catch (error) {
            this.addTestResult('Authentication failed: ' + error.message, 'error');
        }
    }

    async testWalletBalance() {
        try {
            const response = await this.authenticatedRequest(this.endpoints.wallet + '/balance');
            if (response.ok) {
                const data = await response.json();
                this.addTestResult('Wallet Balance:', 'info');
                this.addTestResult(JSON.stringify(data, null, 2), 'success');
            } else {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
        } catch (error) {
            this.addTestResult('Failed to get wallet balance: ' + error.message, 'error');
        }
    }

    async testWalletHistory() {
        try {
            const response = await this.authenticatedRequest(this.endpoints.wallet + '/history');
            if (response.ok) {
                const data = await response.json();
                this.addTestResult('Transaction History:', 'info');
                this.addTestResult(JSON.stringify(data, null, 2), 'success');
            } else {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
        } catch (error) {
            this.addTestResult('Failed to get transaction history: ' + error.message, 'error');
        }
    }

    async testMarketData() {
        try {
            const response = await this.authenticatedRequest(this.endpoints.trading + '/market-data');
            if (response.ok) {
                const data = await response.json();
                this.addTestResult('Market Data:', 'info');
                this.addTestResult(JSON.stringify(data, null, 2), 'success');
            } else {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
        } catch (error) {
            this.addTestResult('Failed to get market data: ' + error.message, 'error');
        }
    }

    async testSimulatedTrade() {
        try {
            const response = await this.authenticatedRequest(this.endpoints.trading + '/simulate', {
                method: 'POST',
                body: JSON.stringify({
                    symbol: 'SOL/USD',
                    side: 'buy',
                    amount: 1,
                    price: 100
                })
            });

            if (response.ok) {
                const data = await response.json();
                this.addTestResult('Simulated Trade Result:', 'info');
                this.addTestResult(JSON.stringify(data, null, 2), 'success');
            } else {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
        } catch (error) {
            this.addTestResult('Failed to simulate trade: ' + error.message, 'error');
        }
    }

    async authenticatedRequest(endpoint, options = {}) {
        const headers = {
            'Content-Type': 'application/json',
            'X-API-Key': this.apiKey
        };

        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        return fetch(this.baseUrl + endpoint, {
            ...options,
            headers: {
                ...headers,
                ...(options.headers || {})
            }
        });
    }

    addTestResult(message, type = 'info') {
        const container = document.getElementById('apiTestResults');
        const result = document.createElement('div');
        result.className = `test-result ${type}`;
        result.textContent = message;
        container.appendChild(result);
        container.scrollTop = container.scrollHeight;
    }
}

// Initialize when document is ready
window.apiClient = new APIClient();
