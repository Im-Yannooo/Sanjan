import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'node:path';
import fs from 'node:fs';
import started from 'electron-squirrel-startup';

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

let mainWindow: BrowserWindow | null = null;
let maximizeToggle = false; // toggle back to original window size if maximize is clicked again

const WELCOME_CONTENT = `# Welcome to Sanjan Workspace

This is SANJAN, giving you a powerful, local-first, and highly customizable note-taking experience.

Key Features

Graph View
Visualize the connections between your notes. Understand relationships at a glance.

Local First
Your data is stored locally on your device as plain markdown files.

Markdown Editor
Write distraction-free with a powerful, real-time markdown editor.

Start typing to edit this note, or create a new tab with the + button above!
`;

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

// --- Local Vault IPC handlers ---
const getVaultPath = () => {
  const vaultPath = path.join(app.getAppPath(), 'vault');
  if (!fs.existsSync(vaultPath)) {
    fs.mkdirSync(vaultPath, { recursive: true });
  }
  return vaultPath;
};

ipcMain.handle('vault:getNotes', async () => {
  const vaultPath = getVaultPath();
  let files = fs.readdirSync(vaultPath).filter((f) => f.endsWith('.md'));
  
  if (files.length === 0) {
    // Create default Welcome.md
    fs.writeFileSync(path.join(vaultPath, 'Welcome.md'), WELCOME_CONTENT, 'utf8');
    files = ['Welcome.md'];
  }
  
  return files.map((filename) => {
    const filePath = path.join(vaultPath, filename);
    const content = fs.readFileSync(filePath, 'utf8');
    return {
      title: filename,
      content,
    };
  });
});

ipcMain.handle('vault:saveNote', async (event, title: string, content: string) => {
  const vaultPath = getVaultPath();
  const filename = title.endsWith('.md') ? title : `${title}.md`;
  fs.writeFileSync(path.join(vaultPath, filename), content, 'utf8');
});

ipcMain.handle('vault:renameNote', async (event, oldTitle: string, newTitle: string) => {
  const vaultPath = getVaultPath();
  const oldFilename = oldTitle.endsWith('.md') ? oldTitle : `${oldTitle}.md`;
  const newFilename = newTitle.endsWith('.md') ? newTitle : `${newTitle}.md`;
  
  const oldPath = path.join(vaultPath, oldFilename);
  const newPath = path.join(vaultPath, newFilename);
  
  if (fs.existsSync(oldPath)) {
    fs.renameSync(oldPath, newPath);
  }
});

ipcMain.handle('vault:deleteNote', async (event, title: string) => {
  const vaultPath = getVaultPath();
  const filename = title.endsWith('.md') ? title : `${title}.md`;
  const filePath = path.join(vaultPath, filename);
  
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
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