// Data Loader for Visualizations
class DataLoader {
    constructor() {
        this.api = window.apiService;
        this.visualizations = window.tradingVisualizations;
        this.setupAutoRefresh();
    }

    // Load all visualization data
    async loadAllData(timeRange = '24h') {
        try {
            await Promise.all([
                this.loadOpportunityData(timeRange),
                this.loadNetworkData(timeRange),
                this.loadProfitData(timeRange),
                this.loadPerformanceData(timeRange),
                this.loadVolumeData(timeRange)
            ]);

            // Update last refresh time
            this.updateLastRefreshTime();
        } catch (error) {
            console.error('Error loading data:', error);
        }
    }

    // Load opportunity heat map data
    async loadOpportunityData(timeRange) {
        try {
            const data = await this.api.getOpportunityData(timeRange);
            this.visualizations.updateHeatMap(data);
            this.updateOpportunityStats(data);
        } catch (error) {
            console.error('Error loading opportunity data:', error);
        }
    }

    // Load network flow data
    async loadNetworkData(timeRange) {
        try {
            const data = await this.api.getNetworkFlowData(timeRange);
            this.visualizations.updateNetworkFlow(data);
            this.updateNetworkStats(data);
        } catch (error) {
            console.error('Error loading network data:', error);
        }
    }

    // Load profit distribution data
    async loadProfitData(timeRange) {
        try {
            const data = await this.api.getProfitData(timeRange);
            this.visualizations.updateProfitDistribution(data);
            this.updateProfitStats(data);
        } catch (error) {
            console.error('Error loading profit data:', error);
        }
    }

    // Load performance attribution data
    async loadPerformanceData(timeRange) {
        try {
            const data = await this.api.getPerformanceData(timeRange);
            this.visualizations.updatePerformanceAttribution(data);
            this.updatePerformanceStats(data);
        } catch (error) {
            console.error('Error loading performance data:', error);
        }
    }

    // Load volume profile data
    async loadVolumeData(timeRange) {
        try {
            const data = await this.api.getVolumeData(timeRange);
            this.visualizations.updateVolumeProfile(data);
            this.updateVolumeStats(data);
        } catch (error) {
            console.error('Error loading volume data:', error);
        }
    }

    // Update statistics displays
    updateOpportunityStats(data) {
        const stats = this.calculateOpportunityStats(data);
        document.getElementById('totalOpportunities').textContent = stats.total;
        document.getElementById('avgOpportunitySize').textContent = 
            `$${stats.averageSize.toFixed(2)}`;
        document.getElementById('bestChain').textContent = stats.bestChain;
    }

    updateNetworkStats(data) {
        const stats = this.calculateNetworkStats(data);
        document.getElementById('totalVolume').textContent = 
            `$${this.formatNumber(stats.totalVolume)}`;
        document.getElementById('activeChains').textContent = stats.activeChains;
        document.getElementById('avgTransferTime').textContent = 
            `${stats.avgTransferTime.toFixed(1)}s`;
    }

    updateProfitStats(data) {
        const stats = this.calculateProfitStats(data);
        document.getElementById('totalProfit').textContent = 
            `$${this.formatNumber(stats.totalProfit)}`;
        document.getElementById('profitableRatio').textContent = 
            `${(stats.profitableRatio * 100).toFixed(1)}%`;
        document.getElementById('avgProfitPerTrade').textContent = 
            `$${stats.avgProfit.toFixed(2)}`;
    }

    updatePerformanceStats(data) {
        const stats = this.calculatePerformanceStats(data);
        document.getElementById('successRate').textContent = 
            `${(stats.successRate * 100).toFixed(1)}%`;
        document.getElementById('avgExecutionTime').textContent = 
            `${stats.avgExecutionTime.toFixed(1)}s`;
        document.getElementById('gasEfficiency').textContent = 
            `${stats.gasEfficiency.toFixed(2)}`;
    }

    updateVolumeStats(data) {
        const stats = this.calculateVolumeStats(data);
        document.getElementById('peakVolume').textContent = 
            `$${this.formatNumber(stats.peakVolume)}`;
        document.getElementById('volumeChange').textContent = 
            `${stats.volumeChange > 0 ? '+' : ''}${(stats.volumeChange * 100).toFixed(1)}%`;
        document.getElementById('avgSlippage').textContent = 
            `${(stats.avgSlippage * 100).toFixed(3)}%`;
    }

    // Statistics calculation helpers
    calculateOpportunityStats(data) {
        // Calculate opportunity statistics
        return {
            total: data.opportunities.length,
            averageSize: data.opportunities.reduce((sum, opp) => sum + opp.size, 0) / data.opportunities.length,
            bestChain: this.findBestChain(data.opportunities)
        };
    }

    calculateNetworkStats(data) {
        // Calculate network statistics
        return {
            totalVolume: data.flows.reduce((sum, flow) => sum + flow.volume, 0),
            activeChains: new Set(data.flows.map(flow => flow.from)).size,
            avgTransferTime: data.flows.reduce((sum, flow) => sum + flow.time, 0) / data.flows.length
        };
    }

    calculateProfitStats(data) {
        // Calculate profit statistics
        const profits = data.trades.map(trade => trade.profit);
        return {
            totalProfit: profits.reduce((sum, profit) => sum + profit, 0),
            profitableRatio: profits.filter(p => p > 0).length / profits.length,
            avgProfit: profits.reduce((sum, profit) => sum + profit, 0) / profits.length
        };
    }

    calculatePerformanceStats(data) {
        // Calculate performance statistics
        return {
            successRate: data.successful / data.total,
            avgExecutionTime: data.totalExecutionTime / data.total,
            gasEfficiency: data.totalProfit / data.totalGasCost
        };
    }

    calculateVolumeStats(data) {
        // Calculate volume statistics
        return {
            peakVolume: Math.max(...data.volumes),
            volumeChange: (data.volumes[data.volumes.length - 1] - data.volumes[0]) / data.volumes[0],
            avgSlippage: data.slippages.reduce((sum, slip) => sum + slip, 0) / data.slippages.length
        };
    }

    // Helper methods
    findBestChain(opportunities) {
        const chainProfits = opportunities.reduce((acc, opp) => {
            acc[opp.chain] = (acc[opp.chain] || 0) + opp.size;
            return acc;
        }, {});
        return Object.entries(chainProfits)
            .sort(([,a], [,b]) => b - a)[0][0];
    }

    formatNumber(value) {
        return new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(value);
    }

    // Auto-refresh setup
    setupAutoRefresh() {
        const refreshInterval = 30000; // 30 seconds
        setInterval(() => this.loadAllData(), refreshInterval);

        // Add refresh button handler
        const refreshButton = document.getElementById('refreshButton');
        if (refreshButton) {
            refreshButton.addEventListener('click', () => {
                const timeRange = document.getElementById('timeRangeSelector').value;
                this.loadAllData(timeRange);
            });
        }
    }

    // Update last refresh time
    updateLastRefreshTime() {
        const lastRefreshElement = document.getElementById('lastRefresh');
        if (lastRefreshElement) {
            const now = new Date();
            lastRefreshElement.textContent = now.toLocaleTimeString();
        }
    }
}

// Initialize when document is ready
document.addEventListener('DOMContentLoaded', () => {
    window.dataLoader = new DataLoader();
    // Load initial data
    window.dataLoader.loadAllData();
});
