const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  navigate: (screen) => ipcRenderer.send('navigate', screen),
});