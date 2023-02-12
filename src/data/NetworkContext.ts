import { differenceInSeconds } from "date-fns";
import { useSnackbar } from "notistack";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { createContext } from "../utils/Context";
import {
  addNetworkStatusChangeListener,
  removeAllNetworkStatusChangeListeners,
} from "../utils/network";

const [NetworkProvider, useNetwork] = createContext(() => {
  const { t } = useTranslation();
  const { enqueueSnackbar } = useSnackbar();
  const [connected, setConnected] = useState(true);
  const [displayDate, setDisplayDate] = useState<Date>();

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
    [displayDate, enqueueSnackbar, t]
  );

  useEffect(() => {
    addNetworkStatusChangeListener(handleNetworkStatusChange);
    return () => {
      removeAllNetworkStatusChangeListeners();
    };
  }, [handleNetworkStatusChange]);

  return { connected };
});

export { NetworkProvider, useNetwork };
