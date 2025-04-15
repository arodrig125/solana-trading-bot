// Detailed Chart Creation Methods
class DetailedCharts {
    // Create detailed opportunity breakdown chart
    static createOpportunityDetailChart(data) {
        const ctx = document.getElementById('opportunityChart').getContext('2d');
        return new Chart(ctx, {
            type: 'line',
            data: {
                labels: Array.from({length: 24}, (_, i) => `${i}:00`),
                datasets: [{
                    label: 'Opportunity Size',
                    data: data.hourlyData || [],
                    borderColor: 'rgb(75, 192, 192)',
                    tension: 0.1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: 'Hourly Opportunity Size'
                    }
                }
            }
        });
    }

    // Create chain detail charts
    static createChainDetailCharts(details) {
        // Volume Chart
        const volumeCtx = document.getElementById('chainVolumeChart').getContext('2d');
        new Chart(volumeCtx, {
            type: 'bar',
            data: {
                labels: details.timeLabels,
                datasets: [{
                    label: 'Volume',
                    data: details.volumeData,
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
                        text: 'Chain Volume'
                    }
                }
            }
        });

        // Metrics Chart
        const metricsCtx = document.getElementById('chainMetricsChart').getContext('2d');
        new Chart(metricsCtx, {
            type: 'radar',
            data: {
                labels: [
                    'Transaction Success',
                    'Gas Efficiency',
                    'Liquidity Depth',
                    'Price Impact',
                    'Bridge Reliability'
                ],
                datasets: [{
                    label: 'Chain Metrics',
                    data: [
                        details.txSuccess,
                        details.gasEfficiency,
                        details.liquidityDepth,
                        details.priceImpact,
                        details.bridgeReliability
                    ],
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
                        text: 'Chain Metrics'
                    }
                },
                scales: {
                    r: {
                        beginAtZero: true,
                        max: 1
                    }
                }
            }
        });
    }

    // Create profit breakdown chart
    static createProfitBreakdownChart(details) {
        const ctx = document.getElementById('profitBreakdownChart').getContext('2d');
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: details.tokens,
                datasets: [
                    {
                        label: 'Gross Profit',
                        data: details.grossProfits,
                        backgroundColor: 'rgba(75, 192, 192, 0.2)',
                        borderColor: 'rgba(75, 192, 192, 1)',
                        borderWidth: 1
                    },
                    {
                        label: 'Net Profit',
                        data: details.netProfits,
                        backgroundColor: 'rgba(255, 99, 132, 0.2)',
                        borderColor: 'rgba(255, 99, 132, 1)',
                        borderWidth: 1
                    }
                ]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: 'Profit Breakdown by Token'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }

    // Create performance detail charts
    static createPerformanceDetailCharts(data) {
        // Time Series Chart
        const timeCtx = document.getElementById('performanceTimeChart').getContext('2d');
        new Chart(timeCtx, {
            type: 'line',
            data: {
                labels: data.timeLabels,
                datasets: [{
                    label: 'Performance',
                    data: data.performanceData,
                    borderColor: data.performance >= 0 ? 'rgb(75, 192, 192)' : 'rgb(255, 99, 132)',
                    tension: 0.1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: 'Performance Over Time'
                    }
                }
            }
        });

        // Metrics Chart
        const metricsCtx = document.getElementById('performanceMetricsChart').getContext('2d');
        new Chart(metricsCtx, {
            type: 'doughnut',
            data: {
                labels: ['Successful', 'Failed', 'Pending'],
                datasets: [{
                    data: [
                        data.metrics.successful,
                        data.metrics.failed,
                        data.metrics.pending
                    ],
                    backgroundColor: [
                        'rgba(75, 192, 192, 0.2)',
                        'rgba(255, 99, 132, 0.2)',
                        'rgba(255, 206, 86, 0.2)'
                    ],
                    borderColor: [
                        'rgba(75, 192, 192, 1)',
                        'rgba(255, 99, 132, 1)',
                        'rgba(255, 206, 86, 1)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: 'Transaction Status'
                    }
                }
            }
        });
    }

    // Create volume detail chart
    static createVolumeDetailChart(priceLevel) {
        const ctx = document.getElementById('volumeDetailChart').getContext('2d');
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: priceLevel.timeLabels,
                datasets: [
                    {
                        label: 'Buy Volume',
                        data: priceLevel.buyVolume,
                        backgroundColor: 'rgba(75, 192, 192, 0.2)',
                        borderColor: 'rgba(75, 192, 192, 1)',
                        borderWidth: 1
                    },
                    {
                        label: 'Sell Volume',
                        data: priceLevel.sellVolume,
                        backgroundColor: 'rgba(255, 99, 132, 0.2)',
                        borderColor: 'rgba(255, 99, 132, 1)',
                        borderWidth: 1
                    }
                ]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: 'Volume Analysis by Price Level'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        stacked: true
                    },
                    x: {
                        stacked: true
                    }
                }
            }
        });
    }
}

// Make DetailedCharts available globally
window.DetailedCharts = DetailedCharts;
