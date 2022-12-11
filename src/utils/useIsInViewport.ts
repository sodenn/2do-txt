import { useEffect, useMemo, useState } from "react";

interface InViewport {
  visible: boolean;
  direction?: "above" | "below";
}

export function useIsInViewport(elem: Element) {
  const [value, setValue] = useState<InViewport>({ visible: true });

  const observer = useMemo(
    () =>
      new IntersectionObserver(
        ([entry]) => {
          const isIntersecting = entry.isIntersecting;
          setValue((curr) => ({
            visible: isIntersecting,
            ...(isIntersecting
              ? { direction: curr.direction }
              : {
                  direction:
                    entry.boundingClientRect.top > 0 ? "above" : "below",
                }),
          }));
        },
        {
          root: null,
          threshold: 0,
        }
      ),
    []
  );

  useEffect(() => {
    observer.observe(elem);
    return () => {
      observer.disconnect();
    };
  }, [elem, observer]);

  return value;
}
