import { Clipboard } from "@capacitor/clipboard";
import { getPlatform } from "./platform";

export function writeToClipboard(promise: Promise<string>) {
  const platform = getPlatform();
  const safariAgent = navigator.userAgent.includes("Safari");
  if (platform === "web" && safariAgent) {
    return navigator.clipboard.write([
      new ClipboardItem({ "text/plain": promise }),
    ]);
  }
  return promise.then((data) =>
    Clipboard.write({
      string: data,
    })
  );
}
