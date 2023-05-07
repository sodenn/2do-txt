import { useTheme } from "@mui/material";
import PullToRefresh from "pulltorefreshjs";
import { useEffect } from "react";
import ReactDOMServer from "react-dom/server";
import { useTranslation } from "react-i18next";
import { hasTouchScreen } from "../native-api/platform";

export default function usePullToRefresh(
  onRefresh: () => Promise<void>,
  mainElement: string,
  disable = false
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
                style={{ color: theme.palette.text.disabled }}
              ></div>
              <div
                className="__PREFIX__text"
                style={{ color: theme.palette.text.disabled }}
              ></div>
            </div>
          </div>
        );
      },
      instructionsPullToRefresh: t<string>("Pull to refresh"),
      instructionsReleaseToRefresh: t<string>("Release to refresh"),
      instructionsRefreshing: t<string>("Refreshing"),
      onRefresh() {
        return onRefresh();
      },
    });
    return () => {
      instance.destroy();
    };
  }, [disable, mainElement, onRefresh, t, theme.palette.text.disabled]);
}
