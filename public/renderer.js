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
            this.addLog(`サーバー状態が変更されました: ${status.running ? '実行中' : '停止中'}`);
        });

        // Listen for server errors
        window.electronAPI.onServerError((event, error) => {
            this.addLog(`エラー: ${error}`, 'error');
            this.updateUI({ running: false });
        });
    }

    async updateServerStatus() {
        try {
            const status = await window.electronAPI.getServerStatus();
            this.updateUI(status);
        } catch (error) {
            console.error('Failed to get server status:', error);
            this.addLog(`状態取得エラー: ${error.message}`, 'error');
        }
    }

    updateUI(status) {
        if (status.running) {
            this.statusDot.className = 'status-dot running';
            this.statusText.textContent = '実行中';
            this.serverPort.textContent = status.port;
            this.serverEndpoint.textContent = status.endpoint;
            this.mcpEndpoint.textContent = status.endpoint;
            
            this.restartBtn.disabled = false;
            this.stopBtn.disabled = false;
            this.openHealthBtn.disabled = false;
        } else {
            this.statusDot.className = 'status-dot stopped';
            this.statusText.textContent = '停止中';
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
            this.statusText.textContent = '再起動中...';
            this.restartBtn.disabled = true;
            
            this.addLog('サーバーを再起動しています...');
            
            const result = await window.electronAPI.restartServer();
            
            if (result.success) {
                this.addLog('サーバーが正常に再起動されました', 'success');
            } else {
                this.addLog(`再起動失敗: ${result.error}`, 'error');
            }
        } catch (error) {
            this.addLog(`再起動エラー: ${error.message}`, 'error');
        } finally {
            this.restartBtn.disabled = false;
            await this.updateServerStatus();
        }
    }

    async stopServer() {
        try {
            this.statusDot.className = 'status-dot loading';
            this.statusText.textContent = '停止中...';
            this.stopBtn.disabled = true;
            
            this.addLog('サーバーを停止しています...');
            
            const result = await window.electronAPI.stopServer();
            
            if (result.success) {
                this.addLog('サーバーが正常に停止されました', 'success');
            } else {
                this.addLog(`停止失敗: ${result.error}`, 'error');
            }
        } catch (error) {
            this.addLog(`停止エラー: ${error.message}`, 'error');
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
            this.addLog('ヘルスチェックページを開きました');
        } catch (error) {
            this.addLog(`ヘルスチェック開始エラー: ${error.message}`, 'error');
            console.error('OpenHealthCheck error:', error);
        }
    }

    addLog(message, type = 'info') {
        const timestamp = new Date().toLocaleTimeString('ja-JP');
        const logClass = type === 'error' ? 'error' : type === 'success' ? 'success' : 'info';
        const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️';
        
        const logEntry = `[${timestamp}] ${prefix} ${message}\n`;
        this.logs.textContent += logEntry;
        this.logs.scrollTop = this.logs.scrollHeight;
    }

    clearLogs() {
        this.logs.textContent = '';
        this.addLog('ログをクリアしました');
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
            feedback.textContent = 'コピーしました！';
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

// Initialize the UI when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Check if electronAPI is available
    if (typeof window.electronAPI === 'undefined') {
        console.error('electronAPI is not available. Preload script may have failed to load.');
        document.body.innerHTML = `
            <div style="padding: 20px; text-align: center; color: red;">
                <h2>アプリケーション初期化エラー</h2>
                <p>electronAPIが利用できません。アプリケーションを再起動してください。</p>
                <button onclick="location.reload()">再読み込み</button>
            </div>
        `;
        return;
    }
    
    console.log('electronAPI is available, initializing UI...');
    new MCPServerUI();
});