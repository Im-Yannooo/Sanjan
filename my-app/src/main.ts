import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import path from 'node:path';
import fs from 'node:fs';
import started from 'electron-squirrel-startup';

const configPath = path.join(app.getPath("userData"), "config.json");

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

function createConfigIfNeeded() {
  if (!fs.existsSync(configPath)) {
    fs.writeFileSync(
      configPath,
      JSON.stringify(
        {
          vaultPath: null
        },
        null,
        2
      )
    );
  }
}

interface Config {
  vaultPath: string | null;
}

function readConfig(): Config {
  createConfigIfNeeded();

  return JSON.parse(
    fs.readFileSync(configPath, "utf8")
  ) as Config;
}

function writeConfig(config: Config): void {
  fs.writeFileSync(
    configPath,
    JSON.stringify(config, null, 2)
  );
}

let mainWindow: BrowserWindow | null = null;
let maximizeToggle = false; // toggle back to original window size if maximize is clicked again

const WELCOME_CONTENT = `
Welcome
This is your new vault
Make a note of something, [[create a link to your note]]
When you're ready, delete this note and make the vault your own
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

  // mainWindow.webContents.openDevTools();

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

ipcMain.on('window:setSetupSize', () => {
  if (!mainWindow) return;

  mainWindow.setResizable(false);
  mainWindow.setSize(760, 440);
  mainWindow.center();
});

ipcMain.handle('dialog:openFolder', async () => {
  if (!mainWindow) return null;

  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory', 'createDirectory'],
    title: 'Choose a folder for your vault',
  });

  if (result.canceled || result.filePaths.length === 0) return null;
  return result.filePaths[0];
});

ipcMain.on('window:setLoginSize', () => {
  if (!mainWindow) return;

  mainWindow.setResizable(false);
  mainWindow.setSize(1020, 600);
  mainWindow.center();
});

ipcMain.on('window:setMainSize', () => {
  if (!mainWindow) return;

  mainWindow.setResizable(true);
  mainWindow.setSize(1020, 600);
  mainWindow.center();
});

// --- Local Vault IPC handlers ---
const getVaultPath = () => {
  const config = readConfig();
  const vaultPath = config.vaultPath;
  if (!vaultPath) {
    throw new Error("Vault path is not configured");
  }
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
// --- Local Vault IPC handlers --- End

// --- File Management Vault
ipcMain.handle('config:get', () => {
  return readConfig();
});

ipcMain.handle('config:setVault', (_, vaultPath: string) => {
  const config = readConfig();
  config.vaultPath = vaultPath;
  writeConfig(config);

  // Actually create the directory on disk
  if (!fs.existsSync(vaultPath)) {
    fs.mkdirSync(vaultPath, { recursive: true });
  }

  // Create default Welcome.md if the vault is brand new/empty
  const welcomeFile = path.join(vaultPath, 'Welcome.md');
  if (!fs.existsSync(welcomeFile)) {
    fs.writeFileSync(welcomeFile, WELCOME_CONTENT, 'utf8');
  }
});

// The code below is for developing version
// app.on('ready', createWindow);

// The code below is for production version
app.on('ready', () => {
  createConfigIfNeeded();
  createWindow();
});

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