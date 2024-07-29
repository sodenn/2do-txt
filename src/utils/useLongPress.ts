import { hasTouchScreen } from "@/native-api/platform";
import { TouchEvent, useCallback, useEffect, useRef } from "react";

type LongPressOptions = {
  callback: () => void;
  delay?: number;
  touchStart?: (event: TouchEvent) => void;
  touchEnd?: (event: TouchEvent) => void;
};

type LongPressResult = {
  onTouchStart: (event: TouchEvent) => void;
  onTouchEnd: (event: TouchEvent) => void;
};

export const useLongPress = ({
  callback,
  touchStart,
  touchEnd,
  delay = 500,
}: LongPressOptions): LongPressResult => {
  const timeoutRef = useRef<number>();
  const touchScreen = hasTouchScreen();

  const clear = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  const onTouchStart = useCallback(
    (event: TouchEvent) => {
      if (!touchScreen) {
        return;
      }
      touchStart?.(event);
      timeoutRef.current = window.setTimeout(() => {
        callback();
      }, delay);
    },
    [callback, delay, touchStart, touchScreen],
  );

  const onTouchEnd = useCallback(
    (event: TouchEvent) => {
      if (!touchScreen) {
        return;
      }
      touchEnd?.(event);
      clear();
    },
    [clear, touchEnd, touchScreen],
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
