import { Network } from "@capacitor/network";
import { useSnackbar } from "notistack";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { CloudStorage, NetworkError } from "../types/cloud-storage.types";
import { createContext } from "../utils/Context";

const [NetworkProvider, useNetwork] = createContext(() => {
  const { t } = useTranslation();
  const { enqueueSnackbar } = useSnackbar();
  const [connectionIssue, setConnectionIssue] = useState(false);

  const checkNetworkStatus = useCallback(
    async (cloudStorage: CloudStorage) => {
      const status = await Network.getStatus();
      if (!status.connected) {
        // Don't annoy the user, so only show the message once
        if (!connectionIssue) {
          enqueueSnackbar(
            t("Unable to connect. Check network connection", {
              cloudStorage,
            }),
            { variant: "warning" }
          );
          setConnectionIssue(true);
        }
        throw new NetworkError();
      }
    },
    [connectionIssue, enqueueSnackbar, t]
  );

  return { checkNetworkStatus };
});

export { NetworkProvider, useNetwork };
