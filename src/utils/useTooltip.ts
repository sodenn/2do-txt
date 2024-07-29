import { hasTouchScreen } from "@/native-api/platform";
import { useLongPress } from "@/utils/useLongPress";
import { useEffect, useState } from "react";

export function useTooltip(delay = 500) {
  const [showInstantTooltip, setShowInstantTooltip] = useState(false);
  const [showTooltip, setShowTooltip] = useState(showInstantTooltip);
  const touchScreen = hasTouchScreen();
  const longPressProps = useLongPress({
    delay,
    callback: () => {
      setShowInstantTooltip(true);
      setTimeout(() => {
        setShowInstantTooltip(false);
      }, 2000);
    },
  });

  const openTooltip = () => {
    if (touchScreen) {
      return;
    }
    setShowInstantTooltip(true);
  };

  const closeTooltip = () => {
    if (touchScreen) {
      return;
    }
    setShowInstantTooltip(false);
  };

  useEffect(() => {
    const handler = setTimeout(
      () => {
        setShowTooltip(showInstantTooltip);
      },
      showInstantTooltip ? delay : 0,
    );
    return () => clearTimeout(handler);
  }, [showInstantTooltip, delay]);

  return {
    showTooltip,
    onMouseEnter: openTooltip,
    onMouseLeave: closeTooltip,
    ...longPressProps,
  };
}
