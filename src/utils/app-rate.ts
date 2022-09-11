import { RateApp } from "capacitor-rate-app";
import { addWeeks, isAfter } from "date-fns";
import { useCallback } from "react";
import { parseDate } from "./date";
import { usePlatform } from "./platform";
import { usePreferences } from "./prefereneces";

export function useAppRate() {
  const { getPreferencesItem, setPreferencesItem } = usePreferences();
  const platform = usePlatform();

  const getNextRatingRequestDate = useCallback(
    () => addWeeks(new Date(), 2),
    []
  );

  const getCounter = useCallback(async () => {
    const counter = await getPreferencesItem("app-rate-counter");
    if (!counter) {
      return 0;
    }
    return parseInt(counter);
  }, [getPreferencesItem]);

  const increaseCounter = useCallback(
    async (counter: number) => {
      const newValue = counter + 1;
      await setPreferencesItem("app-rate-counter", newValue.toString());
    },
    [setPreferencesItem]
  );

  const setNextRatingRequestDate = useCallback(
    (nextRatingRequestDate = getNextRatingRequestDate()) => {
      return setPreferencesItem(
        "app-rate-date",
        nextRatingRequestDate.toISOString()
      );
    },
    [getNextRatingRequestDate, setPreferencesItem]
  );

  const getNextRatingRequestDateFromStorage = useCallback(async () => {
    const dateStr = await getPreferencesItem("app-rate-date");

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
  }, [getNextRatingRequestDate, getPreferencesItem, setNextRatingRequestDate]);

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
