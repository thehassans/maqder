const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const { autoUpdater } = require('electron-updater');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 768,
    icon: path.join(__dirname, 'assets/icon.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  // Remove default menu for a cleaner app feel
  mainWindow.setMenuBarVisibility(false);

  // In production, load the built React app. In dev, load localhost.
  const startUrl = process.env.NODE_ENV === 'development' 
    ? 'http://localhost:5173' 
    : `file://${path.join(__dirname, 'dist/index.html')}`;
  
  mainWindow.loadURL(startUrl);

  mainWindow.on('closed', function () {
    mainWindow = null;
  });

  // Initialize auto-updater
  initAutoUpdater();
}

function initAutoUpdater() {
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.on('checking-for-update', () => {
    console.log('Checking for update...');
  });
  
  autoUpdater.on('update-available', (info) => {
    console.log('Update available.', info);
    mainWindow.webContents.send('update:available', info);
  });
  
  autoUpdater.on('update-not-available', (info) => {
    console.log('Update not available.', info);
  });
  
  autoUpdater.on('error', (err) => {
    console.log('Error in auto-updater.', err);
  });
  
  autoUpdater.on('download-progress', (progressObj) => {
    let log_message = "Download speed: " + progressObj.bytesPerSecond;
    log_message = log_message + ' - Downloaded ' + progressObj.percent + '%';
    log_message = log_message + ' (' + progressObj.transferred + "/" + progressObj.total + ')';
    console.log(log_message);
    mainWindow.webContents.send('update:progress', progressObj);
  });
  
  autoUpdater.on('update-downloaded', (info) => {
    console.log('Update downloaded');
    mainWindow.webContents.send('update:downloaded', info);
    // User wants silent auto update, but we can prompt them to restart now or it will update on quit
    // autoUpdater.quitAndInstall(); 
  });

  // Check for updates
  autoUpdater.checkForUpdatesAndNotify();
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

// IPC Handlers for database & sync will go here (to be implemented)
// Example:
// ipcMain.handle('db:invoices:find', async (event, query) => { ... })
