import { useEffect } from "react";
import {
  addNetworkStatusChangeListener,
  removeAllNetworkStatusChangeListeners,
} from "../native-api/network";
import { initNotifications } from "../native-api/notification";
import {
  addBecomeActiveListener,
  removeAllBecomeActiveListeners,
} from "../native-api/platform";
import { useCloudStorage } from "../utils/CloudStorage";
import useNetwork from "../utils/useNetwork";
import useTask from "../utils/useTask";
import useUpdateSearchParams from "../utils/useUpdateSearchParams";

const PageEffect = () => {
  const { handleInit, handleActive } = useTask();
  const { handleNetworkStatusChange } = useNetwork();
  const { requestTokens } = useCloudStorage();

  useUpdateSearchParams();

  useEffect(() => {
    handleInit();
    initNotifications();
    requestTokens();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    addBecomeActiveListener(handleActive);
    return () => {
      removeAllBecomeActiveListeners([handleActive]);
    };
  }, [handleActive]);

  useEffect(() => {
    addNetworkStatusChangeListener(handleNetworkStatusChange);
    return () => {
      removeAllNetworkStatusChangeListeners();
    };
  }, [handleNetworkStatusChange]);

  return null;
};

export default PageEffect;
