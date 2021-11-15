import {
  Filesystem,
  ReadFileOptions,
  ReadFileResult,
} from "@capacitor/filesystem";
import i18n from "i18next";
import { SnackbarProvider } from "notistack";
import { PropsWithChildren, Suspense } from "react";
import { initReactI18next } from "react-i18next";
import { MemoryRouter } from "react-router-dom";
import { AppRouterSwitch } from "../components/AppRouter";
import AppTheme from "../components/AppTheme";
import { FilterContextProvider } from "../data/FilterContext";
import { LanguageContextProvider } from "../data/LanguageContext";
import { SettingsContextProvider } from "../data/SettingsContext";
import { SideSheetContextProvider } from "../data/SideSheetContext";
import { TaskProvider } from "../data/TaskContext";

jest.mock("../utils/platform", () => ({
  ...jest.requireActual("../utils/platform"),
  useTouchScreen: jest.fn(),
}));

interface TestContextProps {
  text?: string;
}

i18n.use(initReactI18next).init({
  lng: "en",
  fallbackLng: "en",
  resources: { en: { translations: {} } },
});

const mocks = {
  Filesystem: {
    readFile: (result?: ReadFileResult) => {
      Filesystem.readFile = jest
        .fn()
        .mockImplementation(
          async (options: ReadFileOptions): Promise<ReadFileResult> => {
            if (!result) {
              throw new Error("[Filesystem Mock] File does not exist");
            }
            return result;
          }
        );
    },
  },
};

export const todoTxt = `First task @Test
X 2012-01-01 Second task
(A) x Third task @Test`;

export const TestContext = (props: TestContextProps) => {
  const { text } = props;

  if (text) {
    mocks.Filesystem.readFile({ data: text });
  }

  return (
    <AppTheme>
      <Suspense fallback={null}>
        <SnackbarProvider>
          <LanguageContextProvider>
            <FilterContextProvider>
              <SettingsContextProvider>
                <SideSheetContextProvider>
                  <TaskProvider>
                    <MemoryRouter>
                      <AppRouterSwitch />
                    </MemoryRouter>
                  </TaskProvider>
                </SideSheetContextProvider>
              </SettingsContextProvider>
            </FilterContextProvider>
          </LanguageContextProvider>
        </SnackbarProvider>
      </Suspense>
    </AppTheme>
  );
};

export const EmptyTestContext = (
  props: PropsWithChildren<TestContextProps>
) => {
  const { text, children } = props;

  if (text) {
    mocks.Filesystem.readFile({ data: text });
  }

  return (
    <Suspense fallback={null}>
      <SnackbarProvider>
        <LanguageContextProvider>
          <FilterContextProvider>
            <SettingsContextProvider>
              <SideSheetContextProvider>
                <TaskProvider>{children}</TaskProvider>
              </SideSheetContextProvider>
            </SettingsContextProvider>
          </FilterContextProvider>
        </LanguageContextProvider>
      </SnackbarProvider>
    </Suspense>
  );
};
