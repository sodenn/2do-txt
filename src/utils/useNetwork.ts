import { differenceInSeconds } from "date-fns";
import { useSnackbar } from "notistack";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import useNetworkStore from "@/stores/network-store";

export default function useNetwork() {
  const { t } = useTranslation();
  const { enqueueSnackbar } = useSnackbar();
  const { connected, displayDate, setConnected, setDisplayDate } =
    useNetworkStore();

  const handleDisconnected = useCallback(
    (connected: boolean) => {
      setConnected(connected);
      // Don't annoy the user, so only show the message once per minute
      const showAlert =
        !displayDate || differenceInSeconds(new Date(), displayDate) > 60;
      if (!connected && showAlert) {
        enqueueSnackbar(t("Unable to connect. Check network connection"), {
          variant: "warning",
        });
        setDisplayDate(new Date());
      }
    },
    [displayDate, enqueueSnackbar, setConnected, setDisplayDate, t]
  );

  return { connected, handleDisconnected };
}
