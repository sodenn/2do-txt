import { IS_SAFARI } from "@/native-api/platform";

export async function writeToClipboard(promise: Promise<string>) {
  if (IS_SAFARI) {
    return navigator.clipboard.write([
      new ClipboardItem({ "text/plain": promise }),
    ]);
  }
  const data = await promise;
  const blob = new Blob([data], { type: "text/plain" });
  return navigator.clipboard.write([new ClipboardItem({ "text/plain": blob })]);
}
