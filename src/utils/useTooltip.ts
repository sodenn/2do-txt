import { useEffect, useState } from "react";

export function useTooltip(delay = 500) {
  const [showInstantTooltip, setShowInstantTooltip] = useState(false);
  const [showTooltip, setShowTooltip] = useState(showInstantTooltip);

  const openTooltip = () => {
    setShowInstantTooltip(true);
  };

  const closeTooltip = () => {
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
    // onFocus: openTooltip,
    onMouseEnter: openTooltip,
    // onBlur: closeTooltip,
    onMouseLeave: closeTooltip,
  };
}
