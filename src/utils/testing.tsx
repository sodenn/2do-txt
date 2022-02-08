import { Filesystem, ReadFileResult } from "@capacitor/filesystem";
import { GetOptions, GetResult, Storage } from "@capacitor/storage";
import i18n from "i18next";
import { PropsWithChildren } from "react";
import { initReactI18next } from "react-i18next";
import { MemoryRouter } from "react-router-dom";
import { AppRouters } from "../components/AppRouter";
import ProviderBundle from "../data/ProviderBundle";
import { Keys } from "./storage";

jest.setTimeout(15000);

jest.mock("../utils/platform", () => ({
  ...jest.requireActual("../utils/platform"),
  useTouchScreen: jest.fn(),
}));

export interface StorageItem {
  key: Keys;
  value: string;
}

interface TestContextProps {
  text?: string;
  storage?: StorageItem[];
}

i18n.use(initReactI18next).init({
  lng: "en",
  fallbackLng: "en",
  resources: { en: { translations: {} } },
});

window.scrollTo = jest.fn();
window.HTMLElement.prototype.scrollIntoView = jest.fn();

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
};

export const todoTxt = `First task @Test
X 2012-01-01 Second task
(A) x Third task @Test`;

export const todoTxtPaths: StorageItem = {
  key: "todo-txt-paths",
  value: JSON.stringify(["todo.txt"]),
};

export const TestContext = (props: TestContextProps) => {
  const { text, storage } = props;

  if (text) {
    mocks.Filesystem.readFile(text);
  }
  if (storage) {
    mocks.Storage.get(storage);
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
  const { text, storage, children } = props;

  if (text) {
    mocks.Filesystem.readFile(text);
  }
  if (storage) {
    mocks.Storage.get(storage);
  }

  return <ProviderBundle>{children}</ProviderBundle>;
};
