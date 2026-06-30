import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'node:path';
import started from 'electron-squirrel-startup';

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

let mainWindow: BrowserWindow | null = null;
let maximizeToggle = false; // toggle back to original window size if maximize is clicked again

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1020,
    height: 600,
    frame: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  mainWindow.setMenuBarVisibility(false);

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`),
    );
  }

  mainWindow.webContents.openDevTools();

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
};

// --- Window control IPC handlers ---
ipcMain.on('manualMinimize', () => {
  mainWindow?.minimize();
});

ipcMain.on('manualMaximize', () => {
  if (!mainWindow) return;
  if (maximizeToggle) {
    mainWindow.unmaximize();
  } else {
    mainWindow.maximize();
  }
  maximizeToggle = !maximizeToggle;
});

ipcMain.on('manualClose', () => {
  app.quit();
});

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});