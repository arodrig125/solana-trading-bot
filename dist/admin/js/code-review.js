document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/admin/login.html';
        return;
    }

    // Elements
    const fileBrowser = document.getElementById('fileBrowser');
    const codeContent = document.getElementById('codeContent');
    const currentFile = document.getElementById('currentFile');
    const currentUser = document.getElementById('currentUser');
    const fixModal = document.getElementById('fixModal');
    const fixForm = document.getElementById('fixForm');
    const errorReports = document.getElementById('errorReports');
    
    // Buttons
    const submitFixBtn = document.getElementById('submitFixBtn');
    const cancelFixBtn = document.getElementById('cancelFixBtn');
    const runTestsBtn = document.getElementById('runTestsBtn');
    const securityScanBtn = document.getElementById('securityScanBtn');
    const refreshScanBtn = document.getElementById('refreshScanBtn');
    const logoutBtn = document.getElementById('logoutBtn');

    let selectedFilePath = null;

    // Load files
    async function loadFiles() {
        try {
            const response = await fetch('/api/code-review/files', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            
            if (response.ok) {
                renderFileTree(data.files);
            } else {
                console.error('Failed to load files:', data.error);
            }
        } catch (error) {
            console.error('Error loading files:', error);
        }
    }

    // Render file tree
    function renderFileTree(files) {
        const tree = document.createElement('div');
        tree.className = 'space-y-2';
        
        files.sort().forEach(file => {
            const fileItem = document.createElement('div');
            fileItem.className = 'flex items-center space-x-2 p-2 hover:bg-gray-100 rounded cursor-pointer';
            
            const icon = document.createElement('i');
            icon.className = 'fas fa-file-code text-gray-500';
            
            const name = document.createElement('span');
            name.textContent = file.split('/').pop();
            name.className = 'text-sm';
            
            fileItem.appendChild(icon);
            fileItem.appendChild(name);
            
            fileItem.addEventListener('click', () => loadFileContent(file));
            
            tree.appendChild(fileItem);
        });
        
        fileBrowser.innerHTML = '';
        fileBrowser.appendChild(tree);
    }

    // Load file content
    async function loadFileContent(filePath) {
        try {
            const response = await fetch(`/api/code-review/file/${filePath}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            
            if (response.ok) {
                selectedFilePath = filePath;
                currentFile.textContent = filePath;
                codeContent.textContent = data.content;
                Prism.highlightElement(codeContent);
            } else {
                console.error('Failed to load file:', data.error);
            }
        } catch (error) {
            console.error('Error loading file:', error);
        }
    }

    // Load error reports
    async function loadErrorReports() {
        try {
            const response = await fetch('/api/code-review/errors', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            
            if (response.ok) {
                renderErrorReports(data.errors);
            } else {
                console.error('Failed to load error reports:', data.error);
            }
        } catch (error) {
            console.error('Error loading error reports:', error);
        }
    }

    // Render error reports
    function renderErrorReports(errors) {
        errorReports.innerHTML = '';
        
        if (errors.length === 0) {
            errorReports.innerHTML = '<p class="text-gray-500">No error reports found.</p>';
            return;
        }
        
        const list = document.createElement('div');
        list.className = 'space-y-4';
        
        errors.forEach(error => {
            const item = document.createElement('div');
            item.className = 'p-3 bg-red-50 border border-red-200 rounded';
            
            const header = document.createElement('div');
            header.className = 'flex justify-between items-center mb-2';
            
            const title = document.createElement('h4');
            title.className = 'font-medium text-red-800';
            title.textContent = error.message;
            
            const time = document.createElement('span');
            time.className = 'text-sm text-gray-500';
            time.textContent = new Date(error.timestamp).toLocaleString();
            
            header.appendChild(title);
            header.appendChild(time);
            
            const details = document.createElement('pre');
            details.className = 'text-sm text-red-600 font-mono';
            details.textContent = error.details;
            
            item.appendChild(header);
            item.appendChild(details);
            
            list.appendChild(item);
        });
        
        errorReports.appendChild(list);
    }

    // Submit fix handlers
    submitFixBtn.addEventListener('click', () => {
        if (!selectedFilePath) {
            alert('Please select a file first');
            return;
        }
        fixModal.classList.remove('hidden');
    });

    cancelFixBtn.addEventListener('click', () => {
        fixModal.classList.add('hidden');
        fixForm.reset();
    });

    fixForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const fix = {
            filePath: selectedFilePath,
            description: document.getElementById('fixDescription').value,
            suggestedFix: document.getElementById('suggestedFix').value,
            lineNumbers: document.getElementById('lineNumbers').value
        };
        
        try {
            const response = await fetch('/api/code-review/fix', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(fix)
            });
            
            const data = await response.json();
            
            if (response.ok) {
                alert('Fix submitted successfully!');
                fixModal.classList.add('hidden');
                fixForm.reset();
            } else {
                alert(`Failed to submit fix: ${data.error}`);
            }
        } catch (error) {
            console.error('Error submitting fix:', error);
            alert('Failed to submit fix. Please try again.');
        }
    });

    // Run tests handler
    runTestsBtn.addEventListener('click', async () => {
        if (!selectedFilePath) {
            alert('Please select a file first');
            return;
        }
        
        try {
            const response = await fetch('/api/code-review/run-tests', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ filePath: selectedFilePath })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                alert(`Tests completed: ${data.passed} passed, ${data.failed} failed`);
            } else {
                alert(`Failed to run tests: ${data.error}`);
            }
        } catch (error) {
            console.error('Error running tests:', error);
            alert('Failed to run tests. Please try again.');
        }
    });

    // Logout handler
    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('token');
        window.location.href = '/admin/login.html';
    });

    // Security scan handlers
    securityScanBtn.addEventListener('click', () => {
        if (!selectedFilePath) {
            alert('Please select a file first');
            return;
        }
        window.SecurityScanner.runScan();
    });

    refreshScanBtn.addEventListener('click', () => {
        window.SecurityScanner.runScan();
    });

    // Initialize
    loadFiles();
    loadErrorReports();
    window.SecurityScanner.runScan(); // Initial security scan
    
    // Load user info
    fetch('/api/users/me', {
        headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(response => response.json())
    .then(data => {
        if (data.username) {
            currentUser.textContent = `${data.username} (${data.role})`;
        }
    })
    .catch(console.error);
});
