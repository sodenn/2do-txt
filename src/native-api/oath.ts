import { invoke } from "@tauri-apps/api/tauri";
import { getPlatform } from "./platform";

interface OauthOptions {
  authUrl: string;
  redirectUrl: string;
  title?: string;
}

function mobileOauth(opt: OauthOptions) {
  const { authUrl, redirectUrl } = opt;
  return new Promise<Record<string, any>>((resolve, reject) => {
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
  const { authUrl, redirectUrl, title } = opt;
  const queryString: string = await invoke("oauth", {
    authUrl,
    redirectUrl,
    title,
  });
  if (!queryString) {
    throw new Error("Browser closed by user");
  }
  return queryString.split("&").reduce((prev, curr) => {
    const [key, value] = curr.split("=");
    return {
      [decodeURIComponent(key)]: decodeURIComponent(value || "true"),
      ...prev,
    };
  }, {});
}

async function oauth(opt: OauthOptions) {
  const platform = getPlatform();
  if (platform === "ios" || platform === "android") {
    return mobileOauth(opt);
  }
  if (platform === "desktop") {
    return desktopOauth(opt);
  }
  throw new Error(`oauth: platform "${platform}" not supported`);
}

export { oauth };
