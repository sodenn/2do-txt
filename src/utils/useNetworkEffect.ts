import {
  addNetworkStatusChangeListener,
  removeAllNetworkStatusChangeListeners,
} from "@/native-api/network";
import { useCloudStorage } from "@/utils/CloudStorage";
import useNetwork from "@/utils/useNetwork";
import { useEffect } from "react";

export function useNetworkEffect() {
  const { cloudStorages } = useCloudStorage();
  const { connected, handleDisconnected } = useNetwork();
  useEffect(() => {
    if (cloudStorages.length === 0) {
      return;
    }
    handleDisconnected(connected);
    addNetworkStatusChangeListener(handleDisconnected);
    return () => {
      removeAllNetworkStatusChangeListeners();
    };
  }, [cloudStorages, connected, handleDisconnected]);
}
