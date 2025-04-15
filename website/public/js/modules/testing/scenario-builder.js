class ScenarioBuilder {
    constructor() {
        this.scenarios = new Map();
        this.currentScenario = null;
    }

    initialize() {
        this.createScenarioPanel();
        this.loadSavedScenarios();
    }

    createScenarioPanel() {
        const panel = document.createElement('div');
        panel.className = 'scenario-builder';
        panel.innerHTML = `
            <div class="scenario-header">
                <h3>Test Scenario Builder</h3>
                <div class="scenario-controls">
                    <button id="newScenario" class="secondary">New Scenario</button>
                    <button id="saveScenario" class="primary" disabled>Save Scenario</button>
                    <button id="exportScenarios" class="secondary">Export</button>
                    <button id="importScenarios" class="secondary">Import</button>
                </div>
            </div>
            <div class="scenario-editor" style="display: none;">
                <div class="scenario-form">
                    <div class="form-group">
                        <label>Scenario Name</label>
                        <input type="text" id="scenarioName" placeholder="Enter scenario name">
                    </div>
                    <div class="form-group">
                        <label>Description</label>
                        <textarea id="scenarioDescription" placeholder="Describe the test scenario"></textarea>
                    </div>
                    <div class="scenario-sections">
                        <div class="scenario-section">
                            <h4>Security Configuration</h4>
                            <div class="form-group">
                                <label>Key Rotation Interval (ms)</label>
                                <input type="number" id="secKeyRotation" value="5000">
                            </div>
                            <div class="form-group">
                                <label>Max Handshake Attempts</label>
                                <input type="number" id="secMaxHandshakes" value="3">
                            </div>
                            <div class="form-group">
                                <label>Signature Timeout (ms)</label>
                                <input type="number" id="secSignatureTimeout" value="2000">
                            </div>
                        </div>
                        <div class="scenario-section">
                            <h4>Performance Settings</h4>
                            <div class="form-group">
                                <label>Max Handshake Latency (ms)</label>
                                <input type="number" id="perfMaxLatency" value="1000">
                            </div>
                            <div class="form-group">
                                <label>Min Message Throughput</label>
                                <input type="number" id="perfMinThroughput" value="50">
                            </div>
                            <div class="form-group">
                                <label>Processing Timeout (ms)</label>
                                <input type="number" id="perfProcessingTimeout" value="500">
                            </div>
                        </div>
                        <div class="scenario-section">
                            <h4>Network Conditions</h4>
                            <div class="form-group">
                                <label>Latency Range (ms)</label>
                                <div class="range-inputs">
                                    <input type="number" id="netMinLatency" placeholder="Min" value="50">
                                    <input type="number" id="netMaxLatency" placeholder="Max" value="200">
                                </div>
                            </div>
                            <div class="form-group">
                                <label>Packet Loss Rate (%)</label>
                                <input type="number" id="netPacketLoss" value="0" min="0" max="100">
                            </div>
                            <div class="form-group">
                                <label>Connection Drop Probability (%)</label>
                                <input type="number" id="netDropProb" value="0" min="0" max="100">
                            </div>
                        </div>
                    </div>
                    <div class="scenario-actions">
                        <button id="cancelScenario" class="secondary">Cancel</button>
                        <button id="applyScenario" class="primary">Apply & Save</button>
                    </div>
                </div>
            </div>
            <div class="saved-scenarios">
                <h4>Saved Scenarios</h4>
                <div id="scenarioList" class="scenario-list"></div>
            </div>
        `;

        // Add styles
        const style = document.createElement('style');
        style.textContent = `
            .scenario-builder {
                background: #f8f9fa;
                border-radius: 4px;
                padding: 15px;
                margin: 15px 0;
                box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            }

            .scenario-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 15px;
            }

            .scenario-header h3 {
                margin: 0;
                color: #333;
            }

            .scenario-controls button {
                margin-left: 10px;
            }

            .scenario-editor {
                background: white;
                padding: 20px;
                border-radius: 4px;
                margin-bottom: 15px;
            }

            .scenario-form {
                display: flex;
                flex-direction: column;
                gap: 15px;
            }

            .form-group {
                margin-bottom: 10px;
            }

            .form-group label {
                display: block;
                margin-bottom: 5px;
                color: #666;
                font-size: 14px;
            }

            .form-group input,
            .form-group textarea {
                width: 100%;
                padding: 8px;
                border: 1px solid #ddd;
                border-radius: 4px;
                font-size: 14px;
            }

            .form-group textarea {
                height: 80px;
                resize: vertical;
            }

            .scenario-sections {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                gap: 20px;
                margin: 15px 0;
            }

            .scenario-section {
                background: #f8f9fa;
                padding: 15px;
                border-radius: 4px;
            }

            .scenario-section h4 {
                margin: 0 0 15px 0;
                color: #444;
            }

            .range-inputs {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 10px;
            }

            .scenario-actions {
                display: flex;
                justify-content: flex-end;
                gap: 10px;
                margin-top: 15px;
            }

            button.secondary {
                background: #757575;
            }

            button:disabled {
                background: #bdbdbd;
                cursor: not-allowed;
            }

            .saved-scenarios {
                margin-top: 20px;
            }

            .scenario-list {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
                gap: 15px;
                margin-top: 10px;
            }

            .scenario-item {
                background: white;
                padding: 15px;
                border-radius: 4px;
                box-shadow: 0 1px 2px rgba(0,0,0,0.05);
            }

            .scenario-item h5 {
                margin: 0 0 10px 0;
                color: #333;
            }

            .scenario-item p {
                margin: 0 0 10px 0;
                color: #666;
                font-size: 14px;
            }

            .scenario-item-actions {
                display: flex;
                justify-content: flex-end;
                gap: 10px;
            }

            .scenario-item-actions button {
                padding: 4px 8px;
                font-size: 12px;
            }
        `;
        document.head.appendChild(style);

        // Insert panel before test controls
        const testControls = document.querySelector('.test-controls');
        testControls.parentNode.insertBefore(panel, testControls);

        this.attachEventListeners();
    }

    attachEventListeners() {
        // New scenario button
        document.getElementById('newScenario').addEventListener('click', () => {
            document.querySelector('.scenario-editor').style.display = 'block';
            document.getElementById('saveScenario').disabled = true;
            this.currentScenario = null;
            this.resetForm();
        });

        // Save scenario button
        document.getElementById('applyScenario').addEventListener('click', () => {
            this.saveCurrentScenario();
        });

        // Cancel button
        document.getElementById('cancelScenario').addEventListener('click', () => {
            document.querySelector('.scenario-editor').style.display = 'none';
        });

        // Export scenarios
        document.getElementById('exportScenarios').addEventListener('click', () => {
            this.exportScenarios();
        });

        // Import scenarios
        document.getElementById('importScenarios').addEventListener('click', () => {
            this.importScenarios();
        });

        // Enable save button when form changes
        document.querySelector('.scenario-form').addEventListener('input', () => {
            document.getElementById('saveScenario').disabled = false;
        });
    }

    saveCurrentScenario() {
        const scenario = {
            name: document.getElementById('scenarioName').value,
            description: document.getElementById('scenarioDescription').value,
            security: {
                keyRotationInterval: parseInt(document.getElementById('secKeyRotation').value),
                maxHandshakeAttempts: parseInt(document.getElementById('secMaxHandshakes').value),
                signatureTimeout: parseInt(document.getElementById('secSignatureTimeout').value)
            },
            performance: {
                maxHandshakeLatency: parseInt(document.getElementById('perfMaxLatency').value),
                minMessageThroughput: parseInt(document.getElementById('perfMinThroughput').value),
                processingTimeout: parseInt(document.getElementById('perfProcessingTimeout').value)
            },
            network: {
                minLatency: parseInt(document.getElementById('netMinLatency').value),
                maxLatency: parseInt(document.getElementById('netMaxLatency').value),
                packetLossRate: parseInt(document.getElementById('netPacketLoss').value) / 100,
                connectionDropProb: parseInt(document.getElementById('netDropProb').value) / 100
            }
        };

        if (this.validateScenario(scenario)) {
            this.scenarios.set(scenario.name, scenario);
            this.saveScenarios();
            this.updateScenarioList();
            document.querySelector('.scenario-editor').style.display = 'none';
            this.applyScenario(scenario);
        }
    }

    validateScenario(scenario) {
        if (!scenario.name) {
            alert('Please enter a scenario name');
            return false;
        }

        if (this.scenarios.has(scenario.name) && !confirm('A scenario with this name already exists. Overwrite?')) {
            return false;
        }

        return true;
    }

    applyScenario(scenario) {
        // Update test configuration
        window.testConfig.update({
            security: scenario.security,
            performance: scenario.performance,
            network: scenario.network
        });

        console.log(`Applied scenario: ${scenario.name}`);
    }

    resetForm() {
        document.getElementById('scenarioName').value = '';
        document.getElementById('scenarioDescription').value = '';
        document.getElementById('secKeyRotation').value = '5000';
        document.getElementById('secMaxHandshakes').value = '3';
        document.getElementById('secSignatureTimeout').value = '2000';
        document.getElementById('perfMaxLatency').value = '1000';
        document.getElementById('perfMinThroughput').value = '50';
        document.getElementById('perfProcessingTimeout').value = '500';
        document.getElementById('netMinLatency').value = '50';
        document.getElementById('netMaxLatency').value = '200';
        document.getElementById('netPacketLoss').value = '0';
        document.getElementById('netDropProb').value = '0';
    }

    updateScenarioList() {
        const listContainer = document.getElementById('scenarioList');
        listContainer.innerHTML = '';

        for (const [name, scenario] of this.scenarios) {
            const item = document.createElement('div');
            item.className = 'scenario-item';
            item.innerHTML = `
                <h5>${scenario.name}</h5>
                <p>${scenario.description || 'No description'}</p>
                <div class="scenario-item-actions">
                    <button class="secondary" onclick="window.scenarioBuilder.editScenario('${name}')">Edit</button>
                    <button class="primary" onclick="window.scenarioBuilder.applyScenario(window.scenarioBuilder.scenarios.get('${name}'))">Apply</button>
                    <button class="secondary" onclick="window.scenarioBuilder.deleteScenario('${name}')">Delete</button>
                </div>
            `;
            listContainer.appendChild(item);
        }
    }

    editScenario(name) {
        const scenario = this.scenarios.get(name);
        if (!scenario) return;

        this.currentScenario = scenario;
        document.getElementById('scenarioName').value = scenario.name;
        document.getElementById('scenarioDescription').value = scenario.description || '';
        document.getElementById('secKeyRotation').value = scenario.security.keyRotationInterval;
        document.getElementById('secMaxHandshakes').value = scenario.security.maxHandshakeAttempts;
        document.getElementById('secSignatureTimeout').value = scenario.security.signatureTimeout;
        document.getElementById('perfMaxLatency').value = scenario.performance.maxHandshakeLatency;
        document.getElementById('perfMinThroughput').value = scenario.performance.minMessageThroughput;
        document.getElementById('perfProcessingTimeout').value = scenario.performance.processingTimeout;
        document.getElementById('netMinLatency').value = scenario.network.minLatency;
        document.getElementById('netMaxLatency').value = scenario.network.maxLatency;
        document.getElementById('netPacketLoss').value = Math.round(scenario.network.packetLossRate * 100);
        document.getElementById('netDropProb').value = Math.round(scenario.network.connectionDropProb * 100);

        document.querySelector('.scenario-editor').style.display = 'block';
    }

    deleteScenario(name) {
        if (confirm(`Delete scenario "${name}"?`)) {
            this.scenarios.delete(name);
            this.saveScenarios();
            this.updateScenarioList();
        }
    }

    saveScenarios() {
        try {
            localStorage.setItem('testScenarios', JSON.stringify(Array.from(this.scenarios.entries())));
        } catch (error) {
            console.error('Failed to save scenarios:', error);
        }
    }

    loadSavedScenarios() {
        try {
            const saved = localStorage.getItem('testScenarios');
            if (saved) {
                this.scenarios = new Map(JSON.parse(saved));
                this.updateScenarioList();
            }
        } catch (error) {
            console.error('Failed to load scenarios:', error);
        }
    }

    exportScenarios() {
        const data = JSON.stringify(Array.from(this.scenarios.entries()), null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'test-scenarios.json';
        a.click();
        URL.revokeObjectURL(url);
    }

    importScenarios() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = async (e) => {
            try {
                const file = e.target.files[0];
                const text = await file.text();
                const imported = JSON.parse(text);
                
                if (Array.isArray(imported)) {
                    this.scenarios = new Map([...this.scenarios, ...imported]);
                    this.saveScenarios();
                    this.updateScenarioList();
                    alert('Scenarios imported successfully');
                }
            } catch (error) {
                console.error('Failed to import scenarios:', error);
                alert('Failed to import scenarios. Please check the file format.');
            }
        };
        input.click();
    }
}

// Initialize when document is ready
window.scenarioBuilder = new ScenarioBuilder();
