// Audio Processor Web Interface JavaScript

const API_BASE = window.location.origin;
let API_KEY = localStorage.getItem('audioProcessorApiKey') || '';

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    // Load API key from storage
    if (API_KEY) {
        document.getElementById('apiKey').value = API_KEY;
        showStatus('apiKeyStatus', 'API key loaded from storage', 'success');
    }

    // Load initial data
    loadJobs();
    loadStats();
    loadHealth();

    // Set up auto-refresh
    setInterval(loadJobs, 10000); // Refresh jobs every 10 seconds
    setInterval(loadStats, 30000); // Refresh stats every 30 seconds
});

// Save API key
function saveApiKey() {
    const apiKey = document.getElementById('apiKey').value;
    if (!apiKey) {
        showStatus('apiKeyStatus', 'Please enter an API key', 'error');
        return;
    }

    API_KEY = apiKey;
    localStorage.setItem('audioProcessorApiKey', apiKey);
    showStatus('apiKeyStatus', 'API key saved successfully', 'success');
}

// Submit download form
async function submitDownload(event) {
    event.preventDefault();

    if (!API_KEY) {
        showStatus('downloadStatus', 'Please configure your API key first', 'error');
        return;
    }

    const url = document.getElementById('url').value;
    const sourceType = document.getElementById('sourceType').value;
    const downloadType = document.getElementById('downloadType').value;

    showStatus('downloadStatus', 'Submitting download...', 'info');

    try {
        const response = await fetch(`${API_BASE}/api/v1/download`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': API_KEY
            },
            body: JSON.stringify({
                url: url,
                source_type: sourceType,
                download_type: downloadType
            })
        });

        const data = await response.json();

        if (response.ok) {
            showStatus('downloadStatus', `Download queued successfully! Job ID: ${data.job_id}`, 'success');
            document.getElementById('downloadForm').reset();
            loadJobs(); // Refresh jobs list
        } else {
            showStatus('downloadStatus', `Error: ${data.detail || 'Failed to submit download'}`, 'error');
        }
    } catch (error) {
        showStatus('downloadStatus', `Network error: ${error.message}`, 'error');
    }
}

// Load jobs list
async function loadJobs() {
    if (!API_KEY) return;

    const statusFilter = document.getElementById('statusFilter').value;
    const queryParams = statusFilter ? `?status_filter=${statusFilter}` : '';

    try {
        const response = await fetch(`${API_BASE}/api/v1/jobs${queryParams}`, {
            headers: {
                'X-API-Key': API_KEY
            }
        });

        if (response.ok) {
            const data = await response.json();
            displayJobs(data.jobs);
        } else {
            document.getElementById('jobsList').innerHTML = '<p class="error">Failed to load jobs</p>';
        }
    } catch (error) {
        document.getElementById('jobsList').innerHTML = `<p class="error">Error: ${error.message}</p>`;
    }
}

// Display jobs in the UI
function displayJobs(jobs) {
    const container = document.getElementById('jobsList');

    if (!jobs || jobs.length === 0) {
        container.innerHTML = '<p class="loading">No jobs found</p>';
        return;
    }

    container.innerHTML = jobs.map(job => `
        <div class="job-card">
            <div class="job-header">
                <div class="job-title">${job.metadata.title || 'Untitled'}</div>
                <span class="job-status ${job.status}">${job.status}</span>
            </div>
            <div class="job-meta">
                <div><strong>Artist:</strong> ${job.metadata.artist || 'Unknown'}</div>
                <div><strong>Source:</strong> ${job.source_type} (${job.download_type})</div>
                <div><strong>Created:</strong> ${new Date(job.timestamps.created_at).toLocaleString()}</div>
                <div><strong>Job ID:</strong> ${job.id}</div>
            </div>
            ${job.progress.total_items > 0 ? `
            <div class="job-progress">
                <div class="job-progress-bar" style="width: ${job.progress.percent}%"></div>
            </div>
            <div style="font-size: 0.9em; margin-top: 5px; color: #7f8c8d;">
                Progress: ${job.progress.completed_items}/${job.progress.total_items} (${job.progress.percent}%)
            </div>
            ` : ''}
            ${job.error_message ? `
            <div class="status-message error show" style="margin-top: 10px;">
                ${job.error_message}
            </div>
            ` : ''}
        </div>
    `).join('');
}

// Load statistics
async function loadStats() {
    if (!API_KEY) return;

    try {
        const response = await fetch(`${API_BASE}/api/v1/stats`, {
            headers: {
                'X-API-Key': API_KEY
            }
        });

        if (response.ok) {
            const data = await response.json();
            displayStats(data);
        }
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

// Display statistics
function displayStats(data) {
    const container = document.getElementById('stats');

    const userStats = data.user_stats || {};
    const storage = data.storage || {};

    container.innerHTML = `
        <div class="stat-card">
            <div class="stat-value">${userStats.jobs?.total || 0}</div>
            <div class="stat-label">Total Jobs</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">${userStats.jobs?.completed || 0}</div>
            <div class="stat-label">Completed</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">${userStats.tracks?.total || 0}</div>
            <div class="stat-label">Tracks Processed</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">${storage.used_gb || 0} GB</div>
            <div class="stat-label">Storage Used</div>
        </div>
    `;
}

// Load health status
async function loadHealth() {
    try {
        const response = await fetch(`${API_BASE}/api/v1/health/detailed`);

        if (response.ok) {
            const data = await response.json();
            displayHealth(data);
        }
    } catch (error) {
        document.getElementById('health').innerHTML = '<p class="error">Failed to load health status</p>';
    }
}

// Display health status
function displayHealth(data) {
    const container = document.getElementById('health');

    const components = data.components || {};

    container.innerHTML = Object.entries(components).map(([name, info]) => `
        <div class="health-component">
            <span class="health-component-name">${name.charAt(0).toUpperCase() + name.slice(1)}</span>
            <span class="health-component-status ${info.status}">${info.status}</span>
        </div>
    `).join('');
}

// Show status message
function showStatus(elementId, message, type) {
    const element = document.getElementById(elementId);
    element.textContent = message;
    element.className = `status-message ${type} show`;

    setTimeout(() => {
        element.classList.remove('show');
    }, 5000);
}
