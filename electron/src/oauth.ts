const { ipcMain, BrowserWindow } = require("electron");

export function setupOauthHandling() {
  ipcMain.handle("oauth", async (event, authUrl, redirectUrl) => {
    return new Promise<string>((resolve, reject) => {
      const authWindow = new BrowserWindow({
        width: 800,
        height: 600,
        show: false,
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true,
        },
      });

      authWindow.loadURL(authUrl);
      authWindow.show();
      authWindow.webContents.session.webRequest.onHeadersReceived(null);

      let isResolved = false;

      const filter = {
        urls: [`${redirectUrl}*`],
      };

      authWindow.webContents.on("did-finish-load", () => {
        authWindow.webContents.session.webRequest.onBeforeRequest(
          filter,
          ({ url }) => {
            isResolved = true;
            const urlParams = Object.fromEntries(new URL(url).searchParams);
            resolve(JSON.stringify(urlParams));
            authWindow.close();
          }
        );
      });

      authWindow.on("close", () => {
        if (!isResolved) {
          reject(new Error("Browser closed by user"));
        }
      });
    });
  });
}
