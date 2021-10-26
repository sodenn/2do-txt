import * as fs from "fs";

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

  ipcMain.handle("selectDir", async (event, title) => {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ["openDirectory", "createDirectory"],
      title,
    });
    return result.filePaths.length > 0 ? result.filePaths[0] : undefined;
  });
}
