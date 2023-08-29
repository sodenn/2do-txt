import { useEffect, useRef } from "react";
import usePlatformStore from "../stores/platform-store";
import { isSafari } from "@/native-api/platform";

export function usePreventPushingViewOffscreen() {
  const platform = usePlatformStore((state) => state.platform);
  const pendingUpdate = useRef(false);
  useEffect(() => {
    const visualViewport = window.visualViewport;
    if (!visualViewport || !(platform === "web" && isSafari)) {
      return;
    }
    function viewportHandler() {
      const elements = document.querySelectorAll(`[role="presentation"]`);
      if (!visualViewport || pendingUpdate.current) {
        return;
      }
      pendingUpdate.current = true;
      requestAnimationFrame(() => {
        pendingUpdate.current = false;
        const offsetTop = Math.max(0, visualViewport.offsetTop);
        elements.forEach((element: any) => {
          console.log(elements);
          element.style.transform = `translateY(${offsetTop}px)`;
        });
      });
    }
    visualViewport.addEventListener("scroll", viewportHandler);
    visualViewport.addEventListener("resize", viewportHandler);
    return () => {
      visualViewport.removeEventListener("scroll", viewportHandler);
      visualViewport.removeEventListener("resize", viewportHandler);
    };
  }, [platform]);
}
