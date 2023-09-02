import { useCloudStorageEffect } from "@/utils/CloudStorage";
import { useNetworkEffect } from "@/utils/useNetworkEffect";
import { useNotificationsEffect } from "@/utils/useNotificationsEffect";
import { usePreventPushingViewOffscreen } from "@/utils/usePreventPushingViewOffscreen";
import { useTaskEffect } from "@/utils/useTaskEffect";
import useSearchParamsEffect from "../utils/useSearchParamsEffect";

export default function PageEffect() {
  useSearchParamsEffect();
  useTaskEffect();
  useNetworkEffect();
  useNotificationsEffect();
  useCloudStorageEffect();
  usePreventPushingViewOffscreen();
  return null;
}
