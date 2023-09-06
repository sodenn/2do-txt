import { todayDate } from "@/utils/date";
import { Badge } from "@mui/joy";
import { isAfter } from "date-fns";
import { PropsWithChildren } from "react";
import { useTranslation } from "react-i18next";

interface NewBadgeProps extends PropsWithChildren {
  till: Date;
}

export function NewBadge({ till, children }: NewBadgeProps) {
  const today = todayDate();
  const { t } = useTranslation();

  if (isAfter(today, till)) {
    return <>{children}</>;
  }

  return (
    <Badge size="sm" color="primary" badgeContent={t("New")}>
      {children}
    </Badge>
  );
}
