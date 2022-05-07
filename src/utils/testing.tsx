import { Capacitor } from "@capacitor/core";
import { Filesystem, ReadFileResult } from "@capacitor/filesystem";
import { ReadFileOptions } from "@capacitor/filesystem/dist/esm/definitions";
import { GetOptions, GetResult, Storage } from "@capacitor/storage";
import { createEvent, fireEvent } from "@testing-library/react";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { MemoryRouter } from "react-router-dom";
import { AppRouters } from "../components/AppRouter";
import { useLoading } from "../data/LoadingContext";
import ProviderBundle from "../data/ProviderBundle";
import { WithChildren } from "../types/common";
import { SecureStorageKeys } from "./secure-storage";
import { StorageKeys } from "./storage";

jest.setTimeout(15000);

jest.mock("../utils/platform", () => ({
  ...jest.requireActual("../utils/platform"),
  useTouchScreen: jest.fn(),
}));

jest.mock("slate-react", () => {
  const { ReactEditor, ...rest } = jest.requireActual("slate-react");
  const toDOMRange = ReactEditor.toDOMRange;
  ReactEditor.toDOMRange = (editor: any, target: any) => {
    const domRange = toDOMRange(editor, target);
    domRange.getBoundingClientRect = jest.fn();
  };
  return {
    ...rest,
    ReactEditor,
  };
});

export interface FilesystemItem {
  path: string;
  value: string;
}

export interface StorageItem {
  key: StorageKeys;
  value: string;
}

export interface SecureStorageItem {
  key: SecureStorageKeys;
  value: string;
}

export interface TestContextProps extends WithChildren {
  text?: string;
  filesystem?: FilesystemItem[];
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
    readFile: (textOrItems: string | FilesystemItem[]) => {
      Filesystem.readFile = jest
        .fn()
        .mockImplementation(
          async (opt: ReadFileOptions): Promise<ReadFileResult> => {
            if (!textOrItems) {
              throw new Error("[Filesystem Mock] File does not exist");
            }
            if (typeof textOrItems === "string") {
              return { data: textOrItems };
            } else {
              const data = textOrItems.find((i) => i.path === opt.path);
              if (data) {
                return { data: data.value };
              } else {
                throw new Error("[Filesystem Mock] File does not exist");
              }
            }
          }
        );
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

export const pasteText = (editor: HTMLElement, text: string) => {
  const event = createEvent.paste(editor, {
    clipboardData: {
      types: ["text/plain"],
      getData: () => text,
    },
  });
  fireEvent(editor, event);
};

export const todoTxt = `First task @Test
X 2012-01-01 Second task
(A) x Third task @Test`;

export const todoTxtFilesystemItem: FilesystemItem = {
  path: process.env.REACT_APP_DEFAULT_FILE_NAME,
  value: todoTxt,
};

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

const Page = ({ children }: WithChildren) => {
  const { loading } = useLoading();
  return <div data-testid={loading ? "loading" : "page"}>{children}</div>;
};

export const EmptyTestContext = (props: TestContextProps) => {
  const { text, filesystem, storage, secureStorage, platform, children } =
    props;

  if (filesystem) {
    mocks.Filesystem.readFile(filesystem);
  } else if (text) {
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
      <Page>{children}</Page>
    </ProviderBundle>
  );
};
