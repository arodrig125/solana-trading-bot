// API Service for Trading Visualizations
class ApiService {
    constructor() {
        this.baseUrl = '/api/v1';
        this.endpoints = {
            opportunities: '/opportunities',
            networkFlow: '/network-flow',
            profits: '/profits',
            performance: '/performance',
            volume: '/volume',
            metrics: '/metrics'
        };
        this.loadingStates = new Map();
    }

    // Generic API call method with error handling
    async fetchData(endpoint, params = {}) {
        const loadingKey = `${endpoint}-${JSON.stringify(params)}`;
        this.setLoading(loadingKey, true);

        try {
            const queryString = new URLSearchParams(params).toString();
            const url = `${this.baseUrl}${endpoint}${queryString ? `?${queryString}` : ''}`;
            
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.getAuthToken()}`
                }
            });

            if (!response.ok) {
                throw new Error(`API Error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('API Error:', error);
            this.handleError(error);
            throw error;
        } finally {
            this.setLoading(loadingKey, false);
        }
    }

    // Opportunity data methods
    async getOpportunityData(timeRange = '24h', chain = null) {
        const params = { timeRange };
        if (chain) params.chain = chain;

        return this.fetchData(this.endpoints.opportunities, params);
    }

    async getOpportunityDetails(opportunityId) {
        return this.fetchData(`${this.endpoints.opportunities}/${opportunityId}`);
    }

    // Network flow methods
    async getNetworkFlowData(timeRange = '24h') {
        return this.fetchData(this.endpoints.networkFlow, { timeRange });
    }

    async getChainDetails(chainId, timeRange = '24h') {
        return this.fetchData(`${this.endpoints.networkFlow}/chain/${chainId}`, { timeRange });
    }

    // Profit analysis methods
    async getProfitData(timeRange = '24h', chain = null) {
        const params = { timeRange };
        if (chain) params.chain = chain;

        return this.fetchData(this.endpoints.profits, params);
    }

    async getProfitBreakdown(chain, timeRange = '24h') {
        return this.fetchData(`${this.endpoints.profits}/${chain}/breakdown`, { timeRange });
    }

    // Performance methods
    async getPerformanceData(timeRange = '24h', metrics = []) {
        return this.fetchData(this.endpoints.performance, {
            timeRange,
            metrics: metrics.join(',')
        });
    }

    async getPerformanceDetails(category, timeRange = '24h') {
        return this.fetchData(`${this.endpoints.performance}/${category}`, { timeRange });
    }

    // Volume analysis methods
    async getVolumeData(timeRange = '24h', chain = null) {
        const params = { timeRange };
        if (chain) params.chain = chain;

        return this.fetchData(this.endpoints.volume, params);
    }

    async getVolumeProfile(priceLevel, timeRange = '24h') {
        return this.fetchData(`${this.endpoints.volume}/profile/${priceLevel}`, { timeRange });
    }

    // Aggregate metrics methods
    async getAggregateMetrics(timeRange = '24h') {
        return this.fetchData(this.endpoints.metrics, { timeRange });
    }

    // Loading state management
    setLoading(key, isLoading) {
        this.loadingStates.set(key, isLoading);
        this.updateLoadingUI(key, isLoading);
    }

    isLoading(key) {
        return this.loadingStates.get(key) || false;
    }

    updateLoadingUI(key, isLoading) {
        // Find all elements that depend on this loading state
        const elements = document.querySelectorAll(`[data-loading-key="${key}"]`);
        
        elements.forEach(element => {
            const loadingSpinner = element.querySelector('.loading-spinner');
            const content = element.querySelector('.content');

            if (isLoading) {
                element.classList.add('loading');
                if (!loadingSpinner) {
                    const spinner = this.createLoadingSpinner();
                    element.insertBefore(spinner, content);
                }
                if (content) content.style.opacity = '0.5';
            } else {
                element.classList.remove('loading');
                if (loadingSpinner) loadingSpinner.remove();
                if (content) content.style.opacity = '1';
            }
        });
    }

    createLoadingSpinner() {
        const spinner = document.createElement('div');
        spinner.className = 'loading-spinner';
        spinner.innerHTML = `
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
        `;
        return spinner;
    }

    // Error handling
    handleError(error) {
        // Create or update error toast
        const toastContainer = document.getElementById('toastContainer') || this.createToastContainer();
        const toast = document.createElement('div');
        toast.className = 'toast align-items-center text-white bg-danger border-0';
        toast.setAttribute('role', 'alert');
        toast.setAttribute('aria-live', 'assertive');
        toast.setAttribute('aria-atomic', 'true');
        
        toast.innerHTML = `
            <div class="d-flex">
                <div class="toast-body">
                    Error: ${error.message}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
        `;

        toastContainer.appendChild(toast);
        const bsToast = new bootstrap.Toast(toast);
        bsToast.show();

        // Remove toast after it's hidden
        toast.addEventListener('hidden.bs.toast', () => {
            toast.remove();
        });
    }

    createToastContainer() {
        const container = document.createElement('div');
        container.id = 'toastContainer';
        container.className = 'toast-container position-fixed bottom-0 end-0 p-3';
        document.body.appendChild(container);
        return container;
    }

    // Authentication
    getAuthToken() {
        return localStorage.getItem('authToken');
    }
}

// Add CSS for loading states
const style = document.createElement('style');
style.textContent = `
    .loading-spinner {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        z-index: 1000;
    }

    .visualization-card.loading {
        position: relative;
    }

    .visualization-card.loading::after {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(255, 255, 255, 0.7);
        z-index: 999;
    }

    .toast-container {
        z-index: 1100;
    }
`;
document.head.appendChild(style);

// Initialize when document is ready
document.addEventListener('DOMContentLoaded', () => {
    window.apiService = new ApiService();
});
