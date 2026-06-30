// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  minimize: () => ipcRenderer.send('manualMinimize'),
  maximize: () => ipcRenderer.send('manualMaximize'),
  close: () => ipcRenderer.send('manualClose'),
});