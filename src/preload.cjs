const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
try {
  contextBridge.exposeInMainWorld('electronAPI', {
    // Server control methods
    getServerStatus: () => ipcRenderer.invoke('get-server-status'),
    restartServer: () => ipcRenderer.invoke('restart-server'),
    stopServer: () => ipcRenderer.invoke('stop-server'),
    openEndpoint: () => ipcRenderer.invoke('open-endpoint'),

    // Event listeners
    onServerStatusChanged: (callback) => {
      ipcRenderer.on('server-status-changed', callback);
    },
    onServerError: (callback) => {
      ipcRenderer.on('server-error', callback);
    },

    // Remove listeners
    removeAllListeners: (channel) => {
      ipcRenderer.removeAllListeners(channel);
    },
  });
  
  console.log('Preload script loaded successfully');
} catch (error) {
  console.error('Failed to expose electronAPI:', error);
}