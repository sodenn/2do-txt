import { RateApp } from "capacitor-rate-app";
import { addWeeks, isAfter } from "date-fns";
import { parseDate } from "./date";
import { getPlatform } from "./platform";
import { getPreferencesItem, setPreferencesItem } from "./preferences";

function getNextRatingRequestDate() {
  return addWeeks(new Date(), 2);
}

async function getCounter() {
  const counter = await getPreferencesItem("app-rate-counter");
  if (!counter) {
    return 0;
  }
  return parseInt(counter);
}

async function increaseCounter(counter: number) {
  const newValue = counter + 1;
  await setPreferencesItem("app-rate-counter", newValue.toString());
}

function setNextRatingRequestDate(
  nextRatingRequestDate = getNextRatingRequestDate()
) {
  return setPreferencesItem(
    "app-rate-date",
    nextRatingRequestDate.toISOString()
  );
}

export async function getNextRatingRequestDateFromStorage() {
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
}

async function isTimeForRatingRequest() {
  const currentDate = new Date();
  const nextRatingRequestDate = await getNextRatingRequestDateFromStorage();
  return isAfter(currentDate, nextRatingRequestDate);
}

export async function promptForRating() {
  const platform = getPlatform();
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
}
