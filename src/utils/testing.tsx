import { Filesystem, ReadFileResult } from "@capacitor/filesystem";
import { GetOptions, GetResult, Storage } from "@capacitor/storage";
import i18n from "i18next";
import { SnackbarProvider } from "notistack";
import { PropsWithChildren, Suspense } from "react";
import { initReactI18next } from "react-i18next";
import { MemoryRouter } from "react-router-dom";
import { AppRouters } from "../components/AppRouter";
import { AppTheme } from "../data/AppThemeContext";
import { ConfirmationDialogContextProvider } from "../data/ConfirmationDialogContext";
import { FilterContextProvider } from "../data/FilterContext";
import { MigrationContextProvider } from "../data/MigrationContext";
import { SettingsContextProvider } from "../data/SettingsContext";
import { SideSheetContextProvider } from "../data/SideSheetContext";
import { TaskProvider } from "../data/TaskContext";
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
    <AppTheme>
      <SnackbarProvider>
        <Suspense fallback={null}>
          <MigrationContextProvider>
            <ConfirmationDialogContextProvider>
              <SettingsContextProvider>
                <FilterContextProvider>
                  <SideSheetContextProvider>
                    <TaskProvider>
                      <MemoryRouter>
                        <AppRouters />
                      </MemoryRouter>
                    </TaskProvider>
                  </SideSheetContextProvider>
                </FilterContextProvider>
              </SettingsContextProvider>
            </ConfirmationDialogContextProvider>
          </MigrationContextProvider>
        </Suspense>
      </SnackbarProvider>
    </AppTheme>
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

  return (
    <SnackbarProvider>
      <Suspense fallback={null}>
        <MigrationContextProvider>
          <ConfirmationDialogContextProvider>
            <SettingsContextProvider>
              <FilterContextProvider>
                <SideSheetContextProvider>
                  <TaskProvider>{children}</TaskProvider>
                </SideSheetContextProvider>
              </FilterContextProvider>
            </SettingsContextProvider>
          </ConfirmationDialogContextProvider>
        </MigrationContextProvider>
      </Suspense>
    </SnackbarProvider>
  );
};
