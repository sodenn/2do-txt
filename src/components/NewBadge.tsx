import { todayDate } from "@/utils/date";
import { Badge, BadgeProps } from "@mui/joy";
import { isAfter } from "date-fns";
import { forwardRef } from "react";
import { useTranslation } from "react-i18next";

interface NewBadgeProps extends BadgeProps {
  till: Date;
}

export const NewBadge = forwardRef<HTMLDivElement, NewBadgeProps>(
  ({ till, children, ...other }, ref) => {
    const today = todayDate();
    const { t } = useTranslation();

    if (isAfter(today, till)) {
      return <>{children}</>;
    }

    return (
      <Badge
        ref={ref}
        size="sm"
        color="primary"
        badgeContent={t("New")}
        {...other}
      >
        {children}
      </Badge>
    );
  },
);
