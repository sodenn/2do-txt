import { hasTouchScreen } from "@/native-api/platform";
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
  const { t } = useTranslation();
  useEffect(() => {
    const touchScreen = hasTouchScreen();
    if (!touchScreen || disable) {
      return;
    }
    const instance = PullToRefresh.init({
      mainElement: pullToRefreshSelector,
      getMarkup(): string {
        return ReactDOMServer.renderToString(
          <div className="__PREFIX__box">
            <div className="__PREFIX__content">
              <div className="__PREFIX__icon bg-muted"></div>
              <div className="__PREFIX__text bg-muted"></div>
            </div>
          </div>,
        );
      },
      triggerElement: scrollContainerSelector,
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
  }, [t, disable, pullToRefreshSelector, scrollContainerSelector, onRefresh]);
}
