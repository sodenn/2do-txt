import {
  addNetworkStatusChangeListener,
  removeAllNetworkStatusChangeListeners,
} from "@/native-api/network";
import { useNetwork } from "@/utils/useNetwork";
import { useEffect } from "react";

export function useNetworkEffect() {
  const { connected, handleDisconnected } = useNetwork();
  useEffect(() => {
    handleDisconnected(connected);
    addNetworkStatusChangeListener(handleDisconnected);
    return () => {
      removeAllNetworkStatusChangeListeners();
    };
  }, [connected, handleDisconnected]);
}
