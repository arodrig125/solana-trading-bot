// Initialize API client
window.solarbotApi = new SolarbotApi({
  baseUrl: '[https://your-digital-ocean-api.com/api'](https://your-digital-ocean-api.com/api')
});

// Load auth token from storage
const token = localStorage.getItem('authToken');
if (token) {
  window.solarbotApi.setAuthToken(token);
}
