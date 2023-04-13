import {
  PreferencesKeys,
  getPreferencesItem,
  removePreferencesItem,
  setPreferencesItem,
} from "../../native-api/preferences";
import { CloudPreferencesStorage, createCloudPreferences } from "./lib";

export const preferencesStorage: CloudPreferencesStorage = {
  async getItem(key: string) {
    return getPreferencesItem(key as PreferencesKeys);
  },
  async setItem(key: string, value: string) {
    await setPreferencesItem(key as PreferencesKeys, value);
  },
  async removeItem(key: string) {
    await removePreferencesItem(key as PreferencesKeys);
  },
};

export const cloudStoragePreferences = createCloudPreferences({
  refsKey: "cloud-file-refs",
  storage: preferencesStorage,
});
