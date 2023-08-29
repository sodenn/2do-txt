import { useCloudStorageEffect } from "@/utils/CloudStorage";
import { useNetworkEffect } from "@/utils/useNetworkEffect";
import { useNotificationsEffect } from "@/utils/useNotificationsEffect";
import useSearchParamsEffect from "../utils/useSearchParamsEffect";
import { useTaskEffect } from "@/utils/useTaskEffect";
import { usePreventPushingViewOffscreen } from "@/utils/usePreventPushingViewOffscreen";

export default function PageEffect() {
  useSearchParamsEffect();
  useTaskEffect();
  useNetworkEffect();
  useNotificationsEffect();
  useCloudStorageEffect();
  usePreventPushingViewOffscreen();
  return null;
}
