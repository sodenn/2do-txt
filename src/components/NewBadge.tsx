import {
  NotificationBadge,
  NotificationBadgeProps,
} from "@/components/ui/notification-badge";
import { todayDate } from "@/utils/date";
import { isAfter } from "date-fns";
import { PropsWithChildren, forwardRef } from "react";
import { useTranslation } from "react-i18next";

interface NewBadgeProps extends PropsWithChildren<NotificationBadgeProps> {
  till: Date;
}

export const NewBadge = forwardRef<HTMLDivElement, NewBadgeProps>(
  ({ till, children }) => {
    const today = todayDate();
    const { t } = useTranslation();

    if (isAfter(today, till)) {
      return <>{children}</>;
    }

    return <NotificationBadge label={t("New")}>{children}</NotificationBadge>;
  },
);
