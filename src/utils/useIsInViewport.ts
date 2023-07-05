import { useEffect, useMemo, useRef, useState } from "react";

interface InViewport {
  visible: boolean;
  direction?: "above" | "below";
}

export function useIsInViewport(elem: Element) {
  const [value, setValue] = useState<InViewport>({ visible: true });
  const previous = useRef({ y: 0, ratio: 0 });

  const observer = useMemo(
    () =>
      new IntersectionObserver(([entry]) => {
        const currentY = entry.boundingClientRect.y;
        const currentRatio = entry.intersectionRatio;
        const isIntersecting = entry.isIntersecting;
        const { y: previousY, ratio: previousRatio } = previous.current;
        const newDirection =
          currentY > previousY && currentRatio < previousRatio
            ? "above"
            : currentY < previousY
            ? "below"
            : undefined;
        setValue((curr) => ({
          visible: isIntersecting,
          ...(isIntersecting
            ? { direction: curr.direction }
            : {
                direction: newDirection,
              }),
        }));
        previous.current = { y: currentY, ratio: currentRatio };
      }),
    [],
  );

  useEffect(() => {
    observer.observe(elem);
    return () => {
      observer.disconnect();
    };
  }, [elem, observer]);

  return value;
}
