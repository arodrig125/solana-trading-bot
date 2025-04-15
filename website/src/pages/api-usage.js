// API Usage Analytics JS
window.renderApiUsageCharts = async function() {
  // Show loading spinners or overlays
  const endpointCanvas = document.getElementById('api-usage-endpoint');
  const errorsCanvas = document.getElementById('api-usage-errors');
  const ratelimitCanvas = document.getElementById('api-usage-ratelimit');

  // Optionally clear previous charts
  if (endpointCanvas._chart) endpointCanvas._chart.destroy();
  if (errorsCanvas._chart) errorsCanvas._chart.destroy();
  if (ratelimitCanvas._chart) ratelimitCanvas._chart.destroy();

  // Show loading overlays
  [endpointCanvas, errorsCanvas, ratelimitCanvas].forEach(c => {
    const ctx = c.getContext('2d');
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.font = '16px Poppins, sans-serif';
    ctx.fillStyle = '#888';
    ctx.textAlign = 'center';
    ctx.fillText('Loading...', c.width/2, c.height/2);
  });

  try {
    const res = await fetch('/api/usage/stats', {
      headers: { 'Authorization': localStorage.jwt ? `Bearer ${localStorage.jwt}` : '' }
    });
    if (!res.ok) throw new Error('Failed to fetch API usage stats');
    const data = await res.json();
    const { endpoints, counts, errors, rateLimits } = data;

    // Requests by endpoint
    endpointCanvas._chart = new Chart(endpointCanvas.getContext('2d'), {
      type: 'bar',
      data: {
        labels: endpoints,
        datasets: [{
          label: 'Requests',
          data: counts,
          backgroundColor: '#6366f1',
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, title: { display: true, text: 'Requests' } }
        }
      }
    });
    // Errors by endpoint
    errorsCanvas._chart = new Chart(errorsCanvas.getContext('2d'), {
      type: 'bar',
      data: {
        labels: endpoints,
        datasets: [{
          label: 'Errors',
          data: errors,
          backgroundColor: '#ef4444',
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, title: { display: true, text: 'Errors' } }
        }
      }
    });
    // Rate limit violations
    ratelimitCanvas._chart = new Chart(ratelimitCanvas.getContext('2d'), {
      type: 'bar',
      data: {
        labels: endpoints,
        datasets: [{
          label: 'Rate Limit Violations',
          data: rateLimits,
          backgroundColor: '#f59e42',
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, title: { display: true, text: 'Violations' } }
        }
      }
    });
  } catch (err) {
    [endpointCanvas, errorsCanvas, ratelimitCanvas].forEach(c => {
      const ctx = c.getContext('2d');
      ctx.clearRect(0, 0, c.width, c.height);
      ctx.fillStyle = '#ef4444';
      ctx.font = '16px Poppins, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Error loading data', c.width/2, c.height/2);
    });
    console.error('API Usage Analytics error:', err);
  }
};
