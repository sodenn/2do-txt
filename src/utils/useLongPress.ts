import { HAS_TOUCHSCREEN } from "@/utils/platform";
import { TouchEvent, useCallback, useEffect, useRef } from "react";

interface LongPressOptions {
  callback: () => void;
  delay?: number;
  touchStart?: (event: TouchEvent) => void;
  touchEnd?: (event: TouchEvent) => void;
}

interface LongPressResult {
  onTouchStart: (event: TouchEvent) => void;
  onTouchEnd: (event: TouchEvent) => void;
}

export const useLongPress = ({
  callback,
  touchStart,
  touchEnd,
  delay = 500,
}: LongPressOptions): LongPressResult => {
  const timeoutRef = useRef<number>(undefined);

  const clear = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  const onTouchStart = useCallback(
    (event: TouchEvent) => {
      if (!HAS_TOUCHSCREEN) {
        return;
      }
      touchStart?.(event);
      timeoutRef.current = window.setTimeout(() => {
        callback();
      }, delay);
    },
    [callback, delay, touchStart],
  );

  const onTouchEnd = useCallback(
    (event: TouchEvent) => {
      if (!HAS_TOUCHSCREEN) {
        return;
      }
      touchEnd?.(event);
      clear();
    },
    [clear, touchEnd],
  );

  useEffect(() => {
    return () => {
      clear();
    };
  }, [clear]);

  return {
    onTouchStart,
    onTouchEnd,
  };
};
