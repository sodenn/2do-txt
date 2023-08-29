import { writeText } from "@tauri-apps/api/clipboard";
import { getPlatform } from "@/native-api/platform";

export async function writeToClipboard(promise: Promise<string>) {
  const platform = getPlatform();

  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  if (platform === "web" && isSafari) {
    return navigator.clipboard.write([
      new ClipboardItem({ "text/plain": promise }),
    ]);
  }

  const data = await promise;

  if (platform === "desktop") {
    return writeText(data);
  }

  const blob = new Blob([data], { type: "text/plain" });
  return navigator.clipboard.write([new ClipboardItem({ "text/plain": blob })]);
}
