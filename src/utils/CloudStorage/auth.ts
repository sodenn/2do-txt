import { getPlatform } from "@/native-api/platform";

export function shouldUseInAppBrowser() {
  const platform = getPlatform();
  return ["ios", "android", "desktop"].includes(platform);
}
