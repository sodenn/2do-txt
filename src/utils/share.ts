import { Share } from "@capacitor/share";

export async function share(url: string) {
  await Share.share({ url });
}
