class ReportGenerator {
    constructor() {
        this.reports = new Map();
        this.currentReport = null;
        this.charts = new Map();
    }

    initialize() {
        this.createReportPanel();
        this.loadSavedReports();
    }

    createReportPanel() {
        const panel = document.createElement('div');
        panel.className = 'report-generator';
        panel.innerHTML = `
            <div class="report-header">
                <h3>Test Report Generator</h3>
                <div class="report-controls">
                    <button id="generateReport" class="primary">Generate Report</button>
                    <button id="exportReport" class="secondary" disabled>Export</button>
                    <select id="exportFormat" disabled>
                        <option value="pdf">PDF</option>
                        <option value="html">HTML</option>
                        <option value="json">JSON</option>
                    </select>
                </div>
            </div>
            <div class="report-content" style="display: none;">
                <div class="report-summary">
                    <h4>Test Summary</h4>
                    <div class="summary-grid">
                        <div class="summary-item">
                            <label>Test Duration</label>
                            <span id="testDuration">-</span>
                        </div>
                        <div class="summary-item">
                            <label>Total Tests</label>
                            <span id="totalTestCount">-</span>
                        </div>
                        <div class="summary-item">
                            <label>Success Rate</label>
                            <span id="successRate">-</span>
                        </div>
                        <div class="summary-item">
                            <label>Avg Response Time</label>
                            <span id="avgResponseTime">-</span>
                        </div>
                    </div>
                </div>
                <div class="report-charts">
                    <div class="chart-container">
                        <h4>Response Time Distribution</h4>
                        <canvas id="responseTimeChart"></canvas>
                    </div>
                    <div class="chart-container">
                        <h4>Test Results Over Time</h4>
                        <canvas id="resultsTimelineChart"></canvas>
                    </div>
                </div>
                <div class="report-details">
                    <h4>Test Details</h4>
                    <div id="testDetails" class="details-table"></div>
                </div>
                <div class="report-recommendations">
                    <h4>Recommendations</h4>
                    <ul id="recommendations"></ul>
                </div>
            </div>
        `;

        // Add styles
        const style = document.createElement('style');
        style.textContent = `
            .report-generator {
                background: #f8f9fa;
                border-radius: 4px;
                padding: 15px;
                margin: 15px 0;
                box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            }

            .report-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 15px;
            }

            .report-header h3 {
                margin: 0;
                color: #333;
            }

            .report-controls {
                display: flex;
                gap: 10px;
                align-items: center;
            }

            .report-controls select {
                padding: 8px;
                border: 1px solid #ddd;
                border-radius: 4px;
                background: white;
            }

            .report-content {
                background: white;
                padding: 20px;
                border-radius: 4px;
                margin-top: 15px;
            }

            .summary-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 20px;
                margin: 15px 0;
            }

            .summary-item {
                padding: 15px;
                background: #f8f9fa;
                border-radius: 4px;
                text-align: center;
            }

            .summary-item label {
                display: block;
                color: #666;
                font-size: 14px;
                margin-bottom: 5px;
            }

            .summary-item span {
                font-size: 24px;
                font-weight: 500;
                color: #333;
            }

            .report-charts {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
                gap: 20px;
                margin: 20px 0;
            }

            .chart-container {
                background: #f8f9fa;
                padding: 15px;
                border-radius: 4px;
            }

            .chart-container h4 {
                margin: 0 0 15px 0;
                color: #333;
            }

            .chart-container canvas {
                width: 100%;
                height: 300px;
            }

            .details-table {
                width: 100%;
                border-collapse: collapse;
                margin: 15px 0;
            }

            .details-table th,
            .details-table td {
                padding: 10px;
                text-align: left;
                border-bottom: 1px solid #eee;
            }

            .details-table th {
                background: #f8f9fa;
                font-weight: 500;
                color: #333;
            }

            .details-table tr:hover {
                background: #f8f9fa;
            }

            .report-recommendations {
                background: #e8f5e9;
                padding: 15px;
                border-radius: 4px;
                margin-top: 20px;
            }

            .report-recommendations ul {
                margin: 10px 0;
                padding-left: 20px;
            }

            .report-recommendations li {
                margin: 5px 0;
                color: #2e7d32;
            }
        `;
        document.head.appendChild(style);

        // Insert panel before test controls
        const testControls = document.querySelector('.test-controls');
        testControls.parentNode.insertBefore(panel, testControls);

        this.attachEventListeners();
    }

    attachEventListeners() {
        document.getElementById('generateReport').addEventListener('click', () => {
            this.generateReport();
        });

        document.getElementById('exportReport').addEventListener('click', () => {
            const format = document.getElementById('exportFormat').value;
            this.exportReport(format);
        });
    }

    generateReport() {
        // Show report content
        document.querySelector('.report-content').style.display = 'block';
        document.getElementById('exportReport').disabled = false;
        document.getElementById('exportFormat').disabled = false;

        // Get test results
        const results = this.gatherTestResults();

        // Update summary
        this.updateSummary(results);

        // Generate charts
        this.generateCharts(results);

        // Update test details
        this.updateTestDetails(results);

        // Generate recommendations
        this.generateRecommendations(results);

        // Save report
        this.saveReport(results);
    }

    gatherTestResults() {
        const results = {
            timestamp: Date.now(),
            duration: this.calculateTestDuration(),
            tests: window.testRunner.getResults(),
            performance: {
                avgResponseTime: this.calculateAverageResponseTime(),
                successRate: this.calculateSuccessRate(),
                throughput: this.calculateThroughput()
            },
            network: {
                latency: window.connectionMonitor.metrics.latency,
                packetLoss: window.testConfig.network.packetLossRate,
                reconnects: window.connectionMonitor.metrics.reconnects
            }
        };

        return results;
    }

    calculateTestDuration() {
        // Implementation depends on when tests started
        return 0; // Placeholder
    }

    calculateAverageResponseTime() {
        const latencies = window.connectionMonitor.metrics.latency;
        if (latencies.length === 0) return 0;
        return latencies.reduce((a, b) => a + b, 0) / latencies.length;
    }

    calculateSuccessRate() {
        const results = window.testRunner.getResults();
        if (!results || results.length === 0) return 0;
        const passed = results.filter(r => r.passed).length;
        return (passed / results.length) * 100;
    }

    calculateThroughput() {
        // Messages per second based on connection monitor
        const duration = (Date.now() - window.connectionMonitor.startTime) / 1000;
        return window.connectionMonitor.metrics.messageCount / duration;
    }

    updateSummary(results) {
        document.getElementById('testDuration').textContent = 
            this.formatDuration(results.duration);
        document.getElementById('totalTestCount').textContent = 
            results.tests.length;
        document.getElementById('successRate').textContent = 
            `${Math.round(results.performance.successRate)}%`;
        document.getElementById('avgResponseTime').textContent = 
            `${Math.round(results.performance.avgResponseTime)}ms`;
    }

    generateCharts(results) {
        this.generateResponseTimeChart(results);
        this.generateResultsTimelineChart(results);
    }

    generateResponseTimeChart(results) {
        const ctx = document.getElementById('responseTimeChart').getContext('2d');
        
        // Destroy existing chart if it exists
        if (this.charts.has('responseTime')) {
            this.charts.get('responseTime').destroy();
        }

        const latencies = results.network.latency;
        const labels = [];
        const data = [];

        // Create histogram data
        const binSize = 50; // 50ms bins
        const bins = new Map();
        
        latencies.forEach(latency => {
            const bin = Math.floor(latency / binSize) * binSize;
            bins.set(bin, (bins.get(bin) || 0) + 1);
        });

        // Sort bins
        const sortedBins = Array.from(bins.entries()).sort((a, b) => a[0] - b[0]);
        sortedBins.forEach(([bin, count]) => {
            labels.push(`${bin}-${bin + binSize}ms`);
            data.push(count);
        });

        const chart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels,
                datasets: [{
                    label: 'Response Time Distribution',
                    data,
                    backgroundColor: '#2196f3',
                    borderColor: '#1976d2',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Number of Requests'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Response Time (ms)'
                        }
                    }
                }
            }
        });

        this.charts.set('responseTime', chart);
    }

    generateResultsTimelineChart(results) {
        const ctx = document.getElementById('resultsTimelineChart').getContext('2d');
        
        // Destroy existing chart if it exists
        if (this.charts.has('resultsTimeline')) {
            this.charts.get('resultsTimeline').destroy();
        }

        const timeData = results.tests.map((_, index) => {
            const passed = results.tests.slice(0, index + 1)
                .filter(r => r.passed).length;
            return (passed / (index + 1)) * 100;
        });

        const chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: timeData.map((_, i) => `Test ${i + 1}`),
                datasets: [{
                    label: 'Success Rate Over Time',
                    data: timeData,
                    borderColor: '#4caf50',
                    backgroundColor: 'rgba(76, 175, 80, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        title: {
                            display: true,
                            text: 'Success Rate (%)'
                        }
                    }
                }
            }
        });

        this.charts.set('resultsTimeline', chart);
    }

    updateTestDetails(results) {
        const container = document.getElementById('testDetails');
        container.innerHTML = `
            <table class="details-table">
                <thead>
                    <tr>
                        <th>Test Name</th>
                        <th>Status</th>
                        <th>Duration</th>
                        <th>Error</th>
                    </tr>
                </thead>
                <tbody>
                    ${results.tests.map(test => `
                        <tr>
                            <td>${test.name}</td>
                            <td>
                                <span class="status-badge ${test.passed ? 'success' : 'failure'}">
                                    ${test.passed ? 'Passed' : 'Failed'}
                                </span>
                            </td>
                            <td>${test.duration || '-'}ms</td>
                            <td>${test.error || '-'}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    }

    generateRecommendations(results) {
        const recommendations = [];

        // Analyze success rate
        if (results.performance.successRate < 90) {
            recommendations.push(
                'Success rate is below 90%. Consider reviewing error patterns and adjusting retry mechanisms.'
            );
        }

        // Analyze response times
        const avgResponseTime = results.performance.avgResponseTime;
        if (avgResponseTime > 1000) {
            recommendations.push(
                'Average response time is high. Consider optimizing network conditions or server processing.'
            );
        }

        // Analyze reconnects
        if (results.network.reconnects > 5) {
            recommendations.push(
                'High number of reconnections detected. Review network stability and connection handling.'
            );
        }

        // Update recommendations list
        const container = document.getElementById('recommendations');
        container.innerHTML = recommendations.length > 0 
            ? recommendations.map(r => `<li>${r}</li>`).join('')
            : '<li>All metrics are within acceptable ranges.</li>';
    }

    formatDuration(ms) {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        
        return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    }

    async exportReport(format) {
        if (!this.currentReport) return;

        switch (format) {
            case 'json':
                this.exportJSON();
                break;
            case 'html':
                this.exportHTML();
                break;
            case 'pdf':
                await this.exportPDF();
                break;
        }
    }

    exportJSON() {
        const data = JSON.stringify(this.currentReport, null, 2);
        this.downloadFile(data, 'test-report.json', 'application/json');
    }

    exportHTML() {
        // Create a styled HTML document
        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Test Report - ${new Date(this.currentReport.timestamp).toLocaleString()}</title>
                <style>
                    /* Add styles similar to the dashboard */
                </style>
            </head>
            <body>
                <div class="report">
                    <!-- Add report content -->
                </div>
            </body>
            </html>
        `;
        
        this.downloadFile(html, 'test-report.html', 'text/html');
    }

    async exportPDF() {
        // This would typically use a PDF generation library
        console.log('PDF export not implemented');
    }

    downloadFile(content, filename, type) {
        const blob = new Blob([content], { type });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    }

    saveReport(report) {
        this.currentReport = report;
        
        // Save to localStorage
        try {
            const reports = JSON.parse(localStorage.getItem('testReports') || '[]');
            reports.push(report);
            localStorage.setItem('testReports', JSON.stringify(reports));
        } catch (error) {
            console.error('Failed to save report:', error);
        }
    }

    loadSavedReports() {
        try {
            const reports = JSON.parse(localStorage.getItem('testReports') || '[]');
            reports.forEach(report => this.reports.set(report.timestamp, report));
        } catch (error) {
            console.error('Failed to load reports:', error);
        }
    }
}

// Initialize when document is ready
window.reportGenerator = new ReportGenerator();
