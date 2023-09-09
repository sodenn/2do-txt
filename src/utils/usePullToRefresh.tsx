import { hasTouchScreen } from "@/native-api/platform";
import { useTheme } from "@mui/joy";
import PullToRefresh from "pulltorefreshjs";
import { useEffect } from "react";
import ReactDOMServer from "react-dom/server";
import { useTranslation } from "react-i18next";

export function usePullToRefresh(
  onRefresh: () => Promise<void>,
  mainElement: string,
  disable = false,
) {
  const theme = useTheme();
  const { t } = useTranslation();
  useEffect(() => {
    const touchScreen = hasTouchScreen();
    if (!touchScreen || disable) {
      return;
    }
    const instance = PullToRefresh.init({
      mainElement,
      getMarkup(): string {
        return ReactDOMServer.renderToString(
          <div className="__PREFIX__box">
            <div className="__PREFIX__content">
              <div
                className="__PREFIX__icon"
                style={{ color: theme.palette.neutral.plainDisabledColor }}
              ></div>
              <div
                className="__PREFIX__text"
                style={{ color: theme.palette.neutral.plainDisabledColor }}
              ></div>
            </div>
          </div>,
        );
      },
      instructionsPullToRefresh: t("Pull to refresh"),
      instructionsReleaseToRefresh: t("Release to refresh"),
      instructionsRefreshing: t("Refreshing"),
      onRefresh() {
        return onRefresh();
      },
    });
    return () => {
      instance.destroy();
    };
  }, [
    t,
    disable,
    mainElement,
    onRefresh,
    theme.palette.neutral.plainDisabledColor,
  ]);
}
