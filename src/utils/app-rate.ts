import { RateApp } from "capacitor-rate-app";
import { addDays, isAfter } from "date-fns";
import { useCallback } from "react";
import { parseDate } from "./date";
import { usePlatform } from "./platform";
import { useStorage } from "./storage";

export function useAppRate() {
  const { getStorageItem, setStorageItem } = useStorage();
  const platform = usePlatform();

  const getCounter = useCallback(async () => {
    const counter = await getStorageItem("app-rate-counter");

    if (!counter) {
      return 0;
    }

    return parseInt(counter);
  }, [getStorageItem]);

  const getNextRatingRequestDate = useCallback(async () => {
    const dateStr = await getStorageItem("app-rate-date");

    if (!dateStr) {
      return;
    }

    return parseDate(dateStr);
  }, [getStorageItem]);

  const setNextRatingRequestDate = useCallback(() => {
    const nextRatingRequestDate = addDays(new Date(), 7);
    return setStorageItem("app-rate-date", nextRatingRequestDate.toISOString());
  }, [setStorageItem]);

  const timeForRatingRequest = useCallback(async () => {
    const currentDate = new Date();
    const nextRatingRequestDate = await getNextRatingRequestDate();

    if (!nextRatingRequestDate) {
      return true;
    }

    return isAfter(currentDate, nextRatingRequestDate);
  }, [getNextRatingRequestDate]);

  const increaseCounter = useCallback(
    async (counter: number) => {
      const newValue = counter + 1;
      await setStorageItem("app-rate-counter", newValue.toString());
    },
    [setStorageItem]
  );

  const promptForRating = useCallback(async () => {
    if (platform !== "ios" && platform !== "android") {
      return;
    }

    if (!(await timeForRatingRequest())) {
      return;
    }

    const counter = await getCounter();

    if (counter > 150) {
      return;
    }

    if (counter % 30 === 0) {
      await setNextRatingRequestDate();
      RateApp.requestReview().catch((error) => console.error(error));
    }

    await increaseCounter(counter);
  }, [
    platform,
    getCounter,
    increaseCounter,
    setNextRatingRequestDate,
    timeForRatingRequest,
  ]);

  return { promptForRating };
}
