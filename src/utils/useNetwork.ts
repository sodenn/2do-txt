import { useSnackbar } from "@/components/Snackbar";
import { useNetworkStore } from "@/stores/network-store";
import { differenceInSeconds } from "date-fns";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";

export function useNetwork() {
  const { t } = useTranslation();
  const { openSnackbar } = useSnackbar();
  const { connected, displayDate, setConnected, setDisplayDate } =
    useNetworkStore();

  const handleDisconnected = useCallback(
    (connected: boolean) => {
      setConnected(connected);
      // Don't annoy the user, so only show the message once per minute
      const showAlert =
        !displayDate || differenceInSeconds(new Date(), displayDate) > 60;
      if (!connected && showAlert) {
        openSnackbar({
          color: "warning",
          message: t("Unable to connect. Check network connection"),
        });
        setDisplayDate(new Date());
      }
    },
    [displayDate, openSnackbar, setConnected, setDisplayDate, t],
  );

  return { connected, handleDisconnected };
}
