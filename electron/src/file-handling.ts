import * as fs from "fs";
import path from "path";
const { ipcMain, dialog } = require("electron");

export function setupFileHandling(mainWindow: Electron.BrowserWindow) {
  ipcMain.handle("readFile", async (event, ...args) => {
    // @ts-ignore
    return fs.promises.readFile(...args);
  });

  ipcMain.handle("writeFile", async (event, ...args) => {
    // @ts-ignore
    return fs.promises.writeFile(...args);
  });

  ipcMain.handle("deleteFile", async (event, ...args) => {
    // @ts-ignore
    return fs.promises.unlink(...args);
  });

  ipcMain.handle("saveFile", async (event, fileName) => {
    const result = await dialog.showSaveDialog(mainWindow, {
      defaultPath: fileName,
    });
    return result.canceled ? undefined : result.filePath;
  });

  ipcMain.handle("selectFolder", async (event, buttonLabel) => {
    const result = await dialog.showOpenDialog(mainWindow, {
      buttonLabel: buttonLabel,
      properties: ["openDirectory"],
    });
    return result.canceled ? undefined : result.filePaths[0];
  });

  ipcMain.handle("join", async (event, paths) => {
    return path.join(...paths);
  });
}
