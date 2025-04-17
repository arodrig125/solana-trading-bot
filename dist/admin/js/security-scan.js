// Security Scan functionality
async function runSecurityScan() {
    try {
        const response = await fetch('/api/security-scan/scan', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        
        if (response.ok) {
            updateSecurityUI(data);
        } else {
            console.error('Failed to run security scan:', data.error);
            alert('Failed to run security scan. Please try again.');
        }
    } catch (error) {
        console.error('Error running security scan:', error);
        alert('Failed to run security scan. Please try again.');
    }
}

function updateSecurityUI(data) {
    // Update security score
    const scoreElement = document.getElementById('securityScore');
    scoreElement.textContent = `Score: ${data.score}`;
    scoreElement.className = getScoreColorClass(data.score);

    // Update risk counts
    document.getElementById('highRiskCount').textContent = data.summary.high;
    document.getElementById('moderateRiskCount').textContent = data.summary.moderate;
    document.getElementById('lowRiskCount').textContent = data.summary.low;

    // Update issues list
    const issuesContainer = document.getElementById('securityIssues');
    issuesContainer.innerHTML = '';

    data.issues.forEach(issue => {
        const issueElement = createIssueElement(issue);
        issuesContainer.appendChild(issueElement);
    });
}

function getScoreColorClass(score) {
    const baseClasses = 'text-2xl font-bold';
    if (score >= 90) return `${baseClasses} text-green-600`;
    if (score >= 70) return `${baseClasses} text-yellow-600`;
    return `${baseClasses} text-red-600`;
}

function createIssueElement(issue) {
    const element = document.createElement('div');
    element.className = `p-4 rounded ${getIssueBgClass(issue.risk)}`;

    const header = document.createElement('div');
    header.className = 'flex justify-between items-start mb-2';

    const title = document.createElement('div');
    title.className = 'font-medium';
    title.innerHTML = `<i class="${getIssueIcon(issue.risk)}"></i> ${issue.description}`;

    const risk = document.createElement('span');
    risk.className = getRiskBadgeClass(issue.risk);
    risk.textContent = issue.risk.toUpperCase();

    header.appendChild(title);
    header.appendChild(risk);
    element.appendChild(header);

    if (issue.file) {
        const location = document.createElement('div');
        location.className = 'text-sm text-gray-600 mt-1';
        location.textContent = `File: ${issue.file}${issue.line ? ` (line ${issue.line})` : ''}`;
        element.appendChild(location);
    }

    if (issue.snippet) {
        const snippet = document.createElement('pre');
        snippet.className = 'mt-2 p-2 bg-gray-800 text-white rounded text-sm overflow-x-auto';
        snippet.textContent = issue.snippet;
        element.appendChild(snippet);
    }

    if (issue.recommendation) {
        const recommendation = document.createElement('div');
        recommendation.className = 'mt-2 text-sm text-green-600';
        recommendation.innerHTML = `<i class="fas fa-lightbulb"></i> ${issue.recommendation}`;
        element.appendChild(recommendation);
    }

    return element;
}

function getIssueBgClass(risk) {
    switch (risk.toLowerCase()) {
        case 'high': return 'bg-red-50';
        case 'moderate': return 'bg-yellow-50';
        case 'low': return 'bg-blue-50';
        default: return 'bg-gray-50';
    }
}

function getRiskBadgeClass(risk) {
    const baseClasses = 'text-xs font-medium px-2 py-1 rounded';
    switch (risk.toLowerCase()) {
        case 'high': return `${baseClasses} bg-red-100 text-red-800`;
        case 'moderate': return `${baseClasses} bg-yellow-100 text-yellow-800`;
        case 'low': return `${baseClasses} bg-blue-100 text-blue-800`;
        default: return `${baseClasses} bg-gray-100 text-gray-800`;
    }
}

function getIssueIcon(risk) {
    switch (risk.toLowerCase()) {
        case 'high': return 'fas fa-exclamation-circle text-red-500';
        case 'moderate': return 'fas fa-exclamation-triangle text-yellow-500';
        case 'low': return 'fas fa-info-circle text-blue-500';
        default: return 'fas fa-circle text-gray-500';
    }
}

// Export functions for use in code-review.js
window.SecurityScanner = {
    runScan: runSecurityScan,
    updateUI: updateSecurityUI
};
