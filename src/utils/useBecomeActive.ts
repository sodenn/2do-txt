import { useEffect } from "react";
import {
  addBecomeActiveListener,
  removeAllBecomeActiveListeners,
} from "../native-api/platform";

export function useBecomeActive(listener: () => unknown) {
  useEffect(() => {
    addBecomeActiveListener(listener);
    return () => {
      removeAllBecomeActiveListeners([listener]);
    };
  }, [listener]);
}
