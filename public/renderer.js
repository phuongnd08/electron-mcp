class MCPServerUI {
    constructor() {
        this.statusDot = document.getElementById('status-dot');
        this.statusText = document.getElementById('status-text');
        this.serverPort = document.getElementById('server-port');
        this.serverEndpoint = document.getElementById('server-endpoint');
        this.mcpEndpoint = document.getElementById('mcp-endpoint');
        this.logs = document.getElementById('logs');
        
        this.restartBtn = document.getElementById('restart-btn');
        this.stopBtn = document.getElementById('stop-btn');
        this.openHealthBtn = document.getElementById('open-health-btn');
        this.clearLogsBtn = document.getElementById('clear-logs-btn');
        
        this.setupEventListeners();
        this.updateServerStatus();
        
        // Start status update interval
        setInterval(() => this.updateServerStatus(), 5000);
    }

    setupEventListeners() {
        this.restartBtn.addEventListener('click', () => this.restartServer());
        this.stopBtn.addEventListener('click', () => this.stopServer());
        this.openHealthBtn.addEventListener('click', () => this.openHealthCheck());
        this.clearLogsBtn.addEventListener('click', () => this.clearLogs());

        // Listen for server status changes
        window.electronAPI.onServerStatusChanged((event, status) => {
            this.updateUI(status);
            this.addLog(`Server status changed: ${status.running ? 'Running' : 'Stopped'}`);
        });

        // Listen for server errors
        window.electronAPI.onServerError((event, error) => {
            this.addLog(`Error: ${error}`, 'error');
            this.updateUI({ running: false });
        });
    }

    async updateServerStatus() {
        try {
            const status = await window.electronAPI.getServerStatus();
            this.updateUI(status);
        } catch (error) {
            console.error('Failed to get server status:', error);
            this.addLog(`Status fetch error: ${error.message}`, 'error');
        }
    }

    updateUI(status) {
        if (status.running) {
            this.statusDot.className = 'status-dot running';
            this.statusText.textContent = 'Running';
            this.serverPort.textContent = status.port;
            this.serverEndpoint.textContent = status.endpoint;
            this.mcpEndpoint.textContent = status.endpoint;
            
            this.restartBtn.disabled = false;
            this.stopBtn.disabled = false;
            this.openHealthBtn.disabled = false;
        } else {
            this.statusDot.className = 'status-dot stopped';
            this.statusText.textContent = 'Stopped';
            this.serverPort.textContent = '-';
            this.serverEndpoint.textContent = '-';
            this.mcpEndpoint.textContent = 'http://localhost:3999/mcp';
            
            this.restartBtn.disabled = false;
            this.stopBtn.disabled = true;
            this.openHealthBtn.disabled = true;
        }
    }

    async restartServer() {
        try {
            this.statusDot.className = 'status-dot loading';
            this.statusText.textContent = 'Restarting...';
            this.restartBtn.disabled = true;
            
            this.addLog('Restarting server...');
            
            const result = await window.electronAPI.restartServer();
            
            if (result.success) {
                this.addLog('Server restarted successfully', 'success');
            } else {
                this.addLog(`Restart failed: ${result.error}`, 'error');
            }
        } catch (error) {
            this.addLog(`Restart error: ${error.message}`, 'error');
        } finally {
            this.restartBtn.disabled = false;
            await this.updateServerStatus();
        }
    }

    async stopServer() {
        try {
            this.statusDot.className = 'status-dot loading';
            this.statusText.textContent = 'Stopping...';
            this.stopBtn.disabled = true;
            
            this.addLog('Stopping server...');
            
            const result = await window.electronAPI.stopServer();
            
            if (result.success) {
                this.addLog('Server stopped successfully', 'success');
            } else {
                this.addLog(`Stop failed: ${result.error}`, 'error');
            }
        } catch (error) {
            this.addLog(`Stop error: ${error.message}`, 'error');
        } finally {
            this.stopBtn.disabled = false;
            await this.updateServerStatus();
        }
    }

    async openHealthCheck() {
        try {
            if (!window.electronAPI || !window.electronAPI.openEndpoint) {
                throw new Error('electronAPI is not available. Please reload the application.');
            }
            await window.electronAPI.openEndpoint();
            this.addLog('Opened health check page');
        } catch (error) {
            this.addLog(`Health check open error: ${error.message}`, 'error');
            console.error('OpenHealthCheck error:', error);
        }
    }

    addLog(message, type = 'info') {
        const timestamp = new Date().toLocaleTimeString('en-US');
        const logClass = type === 'error' ? 'error' : type === 'success' ? 'success' : 'info';
        const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️';
        
        const logEntry = `[${timestamp}] ${prefix} ${message}\n`;
        this.logs.textContent += logEntry;
        this.logs.scrollTop = this.logs.scrollHeight;
    }

    clearLogs() {
        this.logs.textContent = '';
        this.addLog('Logs cleared');
    }
}

// Utility function for copying text to clipboard
function copyToClipboard(elementIdOrElement) {
    let text;
    
    if (typeof elementIdOrElement === 'string') {
        const element = document.getElementById(elementIdOrElement);
        text = element.textContent;
    } else {
        text = elementIdOrElement.textContent;
    }
    
    navigator.clipboard.writeText(text).then(() => {
        // Show a temporary feedback
        const originalText = elementIdOrElement.textContent || '';
        const element = typeof elementIdOrElement === 'string' ? 
            document.getElementById(elementIdOrElement) : elementIdOrElement;
        
        if (element) {
            const feedback = document.createElement('span');
            feedback.textContent = 'Copied!';
            feedback.style.color = '#10b981';
            feedback.style.fontWeight = 'bold';
            
            element.appendChild(feedback);
            setTimeout(() => {
                feedback.remove();
            }, 2000);
        }
    }).catch(err => {
        console.error('Failed to copy text: ', err);
    });
}

// Wait for electronAPI to be available
function waitForElectronAPI() {
    return new Promise((resolve, reject) => {
        if (window.electronAPI) {
            resolve();
            return;
        }
        
        let attempts = 0;
        const maxAttempts = 50; // 5 seconds of attempts
        
        const checkAPI = () => {
            attempts++;
            if (window.electronAPI) {
                console.log('electronAPI is now available');
                resolve();
            } else if (attempts >= maxAttempts) {
                console.error('electronAPI failed to load after maximum attempts');
                reject(new Error('electronAPI is not available'));
            } else {
                setTimeout(checkAPI, 100);
            }
        };
        
        setTimeout(checkAPI, 100);
    });
}

// Initialize the UI when the DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await waitForElectronAPI();
        console.log('electronAPI is available, initializing UI...');
        new MCPServerUI();
    } catch (error) {
        console.error('Failed to initialize:', error);
        document.body.innerHTML = `
            <div style="padding: 20px; text-align: center; color: red;">
                <h2>Application Initialization Error</h2>
                <p>electronAPI is not available. Please restart the application.</p>
                <button onclick="location.reload()">Reload</button>
                <div style="margin-top: 10px; font-size: 0.9em; color: #666;">
                    Error: ${error.message}
                </div>
            </div>
        `;
    }
});