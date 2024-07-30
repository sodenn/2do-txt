import { useNetworkEffect } from "@/utils/useNetworkEffect";
import { useNotificationsEffect } from "@/utils/useNotificationsEffect";
import { useSearchParamsEffect } from "@/utils/useSearchParamsEffect";
import { useTaskEffect } from "@/utils/useTaskEffect";

export function PageEffect() {
  useSearchParamsEffect();
  useTaskEffect();
  useNetworkEffect();
  useNotificationsEffect();
  return null;
}
