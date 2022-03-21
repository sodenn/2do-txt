import { RateApp } from "capacitor-rate-app";
import { addDays, isAfter } from "date-fns";
import { useCallback } from "react";
import { parseDate } from "./date";
import { usePlatform } from "./platform";
import { useStorage } from "./storage";

export function useAppRate() {
  const { getStorageItem, setStorageItem } = useStorage();
  const platform = usePlatform();

  const getNextRatingRequestDate = useCallback(
    () => addDays(new Date(), 7),
    []
  );

  const getCounter = useCallback(async () => {
    const counter = await getStorageItem("app-rate-counter");
    if (!counter) {
      return 0;
    }
    return parseInt(counter);
  }, [getStorageItem]);

  const increaseCounter = useCallback(
    async (counter: number) => {
      const newValue = counter + 1;
      await setStorageItem("app-rate-counter", newValue.toString());
    },
    [setStorageItem]
  );

  const setNextRatingRequestDate = useCallback(
    (nextRatingRequestDate = getNextRatingRequestDate()) => {
      return setStorageItem(
        "app-rate-date",
        nextRatingRequestDate.toISOString()
      );
    },
    [getNextRatingRequestDate, setStorageItem]
  );

  const getNextRatingRequestDateFromStorage = useCallback(async () => {
    const dateStr = await getStorageItem("app-rate-date");

    if (!dateStr) {
      const nextRatingRequestDate = getNextRatingRequestDate();
      await setNextRatingRequestDate(nextRatingRequestDate);
      return nextRatingRequestDate;
    }

    const date = parseDate(dateStr);

    if (date) {
      return date;
    } else {
      const nextRatingRequestDate = getNextRatingRequestDate();
      await setNextRatingRequestDate(nextRatingRequestDate);
      return nextRatingRequestDate;
    }
  }, [getNextRatingRequestDate, getStorageItem, setNextRatingRequestDate]);

  const isTimeForRatingRequest = useCallback(async () => {
    const currentDate = new Date();
    const nextRatingRequestDate = await getNextRatingRequestDateFromStorage();
    return isAfter(currentDate, nextRatingRequestDate);
  }, [getNextRatingRequestDateFromStorage]);

  const promptForRating = useCallback(async () => {
    if (platform !== "ios" && platform !== "android") {
      return;
    }

    const timeForRatingRequest = await isTimeForRatingRequest();
    if (!timeForRatingRequest) {
      return;
    }

    const counter = await getCounter();
    if (counter > 3) {
      return;
    }

    await Promise.all([
      setNextRatingRequestDate(),
      increaseCounter(counter),
      RateApp.requestReview(),
    ]);
  }, [
    platform,
    getCounter,
    increaseCounter,
    setNextRatingRequestDate,
    isTimeForRatingRequest,
  ]);

  return { promptForRating };
}
