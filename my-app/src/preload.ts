// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  minimize: () => ipcRenderer.send('manualMinimize'),
  maximize: () => ipcRenderer.send('manualMaximize'),
  close: () => ipcRenderer.send('manualClose'),
  getNotes: () => ipcRenderer.invoke('vault:getNotes'),
  saveNote: (title: string, content: string) => ipcRenderer.invoke('vault:saveNote', title, content),
  renameNote: (oldTitle: string, newTitle: string) => ipcRenderer.invoke('vault:renameNote', oldTitle, newTitle),
  deleteNote: (title: string) => ipcRenderer.invoke('vault:deleteNote', title),
});