type EventListeners<T> = {
  eventName: string;
  listener: (data: T) => void;
};

type EventListenersMap = Map<string, EventListeners<any>[]>;

type EventEmitter<EventMap extends Record<string, any>> = {
  on: <K extends keyof EventMap>(
    eventName: K,
    listener: (data: EventMap[K]) => void
  ) => void;
  off: <K extends keyof EventMap>(
    eventName: K,
    listener: (data: EventMap[K]) => void
  ) => void;
  emit: <K extends keyof EventMap>(eventName: K, data: EventMap[K]) => void;
};

export const createEventEmitter = <
  EventMap extends Record<string, any>
>(): EventEmitter<EventMap> => {
  const listeners: EventListenersMap = new Map();

  Object.keys({} as EventMap).forEach((eventName) => {
    listeners.set(eventName, []);
  });

  const on = <K extends keyof EventMap>(
    eventName: K,
    listener: (data: EventMap[K]) => void
  ): void => {
    listeners.set(eventName as string, [
      ...(listeners.get(eventName as string) || []),
      { eventName: eventName as string, listener },
    ]);
  };

  const off = <K extends keyof EventMap>(
    eventName: K,
    listener: (data: EventMap[K]) => void
  ): void => {
    if (!listeners.has(eventName as string)) {
      return;
    }
    const listenersForEvent = listeners.get(eventName as string)!;
    const index = listenersForEvent.findIndex(
      (eventListener) =>
        eventListener.eventName === eventName &&
        eventListener.listener === listener
    );
    if (index !== -1) {
      listenersForEvent.splice(index, 1);
    }
  };

  const emit = <K extends keyof EventMap>(
    eventName: K,
    data: EventMap[K]
  ): void => {
    if (!listeners.has(eventName as string)) {
      return;
    }
    const listenersForEvent = listeners.get(eventName as string)!.slice();
    listenersForEvent.forEach(({ listener }) => {
      listener(data);
    });
  };

  return {
    on,
    off,
    emit,
  };
};
