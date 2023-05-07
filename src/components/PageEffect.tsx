import { useCloudStorageEffect } from "../utils/CloudStorage";
import { useNetworkEffect } from "../utils/useNetworkEffect";
import { useNotificationsEffect } from "../utils/useNotificationsEffect";
import useSearchParamsEffect from "../utils/useSearchParamsEffect";
import { useTaskEffect } from "../utils/useTaskEffect";

const PageEffect = () => {
  useSearchParamsEffect();
  useTaskEffect();
  useNetworkEffect();
  useNotificationsEffect();
  useCloudStorageEffect();
  return null;
};

export default PageEffect;
