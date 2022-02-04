require("./rt/electron-rt");
//////////////////////////////
// User Defined Preload scripts below
console.log("User Preload!");

const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electron", {
  readFile: (path: string, options?: { encoding?: null | undefined }) =>
    ipcRenderer.invoke("readFile", path, options),
  writeFile: (
    path: string,
    data: string,
    options?: { encoding?: null | undefined }
  ) => ipcRenderer.invoke("writeFile", path, data, options),
  deleteFile: (path: string) => ipcRenderer.invoke("deleteFile", path),
  saveFile: (title?: string) => ipcRenderer.invoke("saveFile", title),
});
