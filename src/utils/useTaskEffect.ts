import { useTask } from "@/utils/useTask";
import { useEffect } from "react";

export function useTaskEffect() {
  const { handleInit, handleActive } = useTask();

  useEffect(() => {
    handleInit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    window.addEventListener("focus", handleActive);
    return () => {
      window.removeEventListener("focus", handleActive);
    };
  }, [handleActive]);
}
