// Security Report UI functionality
function updateSecurityReport(data) {
    updateTrends(data.report.trends);
    updateRecommendations(data.report.recommendations);
}

function updateTrends(trends) {
    // Update score history chart
    const ctx = document.getElementById('scoreHistory').getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: trends.scoreHistory.map(h => new Date(h.timestamp).toLocaleDateString()),
            datasets: [{
                label: 'Security Score',
                data: trends.scoreHistory.map(h => h.score),
                borderColor: 'rgb(75, 192, 192)',
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100
                }
            }
        }
    });

    // Update issue count history
    const issueCtx = document.getElementById('issueHistory').getContext('2d');
    new Chart(issueCtx, {
        type: 'bar',
        data: {
            labels: trends.issueCountHistory.map(h => new Date(h.timestamp).toLocaleDateString()),
            datasets: [
                {
                    label: 'High',
                    data: trends.issueCountHistory.map(h => h.high),
                    backgroundColor: 'rgb(255, 99, 132)'
                },
                {
                    label: 'Moderate',
                    data: trends.issueCountHistory.map(h => h.moderate),
                    backgroundColor: 'rgb(255, 205, 86)'
                },
                {
                    label: 'Low',
                    data: trends.issueCountHistory.map(h => h.low),
                    backgroundColor: 'rgb(75, 192, 192)'
                }
            ]
        },
        options: {
            responsive: true,
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

    // Update issue summary
    document.getElementById('resolvedIssues').textContent = trends.resolvedIssues;
    document.getElementById('newIssues').textContent = trends.newIssues;

    // Update most frequent issues
    const frequentList = document.getElementById('frequentIssues');
    frequentList.innerHTML = '';
    trends.mostFrequentIssues.forEach(issue => {
        const li = document.createElement('li');
        li.className = 'py-2';
        li.innerHTML = `
            <div class="flex justify-between">
                <span class="font-medium">${formatIssueType(issue.type)}</span>
                <span class="text-gray-600">${issue.count} occurrences</span>
            </div>
        `;
        frequentList.appendChild(li);
    });
}

function updateRecommendations(recommendations) {
    const container = document.getElementById('recommendations');
    container.innerHTML = '';

    recommendations.forEach(rec => {
        const card = document.createElement('div');
        card.className = 'bg-white rounded-lg shadow mb-4 p-4';
        
        const header = document.createElement('div');
        header.className = 'flex justify-between items-center mb-2';
        header.innerHTML = `
            <h3 class="text-lg font-semibold">${formatIssueType(rec.type)}</h3>
            <span class="px-2 py-1 rounded text-sm ${getPriorityClass(rec.priority)}">
                Priority ${rec.priority}
            </span>
        `;

        const description = document.createElement('p');
        description.className = 'text-gray-600 mb-4';
        description.textContent = rec.description;

        const examples = document.createElement('div');
        examples.className = 'space-y-2';
        examples.innerHTML = `
            <div class="text-sm font-medium">Examples (${rec.count} total occurrences):</div>
            ${rec.examples.map(ex => `
                <div class="bg-gray-50 p-2 rounded">
                    <div class="text-sm text-gray-600">File: ${ex.file}:${ex.line}</div>
                    <pre class="mt-1 text-sm bg-gray-800 text-white p-2 rounded overflow-x-auto">${ex.snippet}</pre>
                </div>
            `).join('')}
        `;

        if (rec.suggestedFix) {
            const fix = document.createElement('div');
            fix.className = 'mt-4 bg-green-50 p-3 rounded';
            fix.innerHTML = `
                <div class="text-sm font-medium text-green-800">Suggested Fix:</div>
                <div class="mt-2 space-y-2">
                    <div class="bg-red-50 p-2 rounded">
                        <div class="text-sm text-red-600">Before:</div>
                        <pre class="mt-1 text-sm font-mono">${rec.suggestedFix.before}</pre>
                    </div>
                    <div class="bg-green-50 p-2 rounded">
                        <div class="text-sm text-green-600">After:</div>
                        <pre class="mt-1 text-sm font-mono">${rec.suggestedFix.after}</pre>
                    </div>
                </div>
            `;
            examples.appendChild(fix);
        }

        card.appendChild(header);
        card.appendChild(description);
        card.appendChild(examples);
        container.appendChild(card);
    });
}

function formatIssueType(type) {
    return type
        .split(/(?=[A-Z])|_/)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
}

function getPriorityClass(priority) {
    const classes = {
        5: 'bg-red-100 text-red-800',
        4: 'bg-orange-100 text-orange-800',
        3: 'bg-yellow-100 text-yellow-800',
        2: 'bg-blue-100 text-blue-800',
        1: 'bg-gray-100 text-gray-800'
    };
    return classes[priority] || classes[1];
}

// Schedule management
async function updateScanSchedule() {
    try {
        const response = await fetch('/api/security-scan/schedule', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const schedule = await response.json();

        if (schedule.frequency) {
            document.getElementById('scheduleStatus').textContent = 
                `Scheduled: ${schedule.frequency} at ${schedule.time}`;
        } else {
            document.getElementById('scheduleStatus').textContent = 'No scan scheduled';
        }
    } catch (error) {
        console.error('Error fetching schedule:', error);
    }
}

async function scheduleScans() {
    const frequency = document.getElementById('scanFrequency').value;
    const time = document.getElementById('scanTime').value;

    try {
        const response = await fetch('/api/security-scan/schedule', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ frequency, time })
        });

        if (response.ok) {
            await updateScanSchedule();
            alert('Scan schedule updated successfully');
        } else {
            const data = await response.json();
            alert(`Failed to update schedule: ${data.error}`);
        }
    } catch (error) {
        console.error('Error scheduling scan:', error);
        alert('Failed to update scan schedule');
    }
}

// Export functionality
async function exportBatch() {
    try {
        const startDate = document.getElementById('exportStartDate').value;
        const endDate = document.getElementById('exportEndDate').value;
        const format = document.getElementById('exportFormat').value;

        if (!startDate || !endDate) {
            alert('Please select both start and end dates');
            return;
        }

        const response = await fetch('/api/security-scan/export/batch', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ startDate, endDate, format })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Batch export failed');
        }

        // Get filename from Content-Disposition header
        const disposition = response.headers.get('Content-Disposition');
        const filenameMatch = disposition && disposition.match(/filename=(.+)/);
        const filename = filenameMatch ? filenameMatch[1] : 'security-reports.zip';

        // Create blob and download
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Batch export error:', error);
        alert(`Failed to export reports: ${error.message}`);
    }
}

async function exportReport(format) {
    try {
        const response = await fetch(`/api/security-scan/export/${format}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Export failed');
        }

        // Get filename from Content-Disposition header
        const disposition = response.headers.get('Content-Disposition');
        const filenameMatch = disposition && disposition.match(/filename=(.+)/);
        const filename = filenameMatch ? filenameMatch[1] : `security-report.${format}`;

        // Create blob and download
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Export error:', error);
        alert(`Failed to export report: ${error.message}`);
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    updateScanSchedule();
});

// Add Alpine.js for dropdown functionality
if (typeof Alpine === 'undefined') {
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/alpinejs@3.x.x/dist/cdn.min.js';
    script.defer = true;
    document.head.appendChild(script);
}
