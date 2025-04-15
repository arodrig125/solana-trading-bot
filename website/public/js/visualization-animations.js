// Visualization Animations Manager
class VisualizationAnimations {
    constructor() {
        this.animationDuration = 750; // Default duration in ms
        this.easingFunction = 'easeInOutCubic';
        this.initializeAnimations();
    }

    initializeAnimations() {
        // Register custom easing functions
        this.registerEasingFunctions();
        
        // Add animation configurations to Chart.js
        this.configureChartAnimations();
        
        // Initialize transition observers
        this.setupTransitionObservers();
    }

    registerEasingFunctions() {
        // Custom easing functions for smooth animations
        const easingFunctions = {
            easeInOutCubic: (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
            easeOutElastic: (t) => {
                const c4 = (2 * Math.PI) / 3;
                return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
            },
            easeOutBounce: (t) => {
                const n1 = 7.5625;
                const d1 = 2.75;
                if (t < 1 / d1) {
                    return n1 * t * t;
                } else if (t < 2 / d1) {
                    return n1 * (t -= 1.5 / d1) * t + 0.75;
                } else if (t < 2.5 / d1) {
                    return n1 * (t -= 2.25 / d1) * t + 0.9375;
                } else {
                    return n1 * (t -= 2.625 / d1) * t + 0.984375;
                }
            }
        };

        // Add easing functions to Chart.js
        Object.entries(easingFunctions).forEach(([name, fn]) => {
            Chart.defaults.animation.easing = name;
            Chart.defaults.animation[name] = fn;
        });
    }

    configureChartAnimations() {
        // Configure default Chart.js animations
        Chart.defaults.animation = {
            duration: this.animationDuration,
            easing: this.easingFunction,
            mode: 'active',
            numbers: {
                type: 'number',
                properties: ['x', 'y', 'base', 'width', 'height']
            },
            colors: {
                type: 'color',
                properties: ['borderColor', 'backgroundColor']
            }
        };

        // Configure specific chart type animations
        this.configureHeatMapAnimations();
        this.configureNetworkAnimations();
        this.configureProfitAnimations();
        this.configurePerformanceAnimations();
        this.configureVolumeAnimations();
    }

    configureHeatMapAnimations() {
        const heatMapConfig = {
            animations: {
                numbers: {
                    type: 'number',
                    duration: this.animationDuration,
                    properties: ['value']
                },
                colors: {
                    type: 'color',
                    duration: this.animationDuration,
                    properties: ['backgroundColor']
                }
            },
            transitions: {
                show: {
                    animations: {
                        scale: {
                            from: 0,
                            to: 1,
                            duration: this.animationDuration
                        }
                    }
                },
                hide: {
                    animations: {
                        scale: {
                            to: 0,
                            duration: this.animationDuration / 2
                        }
                    }
                }
            }
        };

        // Apply to heat map chart
        if (window.tradingVisualizations?.charts?.get('heatMap')) {
            window.tradingVisualizations.charts.get('heatMap').options.animation = heatMapConfig;
        }
    }

    configureNetworkAnimations() {
        const networkConfig = {
            animation: {
                duration: this.animationDuration,
                easingFunction: this.easingFunction
            },
            physics: {
                stabilization: {
                    enabled: true,
                    iterations: 100,
                    updateInterval: 50
                }
            }
        };

        // Apply to network visualization
        if (window.tradingVisualizations?.networkFlow) {
            window.tradingVisualizations.networkFlow.setOptions(networkConfig);
        }
    }

    configureProfitAnimations() {
        const profitConfig = {
            animations: {
                tension: {
                    duration: this.animationDuration,
                    easing: 'easeOutElastic',
                    from: 0.4,
                    to: 0.2
                }
            }
        };

        // Apply to profit distribution chart
        if (window.tradingVisualizations?.charts?.get('profitDist')) {
            window.tradingVisualizations.charts.get('profitDist').options.animation = profitConfig;
        }
    }

    configurePerformanceAnimations() {
        const performanceConfig = {
            animations: {
                numbers: {
                    type: 'number',
                    duration: this.animationDuration,
                    properties: ['value', 'size']
                }
            },
            transitions: {
                resize: {
                    animation: {
                        duration: this.animationDuration,
                        easing: 'easeOutBounce'
                    }
                }
            }
        };

        // Apply to performance attribution chart
        if (window.tradingVisualizations?.charts?.get('perfAttrib')) {
            window.tradingVisualizations.charts.get('perfAttrib').options.animation = performanceConfig;
        }
    }

    configureVolumeAnimations() {
        const volumeConfig = {
            animations: {
                y: {
                    duration: this.animationDuration,
                    easing: 'easeInOutCubic'
                }
            }
        };

        // Apply to volume profile chart
        if (window.tradingVisualizations?.charts?.get('volumeProfile')) {
            window.tradingVisualizations.charts.get('volumeProfile').options.animation = volumeConfig;
        }
    }

    setupTransitionObservers() {
        // Observe chart container visibility
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.animateChartEntry(entry.target);
                }
            });
        }, {
            threshold: 0.1
        });

        // Observe all chart containers
        document.querySelectorAll('.visualization-card').forEach(card => {
            observer.observe(card);
        });
    }

    animateChartEntry(element) {
        // Add entry animation class
        element.classList.add('chart-enter');
        
        // Trigger chart update if available
        const chartId = element.querySelector('canvas')?.id;
        if (chartId && window.tradingVisualizations?.charts?.get(chartId)) {
            window.tradingVisualizations.charts.get(chartId).update('show');
        }
    }

    // Animation utility methods
    animateValue(element, start, end, duration) {
        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            const value = Math.floor(progress * (end - start) + start);
            element.textContent = this.formatNumber(value);
            if (progress < 1) {
                window.requestAnimationFrame(step);
            }
        };
        window.requestAnimationFrame(step);
    }

    animateNetworkTransition(oldData, newData) {
        const network = window.tradingVisualizations?.networkFlow;
        if (!network) return;

        // Animate nodes
        const nodes = network.body.data.nodes;
        const edges = network.body.data.edges;

        // Fade out existing elements
        nodes.forEach(node => {
            node.opacity = 0;
        });
        edges.forEach(edge => {
            edge.opacity = 0;
        });

        // Update data
        network.setData(newData);

        // Fade in new elements
        setTimeout(() => {
            newData.nodes.forEach(node => {
                node.opacity = 1;
            });
            newData.edges.forEach(edge => {
                edge.opacity = 1;
            });
            network.redraw();
        }, this.animationDuration / 2);
    }

    formatNumber(value) {
        return new Intl.NumberFormat().format(value);
    }
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    .chart-enter {
        animation: chartEnter 0.75s ease-out;
    }

    @keyframes chartEnter {
        from {
            opacity: 0;
            transform: translateY(20px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    .visualization-card {
        transition: transform 0.3s ease-in-out;
    }

    .visualization-card:hover {
        transform: translateY(-5px);
    }

    .network-node {
        transition: all 0.3s ease-in-out;
    }

    .network-edge {
        transition: all 0.3s ease-in-out;
    }
`;
document.head.appendChild(style);

// Initialize when document is ready
document.addEventListener('DOMContentLoaded', () => {
    window.visualizationAnimations = new VisualizationAnimations();
});
