import { differenceInSeconds } from "date-fns";
import { useSnackbar } from "notistack";
import { useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { create } from "zustand";
import {
  addNetworkStatusChangeListener,
  removeAllNetworkStatusChangeListeners,
} from "../utils/network";

interface NetworkState {
  connected: boolean;
  displayDate?: Date;
  setConnected: (connected: boolean) => void;
  setDisplayDate: (displayDate?: Date) => void;
}

const useNetworkStore = create<NetworkState>((set) => ({
  connected: true,
  displayDate: new Date(),
  setConnected: (connected: boolean) =>
    set((state) => ({ displayDate: state.displayDate, connected })),
  setDisplayDate: (displayDate?: Date) =>
    set((state) => ({ connected: state.connected, displayDate })),
}));

function useNetwork() {
  const { t } = useTranslation();
  const { enqueueSnackbar } = useSnackbar();
  const { connected, displayDate, setConnected, setDisplayDate } =
    useNetworkStore();

  const handleNetworkStatusChange = useCallback(
    (connected: boolean) => {
      setConnected(connected);
      // Don't annoy the user, so only show the message once per minute
      const showAlert =
        !displayDate || differenceInSeconds(displayDate, new Date()) > 60;
      if (!connected && showAlert) {
        enqueueSnackbar(t("Unable to connect. Check network connection"), {
          variant: "warning",
        });
        setDisplayDate(new Date());
      }
    },
    [displayDate, enqueueSnackbar, setConnected, setDisplayDate, t]
  );

  useEffect(() => {
    addNetworkStatusChangeListener(handleNetworkStatusChange);
    return () => {
      removeAllNetworkStatusChangeListeners();
    };
  }, [handleNetworkStatusChange]);

  return { connected };
}

export default useNetwork;
