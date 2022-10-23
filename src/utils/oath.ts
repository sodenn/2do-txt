import { getPlatform } from "./platform";

interface OauthOptions {
  authUrl: string;
  redirectUrl: string;
}

export async function oauth(opt: OauthOptions) {
  const platform = getPlatform();
  if (platform === "ios" || platform === "android") {
    return mobileOauth(opt);
  }
  if (platform === "electron") {
    return desktopOauth(opt);
  }
  throw new Error(`oauth: platform "${platform}" not supportet`);
}

function mobileOauth(opt: OauthOptions) {
  const { authUrl, redirectUrl } = opt;
  return new Promise<{ [p: string]: string }>((resolve, reject) => {
    // @ts-ignore
    const browser = cordova.InAppBrowser.open(
      authUrl,
      "_blank",
      "location=yes"
    );

    let isResolved = false;

    const onLoadstart = async (event: any) => {
      if (event && new RegExp(`^${redirectUrl}`).test(event.url)) {
        browser.removeEventListener("loadstart", onLoadstart);
        browser.close();
        isResolved = true;
        const urlParams = Object.fromEntries(new URL(event.url).searchParams);
        resolve(urlParams);
      }
    };

    const onExit = () => {
      browser.removeEventListener("exit", onExit);
      if (!isResolved) {
        reject(new Error("Browser closed by user"));
      }
    };

    browser.addEventListener("loadstart", onLoadstart);
    browser.addEventListener("exit", onExit);
  });
}

async function desktopOauth(opt: OauthOptions) {
  const { authUrl, redirectUrl } = opt;
  // @ts-ignore
  const params: string = await window.electron.oauth(authUrl, redirectUrl);
  return JSON.parse(params) as { [p: string]: string };
}
