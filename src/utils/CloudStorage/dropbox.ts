import { shouldUseInAppBrowser } from "@/utils/CloudStorage/auth";
import {
  CloudStorageError,
  createCloudStorage,
  createDropboxClient,
} from "@/utils/CloudStorage/lib";
import { DropboxAuth } from "dropbox";

function getRedirectUrl() {
  const useInAppBrowser = shouldUseInAppBrowser();
  return useInAppBrowser
    ? "https://www.dropbox.com/1/oauth2/redirect_receiver"
    : `${window.location.origin}/dropbox`;
}

const clientId = import.meta.env.VITE_DROPBOX_CLIENT_ID;

export function createDropboxStorage(refreshToken: string) {
  return createCloudStorage({
    client: createDropboxClient({
      dropboxOptions: { refreshToken, clientId },
    }),
  });
}

export async function requestDropboxRefreshToken(
  codeVerifier: string,
  code: string,
) {
  const dbxAuth = new DropboxAuth({ clientId });
  dbxAuth.setCodeVerifier(codeVerifier);

  const redirectUrl = getRedirectUrl();
  const response = await dbxAuth.getAccessTokenFromCode(redirectUrl, code);
  if (response.status !== 200) {
    throw new CloudStorageError({ type: "Unauthorized", provider: "Dropbox" });
  }

  // @ts-ignore
  const refreshToken: string = response.result.refresh_token;
  if (!refreshToken) {
    throw new CloudStorageError({ type: "Unauthorized", provider: "Dropbox" });
  }

  return refreshToken;
}

export async function getDropboxOathOptions() {
  const dbxAuth = new DropboxAuth({
    clientId,
  });
  const redirectUrl = getRedirectUrl();
  const authUrl = (await dbxAuth.getAuthenticationUrl(
    redirectUrl,
    undefined,
    "code",
    "offline",
    undefined,
    undefined,
    true,
  )) as string;

  const codeVerifier = dbxAuth.getCodeVerifier();

  return {
    authUrl,
    redirectUrl,
    codeVerifier,
  };
}
