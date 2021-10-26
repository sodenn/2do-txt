import { Capacitor } from "@capacitor/core";

export function usePlatform() {
  return Capacitor.getPlatform();
}
