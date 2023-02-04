import { Clipboard } from "@capacitor/clipboard";
import { writeText } from "@tauri-apps/api/clipboard";
import { getPlatform } from "./platform";

export async function writeToClipboard(promise: Promise<string>) {
  const platform = getPlatform();

  const safariAgent = navigator.userAgent.includes("Safari");
  if (platform === "web" && safariAgent) {
    return navigator.clipboard.write([
      new ClipboardItem({ "text/plain": promise }),
    ]);
  }

  const data = await promise;

  if (platform === "desktop") {
    return writeText(data);
  }

  return Clipboard.write({
    string: data,
  });
}
