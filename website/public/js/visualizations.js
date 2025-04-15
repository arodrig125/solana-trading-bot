// Advanced Trading Visualizations
class TradingVisualizations {
    constructor() {
        this.charts = new Map();
        this.initializeCharts();
        this.setupEventListeners();
    }

    initializeCharts() {
        // Opportunity Heat Map
        this.initializeHeatMap();
        
        // Network Flow Diagram
        this.initializeNetworkFlow();
        
        // Profit Distribution
        this.initializeProfitDistribution();
        
        // Performance Attribution
        this.initializePerformanceAttribution();
        
        // Volume Profile
        this.initializeVolumeProfile();
    }

    // Initialize Heat Map
    initializeHeatMap() {
        const ctx = document.getElementById('opportunityHeatMap').getContext('2d');
        this.charts.set('heatMap', new Chart(ctx, {
            type: 'matrix',
            data: {
                datasets: [{
                    label: 'Arbitrage Opportunities',
                    data: [],
                    backgroundColor(context) {
                        const value = context.dataset.data[context.dataIndex].v;
                        const alpha = Math.min(Math.max(value / 10, 0), 1);
                        return `rgba(75, 192, 192, ${alpha})`;
                    },
                    width: ({ chart }) => (chart.chartArea.width / 24),
                    height: ({ chart }) => (chart.chartArea.height / 7)
                }]
            },
            options: {
                plugins: {
                    tooltip: {
                        callbacks: {
                            title() {
                                return 'Opportunity';
                            },
                            label(context) {
                                const v = context.dataset.data[context.dataIndex];
                                return [
                                    `Time: ${v.x}:00`,
                                    `Chain: ${v.y}`,
                                    `Value: ${v.v.toFixed(2)}%`
                                ];
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        type: 'linear',
                        offset: true,
                        min: 0,
                        max: 23,
                        ticks: {
                            stepSize: 1
                        },
                        title: {
                            display: true,
                            text: 'Hour of Day (UTC)'
                        }
                    },
                    y: {
                        type: 'linear',
                        offset: true,
                        min: 0,
                        max: 6,
                        ticks: {
                            stepSize: 1,
                            callback: (value) => {
                                const chains = ['SOL', 'ETH', 'BSC', 'MATIC', 'AVAX', 'FTM', 'ARBI'];
                                return chains[value] || '';
                            }
                        },
                        title: {
                            display: true,
                            text: 'Chain'
                        }
                    }
                }
            }
        }));
    }

    // Initialize Network Flow
    initializeNetworkFlow() {
        const container = document.getElementById('networkFlow');
        this.networkFlow = new vis.Network(container, {
            nodes: new vis.DataSet([]),
            edges: new vis.DataSet([])
        }, {
            nodes: {
                shape: 'dot',
                size: 30,
                font: {
                    size: 14
                }
            },
            edges: {
                arrows: {
                    to: { enabled: true, scaleFactor: 0.5 }
                },
                color: {
                    inherit: 'both'
                },
                smooth: {
                    enabled: true,
                    type: 'curvedCW',
                    roundness: 0.2
                }
            },
            physics: {
                stabilization: false,
                barnesHut: {
                    gravitationalConstant: -80000,
                    springConstant: 0.001,
                    springLength: 200
                }
            }
        });
    }

    // Initialize Profit Distribution
    initializeProfitDistribution() {
        const ctx = document.getElementById('profitDistribution').getContext('2d');
        this.charts.set('profitDist', new Chart(ctx, {
            type: 'violin',
            data: {
                labels: ['SOL', 'ETH', 'BSC', 'MATIC', 'AVAX'],
                datasets: [{
                    label: 'Profit Distribution',
                    data: [],
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: 'Profit Distribution by Chain'
                    },
                    legend: {
                        display: false
                    }
                }
            }
        }));
    }

    // Initialize Performance Attribution
    initializePerformanceAttribution() {
        const ctx = document.getElementById('performanceAttribution').getContext('2d');
        this.charts.set('perfAttrib', new Chart(ctx, {
            type: 'treemap',
            data: {
                datasets: [{
                    tree: [],
                    key: 'value',
                    groups: ['chain', 'token'],
                    spacing: 0.5,
                    borderWidth: 1,
                    borderColor: '#fff',
                    backgroundColor(ctx) {
                        const value = ctx.raw.v;
                        return value > 0 ? 'rgba(75, 192, 192, 0.8)' : 'rgba(255, 99, 132, 0.8)';
                    },
                    labels: {
                        display: true,
                        color: '#fff',
                        formatter: (ctx) => {
                            return [
                                ctx.raw.g,
                                ctx.raw.v.toFixed(2) + '%'
                            ];
                        }
                    }
                }]
            },
            options: {
                plugins: {
                    title: {
                        display: true,
                        text: 'Performance Attribution'
                    },
                    tooltip: {
                        callbacks: {
                            title(items) {
                                return items[0].raw.g;
                            },
                            label(item) {
                                const { v, chain, token } = item.raw;
                                return [
                                    `Chain: ${chain}`,
                                    `Token: ${token}`,
                                    `Contribution: ${v.toFixed(2)}%`
                                ];
                            }
                        }
                    }
                }
            }
        }));
    }

    // Initialize Volume Profile
    initializeVolumeProfile() {
        const ctx = document.getElementById('volumeProfile').getContext('2d');
        this.charts.set('volumeProfile', new Chart(ctx, {
            type: 'bar',
            data: {
                labels: [],
                datasets: [
                    {
                        label: 'Volume Profile',
                        data: [],
                        backgroundColor: 'rgba(75, 192, 192, 0.2)',
                        borderColor: 'rgba(75, 192, 192, 1)',
                        borderWidth: 1
                    },
                    {
                        label: 'Value Area',
                        data: [],
                        backgroundColor: 'rgba(255, 99, 132, 0.2)',
                        borderColor: 'rgba(255, 99, 132, 1)',
                        borderWidth: 1,
                        type: 'line'
                    }
                ]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: 'Volume Profile'
                    }
                },
                scales: {
                    x: {
                        stacked: true
                    },
                    y: {
                        stacked: true
                    }
                }
            }
        }));
    }

    // Update Heat Map
    updateHeatMap(data) {
        const heatMapData = [];
        const hours = Array.from({ length: 24 }, (_, i) => i);
        const chains = ['SOL', 'ETH', 'BSC', 'MATIC', 'AVAX', 'FTM', 'ARBI'];

        chains.forEach((chain, y) => {
            hours.forEach(hour => {
                const value = data[chain]?.[hour] || 0;
                heatMapData.push({
                    x: hour,
                    y,
                    v: value
                });
            });
        });

        this.charts.get('heatMap').data.datasets[0].data = heatMapData;
        this.charts.get('heatMap').update();
    }

    // Update Network Flow
    updateNetworkFlow(data) {
        const nodes = new vis.DataSet();
        const edges = new vis.DataSet();

        // Add chain nodes
        data.chains.forEach(chain => {
            nodes.add({
                id: chain.id,
                label: chain.name,
                color: this.getChainColor(chain.name)
            });
        });

        // Add flow edges
        data.flows.forEach(flow => {
            edges.add({
                from: flow.from,
                to: flow.to,
                value: flow.volume,
                title: `Volume: ${flow.volume.toFixed(2)}\nTrades: ${flow.trades}`
            });
        });

        this.networkFlow.setData({ nodes, edges });
    }

    // Update Profit Distribution
    updateProfitDistribution(data) {
        this.charts.get('profitDist').data.datasets[0].data = data;
        this.charts.get('profitDist').update();
    }

    // Update Performance Attribution
    updatePerformanceAttribution(data) {
        this.charts.get('perfAttrib').data.datasets[0].tree = data;
        this.charts.get('perfAttrib').update();
    }

    // Update Volume Profile
    updateVolumeProfile(data) {
        const chart = this.charts.get('volumeProfile');
        chart.data.labels = data.prices;
        chart.data.datasets[0].data = data.volumes;
        chart.data.datasets[1].data = data.valueArea;
        chart.update();
    }

    // Calculate Value Area
    calculateValueArea(volumeProfile, valueAreaPercent = 0.68) {
        const totalVolume = volumeProfile.reduce((sum, vol) => sum + vol, 0);
        const targetVolume = totalVolume * valueAreaPercent;
        let currentVolume = 0;
        const valueArea = [];

        // Find POC (Point of Control)
        const pocIndex = volumeProfile.indexOf(Math.max(...volumeProfile));

        // Expand from POC
        let upperIndex = pocIndex;
        let lowerIndex = pocIndex;

        while (currentVolume < targetVolume && (upperIndex < volumeProfile.length || lowerIndex >= 0)) {
            const upperVol = volumeProfile[upperIndex + 1] || 0;
            const lowerVol = volumeProfile[lowerIndex - 1] || 0;

            if (upperVol > lowerVol) {
                upperIndex++;
                currentVolume += upperVol;
            } else {
                lowerIndex--;
                currentVolume += lowerVol;
            }
        }

        return {
            poc: pocIndex,
            upper: upperIndex,
            lower: lowerIndex
        };
    }

    // Setup Event Listeners
    setupEventListeners() {
        const timeRangeSelector = document.getElementById('timeRangeSelector');
        if (timeRangeSelector) {
            timeRangeSelector.addEventListener('change', (e) => {
                this.updateAllCharts(e.target.value);
            });
        }

        const refreshButton = document.getElementById('refreshButton');
        if (refreshButton) {
            refreshButton.addEventListener('click', () => {
                this.refreshVisualizations();
            });
        }
    }

    // Refresh all visualizations
    refreshVisualizations() {
        const timeRange = document.getElementById('timeRangeSelector').value;
        this.updateAllCharts(timeRange);
    }

    // Update all charts based on time range
    updateAllCharts(timeRange) {
        // Implement API calls to fetch data for the selected time range
        // and update all charts accordingly
    }

    // Get chain-specific color
    getChainColor(chain) {
        const colors = {
            'SOL': '#9945FF',
            'ETH': '#627EEA',
            'BSC': '#F3BA2F',
            'MATIC': '#8247E5',
            'AVAX': '#E84142',
            'FTM': '#1969FF',
            'ARBI': '#28A0F0'
        };
        return colors[chain] || '#000000';
    }
}

// Initialize when document is ready
document.addEventListener('DOMContentLoaded', () => {
    window.tradingVisualizations = new TradingVisualizations();
});
