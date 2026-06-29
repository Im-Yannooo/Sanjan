const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

let mainWindow;
let windowBounds = { width: 420, height: 700, x: undefined, y: undefined };

function createWindow(screen = 'splash') {
  // save current size before navigating
  if (mainWindow) {
    windowBounds = mainWindow.getBounds();
    mainWindow.close();
  }

  mainWindow = new BrowserWindow({
    width: windowBounds.width,
    height: windowBounds.height,
    x: windowBounds.x,
    y: windowBounds.y,
    resizable: true,
    frame: true,
    transparent: false,
    backgroundColor: '#2c2a22',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  mainWindow.loadFile(path.join(__dirname, 'src', 'screens', `${screen}.html`));
}

app.whenReady().then(() => createWindow('splash'));

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// ── IPC navigation ──────────────────────────────────────────────────────────
ipcMain.on('navigate', (_event, screen) => {
  createWindow(screen);
});

// Drag support for frameless window
ipcMain.on('window-drag', () => {
  // handled via CSS -webkit-app-region: drag
});
