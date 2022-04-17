import { Capacitor } from "@capacitor/core";
import { Filesystem, ReadFileResult } from "@capacitor/filesystem";
import { GetOptions, GetResult, Storage } from "@capacitor/storage";
import i18n from "i18next";
import { PropsWithChildren } from "react";
import { initReactI18next } from "react-i18next";
import { MemoryRouter } from "react-router-dom";
import { AppRouters } from "../components/AppRouter";
import ProviderBundle from "../data/ProviderBundle";
import { SecureStorageKeys } from "./secure-storage";
import { StorageKeys } from "./storage";

jest.setTimeout(15000);

jest.mock("../utils/platform", () => ({
  ...jest.requireActual("../utils/platform"),
  useTouchScreen: jest.fn(),
}));

export interface StorageItem {
  key: StorageKeys;
  value: string;
}

export interface SecureStorageItem {
  key: SecureStorageKeys;
  value: string;
}

export interface TestContextProps {
  text?: string;
  storage?: StorageItem[];
  secureStorage?: SecureStorageItem[];
  platform?: string;
}

i18n.use(initReactI18next).init({
  lng: "en",
  fallbackLng: "en",
  resources: { en: { translations: {} } },
});

window.scrollTo = jest.fn();
window.HTMLElement.prototype.scrollIntoView = jest.fn();

// @ts-ignore
global.Keychain = {
  get: (success: (key: string) => string, error: () => any, key: string) => {
    const value = sessionStorage.getItem("SecureStorage." + key);
    success(value!);
  },
  set: (
    success: () => string,
    error: () => any,
    key: string,
    value: string
  ) => {
    sessionStorage.setItem("SecureStorage." + key, value);
    success();
  },
  remove: (success: () => string, error: () => any, key: string) => {
    sessionStorage.removeItem("SecureStorage." + key);
    success();
  },
};

const mocks = {
  Filesystem: {
    readFile: (text: string) => {
      Filesystem.readFile = jest
        .fn()
        .mockImplementation(async (): Promise<ReadFileResult> => {
          if (!text) {
            throw new Error("[Filesystem Mock] File does not exist");
          }
          return { data: text };
        });
    },
  },
  Storage: {
    get: (storage: StorageItem[]) => {
      Storage.get = jest
        .fn()
        .mockImplementation(async (option: GetOptions): Promise<GetResult> => {
          const item = storage.find((i) => i.key === option.key);
          return { value: item ? item.value : null };
        });
    },
  },
  SecureStorage: {
    setItems: (storage: SecureStorageItem[]) => {
      storage.forEach((item) => {
        sessionStorage.setItem("SecureStorage." + item.key, item.value);
      });
    },
  },
  Platform: {
    getPlatform: (platform: string) => {
      Capacitor.getPlatform = jest.fn().mockImplementation(() => platform);
    },
  },
};

export const todoTxt = `First task @Test
X 2012-01-01 Second task
(A) x Third task @Test`;

export const todoTxtPaths: StorageItem = {
  key: "todo-txt-paths",
  value: JSON.stringify([process.env.REACT_APP_DEFAULT_FILE_NAME]),
};

export const TestContext = (props: TestContextProps) => {
  const { text, storage, secureStorage, platform } = props;

  if (text) {
    mocks.Filesystem.readFile(text);
  }
  if (storage) {
    mocks.Storage.get(storage);
  }
  if (secureStorage) {
    mocks.SecureStorage.setItems(secureStorage);
  }
  if (platform) {
    mocks.Platform.getPlatform(platform);
  }

  return (
    <ProviderBundle>
      <MemoryRouter>
        <AppRouters />
      </MemoryRouter>
    </ProviderBundle>
  );
};

export const EmptyTestContext = (
  props: PropsWithChildren<TestContextProps>
) => {
  const { text, storage, secureStorage, platform, children } = props;

  if (text) {
    mocks.Filesystem.readFile(text);
  }
  if (storage) {
    mocks.Storage.get(storage);
  }
  if (secureStorage) {
    mocks.SecureStorage.setItems(secureStorage);
  }
  if (platform) {
    mocks.Platform.getPlatform(platform);
  }

  return (
    <ProviderBundle>
      <div data-testid="page">{children}</div>
    </ProviderBundle>
  );
};
