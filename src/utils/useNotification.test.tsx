import { useNotification } from "@/utils/useNotification";
import { renderHook } from "@testing-library/react";
import { addHours, addMinutes, addWeeks } from "date-fns";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type NotificationMethods = ReturnType<typeof useNotification>;

i18n.use(initReactI18next).init({
  lng: "en",
  fallbackLng: "en",
  interpolation: {
    escapeValue: false, // not needed for react!!
  },
  resources: { en: { Reminder: "Reminder" } },
});

vi.mock("../stores/settings-store", () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  useSettingsStore: (callback: any) => {
    const data = {
      reminderOffset: 0,
    };
    return callback(data);
  },
}));

function mockNotificationAPI(permission: NotificationPermission = "granted") {
  const NotificationMock = vi.fn();
  const staticMembers = {
    requestPermission: vi.fn().mockImplementation(async () => {
      return permission;
    }),
    permission,
  };
  Object.assign(NotificationMock, staticMembers);
  vi.stubGlobal("Notification", NotificationMock);
}

function setupFakeTimers() {
  vi.useFakeTimers();
  const systemTime = new Date(2023, 0, 1, 0);
  vi.setSystemTime(systemTime);
  return systemTime;
}

function renderNotificationsHook() {
  const {
    result: { current },
  } = renderHook(() => useNotification());
  return current;
}

describe("useNotifications", () => {
  let systemTime: Date;
  let hook: NotificationMethods;

  beforeEach(() => {
    systemTime = setupFakeTimers();
    mockNotificationAPI();
    localStorage.clear();
    hook = renderNotificationsHook();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.resetAllMocks();
  });

  it("should schedule a notification", async () => {
    const ids = await hook.scheduleNotifications([
      {
        id: 1,
        body: "This is a notification",
        scheduleAt: addHours(systemTime, 1),
      },
    ]);
    expect(ids.length).toBe(1);
    expect(Notification).not.toHaveBeenCalled();
  });

  it("should schedule a notification with display offset", async () => {
    const ids = await hook.scheduleNotifications([
      {
        id: 1,
        body: "This is a notification",
        scheduleAt: addWeeks(systemTime, 1),
        displayOffset: 1000 * 60 * 60 * 8, // +8h
      },
    ]);
    expect(ids.length).toBe(1);
    expect(Notification).not.toHaveBeenCalled();

    // +6d
    vi.advanceTimersByTime(1000 * 60 * 60 * 24 * 6);
    expect(Notification).not.toHaveBeenCalled();

    // +16h
    vi.advanceTimersByTime(1000 * 60 * 60 * 16);
    expect(Notification).toHaveBeenCalled();
  });

  it("should display a scheduled notification", async () => {
    await hook.scheduleNotifications([
      {
        id: 1,
        body: "This is a notification",
        scheduleAt: addHours(systemTime, 1),
      },
    ]);
    await vi.advanceTimersToNextTimerAsync();
    expect(Notification).toBeCalledTimes(1);
  });

  it("should display a notification whose scheduling date is not older than 24 hours", async () => {
    const ids = await hook.scheduleNotifications([
      {
        id: 1,
        body: "This is a notification",
        scheduleAt: addHours(systemTime, -23),
      },
    ]);
    expect(ids.length).toBe(1);
    await vi.advanceTimersToNextTimerAsync();
    expect(Notification).toBeCalledTimes(1);
  });

  it("should not display a notification whose scheduling date is older than 24 hours", async () => {
    const ids = await hook.scheduleNotifications([
      {
        id: 1,
        body: "This is a notification",
        scheduleAt: addHours(systemTime, -25),
      },
    ]);
    expect(ids.length).toBe(0);
    await vi.advanceTimersToNextTimerAsync();
    expect(Notification).not.toHaveBeenCalled();
  });

  it("should not show the same notification again if it was shown in the last 24 hours", async () => {
    let ids = await hook.scheduleNotifications([
      {
        id: 1,
        body: "This is a notification",
        scheduleAt: addMinutes(systemTime, 30),
      },
    ]);
    expect(ids.length).toBe(1);

    await vi.advanceTimersToNextTimerAsync();
    expect(Notification).toBeCalledTimes(1);

    ids = await hook.scheduleNotifications([
      {
        id: 1,
        body: "This is a notification",
        scheduleAt: addMinutes(systemTime, 90),
      },
    ]);
    expect(ids.length).toBe(0);

    await vi.advanceTimersToNextTimerAsync();
    expect(Notification).toBeCalledTimes(1);
  });

  it("should show the same notification again if there are at least 24 hours between them", async () => {
    let ids = await hook.scheduleNotifications([
      {
        id: 1,
        body: "This is a notification",
        scheduleAt: addMinutes(systemTime, 30),
      },
    ]);
    expect(ids.length).toBe(1);

    // +25h
    vi.advanceTimersByTime(1000 * 60 * 60 * 25);
    expect(Notification).toBeCalledTimes(1);

    ids = await hook.scheduleNotifications([
      {
        id: 1,
        body: "This is a notification",
        scheduleAt: addHours(systemTime, 25),
      },
    ]);
    expect(ids.length).toBe(1);

    await vi.advanceTimersToNextTimerAsync();
    expect(Notification).toBeCalledTimes(2);
  });
});
