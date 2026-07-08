// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  window: {
    minimize: () => ipcRenderer.send('manualMinimize'),
    maximize: () => ipcRenderer.send('manualMaximize'),
    close: () => ipcRenderer.send('manualClose'),
    setSetupSize: () => ipcRenderer.send('window:setSetupSize'),
    setLoginSize: () => ipcRenderer.send('window:setLoginSize'),
    setMainSize: () => ipcRenderer.send('window:setMainSize'),
  },

  dialog: {
    openFolder: () => ipcRenderer.invoke('dialog:openFolder'),
  },

  vault: {
    getNotes: () => ipcRenderer.invoke('vault:getNotes'),
    saveNote: (title: string, content: string) => ipcRenderer.invoke('vault:saveNote', title, content),
    renameNote: (oldTitle: string, newTitle: string) => ipcRenderer.invoke('vault:renameNote', oldTitle, newTitle),
    deleteNote: (title: string) => ipcRenderer.invoke('vault:deleteNote', title),
  },

  config: {
    getConfig: () => ipcRenderer.invoke('config:get'),
    setVault: (vaultPath: string) => ipcRenderer.invoke('config:setVault', vaultPath),
  },
});