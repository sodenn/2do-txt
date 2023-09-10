import { hasTouchScreen } from "@/native-api/platform";
import { useTheme } from "@mui/joy";
import PullToRefresh from "pulltorefreshjs";
import { useEffect } from "react";
import ReactDOMServer from "react-dom/server";
import { useTranslation } from "react-i18next";

interface UsePullToRefreshOptions {
  onRefresh: () => Promise<void>;
  pullToRefreshSelector?: string;
  scrollContainerSelector?: string;
  disable?: boolean;
}

export function usePullToRefresh(options: UsePullToRefreshOptions) {
  const {
    onRefresh,
    pullToRefreshSelector = "body",
    scrollContainerSelector = "body",
    disable = false,
  } = options;
  const theme = useTheme();
  const { t } = useTranslation();
  useEffect(() => {
    const touchScreen = hasTouchScreen();
    if (!touchScreen || disable) {
      return;
    }
    const instance = PullToRefresh.init({
      mainElement: pullToRefreshSelector, // #safe-area
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
      triggerElement: scrollContainerSelector, // #scroll-container
      instructionsPullToRefresh: t("Pull to refresh"),
      instructionsReleaseToRefresh: t("Release to refresh"),
      instructionsRefreshing: t("Refreshing"),
      shouldPullToRefresh() {
        if (disable) {
          return false;
        }
        const scrollContainer = document.querySelector(
          scrollContainerSelector,
        ) as HTMLElement;
        return scrollContainer.scrollTop === 0;
      },
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
    pullToRefreshSelector,
    scrollContainerSelector,
    onRefresh,
    theme.palette.neutral.plainDisabledColor,
  ]);
}
