import { useEffect } from "react";
import {
  addNetworkStatusChangeListener,
  removeAllNetworkStatusChangeListeners,
} from "../native-api/network";
import { useCloudStorage } from "./CloudStorage";
import useNetwork from "./useNetwork";

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
