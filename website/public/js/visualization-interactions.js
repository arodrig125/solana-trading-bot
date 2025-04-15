// Visualization Interactions Manager
class VisualizationInteractions {
    constructor() {
        this.selectedChain = null;
        this.selectedTimeRange = '24h';
        this.filters = new Map();
        this.initializeInteractions();
    }

    initializeInteractions() {
        this.setupHeatMapInteractions();
        this.setupNetworkInteractions();
        this.setupProfitDistributionInteractions();
        this.setupPerformanceInteractions();
        this.setupVolumeProfileInteractions();
        this.setupGlobalFilters();
    }

    setupHeatMapInteractions() {
        const heatMap = document.getElementById('opportunityHeatMap');
        if (!heatMap) return;

        heatMap.addEventListener('click', (event) => {
            const points = window.tradingVisualizations.charts.get('heatMap')
                .getElementsAtEventForMode(event, 'nearest', { intersect: true }, true);

            if (points.length) {
                const point = points[0];
                const data = point.element.$context.raw;
                this.drillDownOpportunity(data);
            }
        });
    }

    setupNetworkInteractions() {
        const network = window.tradingVisualizations.networkFlow;
        if (!network) return;

        network.on('selectNode', (params) => {
            const nodeId = params.nodes[0];
            this.filterByChain(nodeId);
        });

        network.on('doubleClick', (params) => {
            if (params.nodes.length) {
                const nodeId = params.nodes[0];
                this.showChainDetails(nodeId);
            }
        });
    }

    setupProfitDistributionInteractions() {
        const profitDist = document.getElementById('profitDistribution');
        if (!profitDist) return;

        profitDist.addEventListener('click', (event) => {
            const points = window.tradingVisualizations.charts.get('profitDist')
                .getElementsAtEventForMode(event, 'nearest', { intersect: true }, true);

            if (points.length) {
                const point = points[0];
                const chainIndex = point.index;
                const chainName = point.element.$context.raw.label;
                this.showProfitBreakdown(chainName);
            }
        });
    }

    setupPerformanceInteractions() {
        const perfAttrib = document.getElementById('performanceAttribution');
        if (!perfAttrib) return;

        perfAttrib.addEventListener('click', (event) => {
            const points = window.tradingVisualizations.charts.get('perfAttrib')
                .getElementsAtEventForMode(event, 'nearest', { intersect: true }, true);

            if (points.length) {
                const point = points[0];
                const data = point.element.$context.raw;
                this.showPerformanceDetails(data);
            }
        });
    }

    setupVolumeProfileInteractions() {
        const volumeProfile = document.getElementById('volumeProfile');
        if (!volumeProfile) return;

        volumeProfile.addEventListener('click', (event) => {
            const points = window.tradingVisualizations.charts.get('volumeProfile')
                .getElementsAtEventForMode(event, 'nearest', { intersect: true }, true);

            if (points.length) {
                const point = points[0];
                const priceLevel = point.element.$context.raw;
                this.showVolumeDetails(priceLevel);
            }
        });
    }

    setupGlobalFilters() {
        // Time Range Filter
        const timeRange = document.getElementById('timeRangeSelector');
        if (timeRange) {
            timeRange.addEventListener('change', (e) => {
                this.selectedTimeRange = e.target.value;
                this.updateAllVisualizations();
            });
        }

        // Chain Filter
        const chainFilter = document.getElementById('chainFilter');
        if (chainFilter) {
            chainFilter.addEventListener('change', (e) => {
                this.selectedChain = e.target.value;
                this.filterByChain(this.selectedChain);
            });
        }
    }

    // Drill-down handlers
    drillDownOpportunity(data) {
        const modal = new bootstrap.Modal(document.getElementById('opportunityModal'));
        const modalBody = document.getElementById('opportunityModalBody');
        
        modalBody.innerHTML = `
            <h5>Opportunity Details</h5>
            <p>Time: ${data.x}:00 UTC</p>
            <p>Chain: ${data.y}</p>
            <p>Opportunity Size: ${data.v.toFixed(2)}%</p>
            <div id="opportunityChart"></div>
        `;

        // Create detailed opportunity chart
        this.createOpportunityDetailChart(data);
        modal.show();
    }

    showChainDetails(chainId) {
        const modal = new bootstrap.Modal(document.getElementById('chainModal'));
        const modalBody = document.getElementById('chainModalBody');

        // Fetch chain details and create visualizations
        this.fetchChainDetails(chainId).then(details => {
            modalBody.innerHTML = `
                <h5>${details.name} Chain Details</h5>
                <div class="row">
                    <div class="col-md-6">
                        <canvas id="chainVolumeChart"></canvas>
                    </div>
                    <div class="col-md-6">
                        <canvas id="chainMetricsChart"></canvas>
                    </div>
                </div>
            `;

            this.createChainDetailCharts(details);
        });

        modal.show();
    }

    showProfitBreakdown(chainName) {
        const modal = new bootstrap.Modal(document.getElementById('profitModal'));
        const modalBody = document.getElementById('profitModalBody');

        // Fetch profit details and create visualizations
        this.fetchProfitDetails(chainName).then(details => {
            modalBody.innerHTML = `
                <h5>${chainName} Profit Breakdown</h5>
                <div class="row">
                    <div class="col-12">
                        <canvas id="profitBreakdownChart"></canvas>
                    </div>
                </div>
            `;

            this.createProfitBreakdownChart(details);
        });

        modal.show();
    }

    showPerformanceDetails(data) {
        const modal = new bootstrap.Modal(document.getElementById('performanceModal'));
        const modalBody = document.getElementById('performanceModalBody');

        modalBody.innerHTML = `
            <h5>Performance Details</h5>
            <div class="row">
                <div class="col-md-6">
                    <canvas id="performanceTimeChart"></canvas>
                </div>
                <div class="col-md-6">
                    <canvas id="performanceMetricsChart"></canvas>
                </div>
            </div>
        `;

        this.createPerformanceDetailCharts(data);
        modal.show();
    }

    showVolumeDetails(priceLevel) {
        const modal = new bootstrap.Modal(document.getElementById('volumeModal'));
        const modalBody = document.getElementById('volumeModalBody');

        modalBody.innerHTML = `
            <h5>Volume Analysis</h5>
            <div class="row">
                <div class="col-12">
                    <canvas id="volumeDetailChart"></canvas>
                </div>
            </div>
        `;

        this.createVolumeDetailChart(priceLevel);
        modal.show();
    }

    // Filter handlers
    filterByChain(chainId) {
        this.selectedChain = chainId;
        this.filters.set('chain', chainId);
        this.updateAllVisualizations();
    }

    // Update handlers
    updateAllVisualizations() {
        const timeRange = this.selectedTimeRange;
        const filters = Object.fromEntries(this.filters);
        
        // Update each visualization with new filters
        window.tradingVisualizations.updateHeatMap({ timeRange, ...filters });
        window.tradingVisualizations.updateNetworkFlow({ timeRange, ...filters });
        window.tradingVisualizations.updateProfitDistribution({ timeRange, ...filters });
        window.tradingVisualizations.updatePerformanceAttribution({ timeRange, ...filters });
        window.tradingVisualizations.updateVolumeProfile({ timeRange, ...filters });
    }

    // Helper methods for creating detailed charts will be implemented
    // in the next file to keep this one focused on interactions
}

// Initialize when document is ready
document.addEventListener('DOMContentLoaded', () => {
    window.visualizationInteractions = new VisualizationInteractions();
});
