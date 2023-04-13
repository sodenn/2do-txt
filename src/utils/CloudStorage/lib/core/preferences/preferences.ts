import { CloudError } from "../errors";
import { uniqueArray } from "../utils";
import {
  CloudPreferencesOptions,
  CloudPreferencesStorage,
  Preferences,
} from "./types";

const defaultStorage: CloudPreferencesStorage = {
  async getItem(key: string) {
    return localStorage.getItem(key);
  },
  async setItem(key: string, value: string) {
    localStorage.setItem(key, value);
  },
  async removeItem(key: string) {
    localStorage.removeItem(key);
  },
};

export const createCloudPreferences = ({
  refsKey = "@cloudstorage.refs",
  storage = defaultStorage,
}: CloudPreferencesOptions): Preferences => {
  const preferences: Preferences = {
    async getRef(identifier) {
      const refs = await preferences.getRefs();
      const ref = refs.find((i) => i.identifier === identifier);
      if (!ref) {
        throw new CloudError({
          cause: `No ref found for identifier: ${identifier}`,
        });
      }
      return ref;
    },
    async getRefs() {
      const items = await storage.getItem(refsKey);
      return items ? JSON.parse(items) : [];
    },
    async setRef(identifier, ref) {
      const refWithIdentifier = { ...ref, identifier };
      const refs = await preferences.getRefs();
      const newRefs = refs.every((r) => r.identifier !== identifier)
        ? [...refs, refWithIdentifier]
        : refs.map((r) =>
            r.identifier === identifier ? refWithIdentifier : r
          );
      const value = JSON.stringify(newRefs);
      await storage.setItem(refsKey, value);
      return refWithIdentifier;
    },
    async removeRef(identifier) {
      const refs = await preferences.getRefs();
      const newRefs = refs.filter((i) => i.identifier !== identifier);
      if (newRefs.length === 0) {
        await storage.removeItem(refsKey);
      } else {
        const value = JSON.stringify(newRefs);
        await storage.setItem(refsKey, value);
      }
    },
    async removeRefs(provider) {
      const refs = await preferences.getRefs();
      await Promise.all(
        refs.map((ref) => {
          if (ref.provider === provider) {
            return preferences.removeRef(ref.identifier);
          }
        })
      );
    },
    async getProviders() {
      const refs = await preferences.getRefs();
      return uniqueArray(refs.map((ref) => ref.provider));
    },
  };
  return preferences;
};
