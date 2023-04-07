import {
  CloudPreferencesStorage,
  createCloudPreferences,
} from "@cloudstorage/core";
import {
  PreferencesKeys,
  getPreferencesItem,
  removePreferencesItem,
  setPreferencesItem,
} from "../../native-api/preferences";

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
  refsKey: "cloud-storage-refs",
  storage: preferencesStorage,
});
