import { useEffect } from "react";
import {
  addBecomeActiveListener,
  removeAllBecomeActiveListeners,
} from "@/native-api/platform";
import useTask from "@/utils/useTask";

export function useTaskEffect() {
  const { handleInit, handleActive } = useTask();

  useEffect(() => {
    handleInit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    addBecomeActiveListener(handleActive);
    return () => {
      removeAllBecomeActiveListeners([handleActive]);
    };
  }, [handleActive]);
}
