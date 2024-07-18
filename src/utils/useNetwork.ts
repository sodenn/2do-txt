import { useToast } from "@/components/ui/use-toast";
import { useNetworkStore } from "@/stores/network-store";
import { differenceInSeconds } from "date-fns";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";

export function useNetwork() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { connected, displayDate, setConnected, setDisplayDate } =
    useNetworkStore();

  const handleDisconnected = useCallback(
    (connected: boolean) => {
      setConnected(connected);
      // Don't annoy the user, so only show the message once per minute
      const showAlert =
        !displayDate || differenceInSeconds(new Date(), displayDate) > 60;
      if (!connected && showAlert) {
        toast({
          variant: "warning",
          description: t("Unable to connect. Check network connection"),
        });
        setDisplayDate(new Date());
      }
    },
    [displayDate, toast, setConnected, setDisplayDate, t],
  );

  return { connected, handleDisconnected };
}
