import { app, BrowserWindow, ipcMain, Menu, Tray, shell } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import ElectronMCPServer from './mcp-server.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class ElectronMCPApp {
  constructor() {
    this.mainWindow = null;
    this.mcpServer = null;
    this.tray = null;
    this.serverPort = process.env.MCP_PORT || 3999;
    
    this.setupEventHandlers();
  }

  setupEventHandlers() {
    app.whenReady().then(() => {
      this.createWindow();
      // this.createTray();
      this.startMCPServer();
    });

    app.on('window-all-closed', () => {
      if (process.platform !== 'darwin') {
        this.cleanup();
      }
    });

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        this.createWindow();
      }
    });

    app.on('before-quit', () => {
      this.cleanup();
    });

    // IPC handlers
    ipcMain.handle('get-server-status', () => {
      return this.mcpServer ? this.mcpServer.getStatus() : { running: false };
    });

    ipcMain.handle('restart-server', async () => {
      try {
        if (this.mcpServer) {
          await this.mcpServer.stop();
        }
        await this.startMCPServer();
        return { success: true };
      } catch (error) {
        console.error('Failed to restart server:', error);
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle('stop-server', async () => {
      try {
        if (this.mcpServer) {
          await this.mcpServer.stop();
          this.mcpServer = null;
        }
        return { success: true };
      } catch (error) {
        console.error('Failed to stop server:', error);
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle('open-endpoint', () => {
      shell.openExternal(`http://localhost:${this.serverPort}/health`);
    });
  }

  createWindow() {
    this.mainWindow = new BrowserWindow({
      width: 800,
      height: 600,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, 'preload.js'),
      },
      // icon: path.join(__dirname, '../public/icon.png'),
      title: 'Electron MCP Server',
    });

    // Load the UI
    this.mainWindow.loadFile(path.join(__dirname, '../public/index.html'));

    // Open DevTools in development
    if (process.argv.includes('--dev')) {
      this.mainWindow.webContents.openDevTools();
    }

    // Handle window closed
    this.mainWindow.on('closed', () => {
      this.mainWindow = null;
    });

    // Handle window closed
    this.mainWindow.on('close', () => {
      // Normal quit behavior since we don't have tray
    });
  }

  // createTray() {
  //   // Create tray icon (you might want to add an actual icon file)
  //   // this.tray = new Tray(path.join(__dirname, '../public/icon.png'));
  //   
  //   const contextMenu = Menu.buildFromTemplate([
  //     {
  //       label: 'Show',
  //       click: () => {
  //         if (this.mainWindow) {
  //           this.mainWindow.show();
  //         } else {
  //           this.createWindow();
  //         }
  //       },
  //     },
  //     {
  //       label: 'MCP Server Status',
  //       submenu: [
  //         {
  //           label: 'Open Health Check',
  //           click: () => {
  //             shell.openExternal(`http://localhost:${this.serverPort}/health`);
  //           },
  //         },
  //         {
  //           label: 'MCP Endpoint',
  //           click: () => {
  //             shell.openExternal(`http://localhost:${this.serverPort}/mcp`);
  //           },
  //         },
  //       ],
  //     },
  //     { type: 'separator' },
  //     {
  //       label: 'Quit',
  //       click: () => {
  //         app.isQuiting = true;
  //         app.quit();
  //       },
  //     },
  //   ]);

  //   this.tray.setContextMenu(contextMenu);
  //   this.tray.setToolTip('Electron MCP Server');
    
  //   this.tray.on('double-click', () => {
  //     if (this.mainWindow) {
  //       this.mainWindow.show();
  //     } else {
  //       this.createWindow();
  //     }
  //   });
  // }

  async startMCPServer() {
    try {
      this.mcpServer = new ElectronMCPServer(this.serverPort);
      await this.mcpServer.start();
      
      console.log(`MCP Server started successfully on port ${this.serverPort}`);
      
      // Update tray tooltip
      // if (this.tray) {
      //   this.tray.setToolTip(`Electron MCP Server - Running on :${this.serverPort}`);
      // }

      // Notify renderer process
      if (this.mainWindow && this.mainWindow.webContents) {
        this.mainWindow.webContents.send('server-status-changed', this.mcpServer.getStatus());
      }
      
      return true;
    } catch (error) {
      console.error('Failed to start MCP server:', error);
      
      // Update tray tooltip
      // if (this.tray) {
      //   this.tray.setToolTip('Electron MCP Server - Error');
      // }

      // Notify renderer process
      if (this.mainWindow && this.mainWindow.webContents) {
        this.mainWindow.webContents.send('server-error', error.message);
      }
      
      return false;
    }
  }

  async cleanup() {
    try {
      if (this.mcpServer) {
        await this.mcpServer.stop();
        this.mcpServer = null;
      }
      
      // if (this.tray) {
      //   this.tray.destroy();
      //   this.tray = null;
      // }
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  }
}

// Create and start the application
const electronMCPApp = new ElectronMCPApp();

// Export for testing
export default ElectronMCPApp;